import moment from 'moment';
import { getSyntheticRefunds } from './getSyntheticRefunds';
import { SyntheticRefundsVendorCode } from './syntheticRefundsVendorsCode';
import { json2csv } from 'json-2-csv';

export async function getSpotitSyntheticRefunds(page?: number, date?: string, format: string = 'json') {
  //if (!date) date = moment().subtract(1, 'day').format('YYYY-MM-DD');
  if (page < 0) page = 1;
  const refunds = await getSyntheticRefunds(SyntheticRefundsVendorCode.Spotit, page, date);

  let formattedRefunds = [];
  for (let refund of refunds) {
    const split = refund.transaction.xTokenId.split('/');
    formattedRefunds.push({
      'Spotit Merchant Code': split[0],
      'Spotit Checkout Code': split[1],
      'Spotit Bank ID': split[2],
      'Spotit Bank Name': split[3],
      'Spotit Loan Reference': refund.transaction.gateway_transaction_id,
      'Initial Transaction Amount': refund.transaction.amount,
      'Refunded Amount': refund.amount / 100,
      Currency: refund.currency,
      'Refund Date': moment(refund.created_at).format('Y-MM-DD'),
      'Orchestrapay Synthetic Reference': refund.gateway_transaction_id,
      'Orchestrapay Original Transaction ID': refund.transaction.id,
      'Orchestrapay Synthetic Refund ID': refund.id,
      'Orchestrapay Transaction UUID': refund.transaction.uuid,
      'JumiaPay Idempotency Key': refund.transaction.idempotency_key
    });
  }

  if (format == 'csv') return json2csv(formattedRefunds);
  return formattedRefunds;
}
