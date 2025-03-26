import { Attachment, EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { json2csv } from 'json-2-csv';
import * as os from 'os';
import { format } from 'date-fns/format';
import { jumiaMailingList } from './jumiaMailingList';
import { GatewayDto, implementedGateways } from './implementedGateways';
import { subDays } from 'date-fns';
import { createJumiaReport } from './createJumiaReport';
import { err, ok } from 'neverthrow';
import { LoggerAPI } from '@trigger.dev/core/dist/commonjs/v3/logger';

export enum RecoSendType {
  FTP = 'ftp',
  EMAIL = 'email',
  EMAIL_AND_FTP = 'email_and_ftp'
}

export async function sendReconciliation(
  gateways: string[] = [],
  type: RecoSendType = RecoSendType.EMAIL_AND_FTP,
  logger: LoggerAPI
) {
  const date = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  for (let gateway of implementedGateways) {
    if (gateways.length == 0 || gateways.includes(gateway.name)) {
      const result = await logger.trace(`send-reconciliation-${gateway.name}`, async (span) => {
        span.setAttribute('date', date);
        span.setAttribute('gateway', gateway.name);

        for (let currency of gateway.currencies) {
          for (let subGateway of gateway.subGateways || ['']) {
            let gatewayName = subGateway.length == 0 ? gateway.name : gateway.name + '@' + subGateway;

            // logger.log(`Sending merchant reconciliation report to ${gateway.label} (${currency})`);
            const report = await createJumiaReport(date, logger, date, `${gatewayName}_${currency}`);

            const result = await sendReconciliationSingleGateway(
              report,
              gateway,
              gatewayName,
              currency,
              type,
              logger,
              date
            );

            if (result.isErr()) {
              return err(result.error);
            }
          }
        }
        return ok({ success: true });
      });

      if (result.isErr()) {
        return err(result.error);
      }
    } else {
      // logger.log(`NOT Processing ${gateway.name} as it was not provided in the list (${gateways.join(',')})`);
    }
  }

  return ok({ success: true });
}

export default async function sendReconciliationSingleGateway(
  data: any,
  gateway: GatewayDto,
  gatewayName: string,
  currency: string,
  type: RecoSendType = RecoSendType.FTP,
  logger: LoggerAPI,
  date?: string,
  recipientsList?: string[],
  filename?: string
) {
  if (!recipientsList) recipientsList = [];
  let recipients: Recipient[] = [];
  let bcc: Recipient[] = [];
  let attachments: Attachment[] = [];

  /**
   * Compute recipients list
   */
  const ftpRecipient = new Recipient(
    process.env.NODE_ENV == 'production'
      ? 'op-jpay-prd.fvzrgr@upload.easyftp.io'
      : 'op-jpay-stg.99t5ef@upload.easyftp.io'
  );
  const from = 'finops@orchestrapay.com';

  if (type === RecoSendType.FTP) {
    recipients.push(ftpRecipient);
  } else if (type === RecoSendType.EMAIL_AND_FTP) {
    recipients.push(new Recipient(from));
    bcc.push(ftpRecipient);
  }

  if (process.env.NODE_ENV == 'production' && (type === RecoSendType.EMAIL_AND_FTP || type === RecoSendType.EMAIL)) {
    // Add the gateways mailing lists
    if (gateway.mailingList && recipientsList.length == 0) {
      for (let email of gateway.mailingList) {
        if (
          (email.split('@')[1] == gateway.domain ||
            email.split('@')[1] == 'jumia.com' ||
            email.split('@')[1] == 'orchestrapay.com') &&
          recipients.length < 50
        )
          recipients.push(new Recipient(email));
      }
    }
    // Add the merchant mailing list
    if (recipientsList.length == 0)
      for (let email of jumiaMailingList) {
        if ((email.split('@')[1] == 'jumia.com' || email.split('@')[1] == 'orchestrapay.com') && recipients.length < 50)
          recipients.push(new Recipient(email));
      }

    // Fill recipients list from the list passed by parameters
    if (recipientsList.length > 0) {
      for (let email of recipientsList) {
        if (
          email.split('@')[1] == gateway.domain ||
          email.split('@')[1] == 'jumia.com' ||
          email.split('@')[1] == 'orchestrapay.com'
        ) {
          if (recipients.length < 50) {
            recipients.push(new Recipient(email));
          }
        }
      }
    }
  }

  /**
   * Compute template parameters
   */
  const variables = recipients.map((r: Recipient) => {
    return {
      email: r.email,
      substitutions: [
        {
          var: 'date',
          value: `${date}`
        },
        {
          var: 'transactions',
          value:
            data.length == 0 || data[0]?.transaction_type == null
              ? '0'
              : `${Intl.NumberFormat('en-US').format(
                  data.filter((d) => d.transaction_type.includes('transaction')).length
                )}`
        },
        {
          var: 'refunds',
          value:
            data.length == 0 || data[0]?.transaction_type == null
              ? '0'
              : `${Intl.NumberFormat('en-US').format(data.filter((d) => d.transaction_type.includes('refund')).length)}`
        },
        {
          var: 'currency',
          value: currency
        },
        {
          var: 'balance',
          value: `${Intl.NumberFormat('en-US').format(data.length == 0 ? 0 : data[data.length - 1]?.balance || 0)}`
        },
        {
          var: 'gateway_name',
          value: gateway.label
        },
        {
          var: 'gateway_logo_url',
          value: gateway.logoUrl
        }
      ]
    };
  });

  /**
   * Create attachment
   */
  const fileName = filename
    ? filename.replace('{date}', format(date, 'yyyyMMdd'))
    : `orchestrapay_${gatewayName}_${currency.toUpperCase()}_${format(date, 'yyyyMMdd')}.csv`;
  if (data.length > 0) {
    //let csvFile = Buffer.from(json2csv(data), 'binary').toString('base64');
    let csvFile = json2csv(data);
    if (csvFile.split(os.EOL)?.[1]?.split(',')?.[0] == 'null') {
      csvFile = csvFile.split(os.EOL)[0];
    }

    const base64Content = Buffer.from(csvFile).toString('base64');
    attachments.push(new Attachment(base64Content, fileName));
  }

  /**
   * Send everything
   */
  try {
    await new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY || ''
    }).email.send(
      new EmailParams()
        .setFrom(new Sender(from))
        .setTo([new Recipient('moaaz.bhnas@orchestrapay.com')])
        .setBcc(bcc)
        .setAttachments(attachments)
        .setSubject(
          `Daily Reconciliation Files - JumiaPay / ${gatewayName} - ${date}${
            process.env.NODE_ENV != 'production' ? ' - STAGING' : ''
          }`
        )
        .setTemplateId('v69oxl5zdp2l785k')
        .setVariables(variables)
    );
    logger.log(`Successfully sent reconciliation report.`, {
      variables,
      recipients,
      attachments,
      bcc,
      from,
      env: process.env.NODE_ENV,
      send_type: type
    });
    return ok({ success: true });
  } catch (e: any) {
    return err({ success: false, message: e.message });
  }
}
