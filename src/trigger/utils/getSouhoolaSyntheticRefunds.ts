import moment from 'moment';
import { getSyntheticRefunds } from './getSyntheticRefunds';
import { SyntheticRefundsVendorCode } from './syntheticRefundsVendorsCode';
import { json2csv } from 'json-2-csv';

export async function getSouhoolaSyntheticRefunds(page?: number, date?: string, format: string = 'json') {
  //if (!date) date = moment().subtract(1, 'day').format('YYYY-MM-DD');
  if (page < 0) page = 1;
  const refunds = await getSyntheticRefunds(SyntheticRefundsVendorCode.Souhoola, page, date);

  let formattedRefunds = [];
  for (let refund of refunds) {
    formattedRefunds.push({
      'Souhoola Original Transaction ID': refund.transaction.souhoolaTransactionId,
      'Souhoola Original Loan ID': refund.transaction.souhoolaLoanNumber,
      'Souhoola Refund Transaction ID (if any)': refund.transaction.souhoolaRefundTxId,
      'Souhoola Refund Loan ID (if any)': refund.transaction.souhoolaRefundLoanNumber,
      'Refunded Amount': refund.amount / 100,
      Currency: refund.currency,
      'Refund Date': moment(refund.created_at).format('Y-MM-DD'),
      'Orchestrapay Synthetic Reference': refund.gateway_transaction_id,
      'Orchestrapay Original Transaction ID': refund.transaction.id,
      'Orchestrapay Synthetic Refund ID': refund.id,
      'Orchestrapay Transaction UUID': refund.transaction.uuid,
      'JumiaPay Idempotency Key': refund.transaction.idempotency_key,
      'Initial Transaction Amount': refund.transaction.amount,
      'Initial Transaction Offer Code': refund.transaction.souhoolaOfferCode,
      'Initial Transaction Selected Tenure': refund.transaction.souhoolaSelectedTenure
    });
  }

  if (format == 'csv') return json2csv(formattedRefunds);
  return formattedRefunds;
}
