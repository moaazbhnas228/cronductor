import { Attachment, EmailParams, MailerSend, Recipient, Sender } from 'mailersend';
import { getGateway } from './implementedGateways';
import { jumiaMailingList } from './jumiaMailingList';
import { json2csv } from 'json-2-csv';
import _ from 'lodash';
import { Logger } from '@trigger.dev/sdk';
import { err, ok } from 'neverthrow';

export async function sendSpotitRefundsEmail(date: string, syntheticRefunds: any, logger: Logger) {
  //const date = moment().subtract(1, 'day').format('%Y-%m-%d');

  const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY || ''
  });

  const sentFrom = new Sender('finops@orchestrapay.com', 'FinOps Orchestrapay');
  const spotitMailingList = getGateway('spotit');
  const recipients = [
    //new Recipient("payment.ops@jumia.com")
    //new Recipient('pablo.albrecht.uk@gmail.com'),
    new Recipient('finops@orchestrapay.com'),
    ...jumiaMailingList.map((v) => new Recipient(v)),
    ...spotitMailingList.mailingList.map((e) => new Recipient(e))
  ];

  const variables = [
    {
      email: 'finops@orchestrapay.com',
      substitutions: [
        { var: 'date', value: '' + date },
        {
          var: 'amount',
          value: '' + _.sumBy(syntheticRefunds, (r) => r['Refunded Amount'])
        },
        {
          var: 'refunds',
          value: '' + syntheticRefunds.length
        },
        {
          var: 'currency',
          value: 'EGP'
        }
      ]
    }
  ];

  const attachments = [];
  if (syntheticRefunds.length > 0)
    attachments.push(
      new Attachment(
        Buffer.from(json2csv(syntheticRefunds), 'binary').toString('base64'),
        `${date}_Synthetic_Refunds_Orchestrapay.csv`
      )
    );

  const cc = []; //jumiaMailingList;

  const emailParams = (new EmailParams() as any)
    .setFrom(sentFrom)
    .setTo([new Recipient('moaaz.bhnas@orchestrapay.com')])
    .setCc(cc)
    .setAttachments(attachments)
    .setSubject('Synthetic Refunds - Spotit / JumiaPay - ' + date)
    .setTemplateId('o65qngk0y7w4wr12');
  // .setVariables(variables);

  try {
    const c = await mailerSend.email.send(emailParams);
    logger.log(
      `Successfully sent Synthetic refunds report to Spot-it by e-mail with CSV attachment to finops@orchestrapay.com`,
      { variables, recipients }
    );

    return ok({ success: true });
  } catch (e: any) {
    logger.error(`Could not send Spotit Virtual Refunds e-mail`, {
      message: e.message,
      error: e
    });

    return err({ message: e.message, success: false });
  }
}
