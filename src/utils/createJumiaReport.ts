import { Logger } from '@trigger.dev/sdk';
import moment from 'moment';
import { query } from '../db/sdk';
import { getGateway } from './implementedGateways';
import _ from 'lodash';

export function isSynthetic(gateway_transaction_id: string) {
  if (!gateway_transaction_id) return;
  if (
    gateway_transaction_id.includes('SORE') ||
    gateway_transaction_id.includes('EBRE') ||
    gateway_transaction_id.includes('SPRE')
  )
    return true;
  return false;
}

function getCountryFromCurrency(currency: string) {
  switch (currency) {
    case 'EGP':
      return 'Egypt';
    case 'NGN':
      return 'Nigeria';
    case 'CFA':
      return 'Ivory Coast';
    case 'XOF':
      return 'Ivory Coast';
    case 'MAD':
      return 'Morocco';
    case 'KES':
      return 'Kenya';

    default:
      return '?';
  }
}

function getGatewayName(gateway_id: string) {
  /*const name = implementedGateways.filter(
      (g: GatewayDto) => g.name == gateway_id,
    );*/
  let name = getGateway(gateway_id);

  if (name) return name.label;
  return gateway_id;
}

export async function createJumiaReport(from: string, logger: Logger, to?: string, cashflow_source?: string) {
  if (!from) from = moment().format('YYYY-MM-DD');
  else from = moment(from).format('YYYY-MM-DD');

  // TODO -- migrate this created_at with a succeeded_at, which may be on the next day for late night transactions
  // NEED TO DO THE SAME FOR REFUNDS

  let currency = 'EGP';
  let gateway = 'souhoola';

  if (cashflow_source) {
    const split = cashflow_source.split('_');
    if (split.length >= 2) {
      //currency = split[split.length-1];
      //gateway = split[0];
      currency = _.last(split);
      gateway = split.splice(0, split.length - 1).join('_');
    }
  } else {
    cashflow_source = `${gateway}_${currency}`;
  }

  logger.log(`Creating Jumia Report for ${cashflow_source} from ${from} to ${to}`);

  let transactions;
  const sql = `SELECT * FROM transactions WHERE created_at > '${from}' AND created_at < '${moment(to || from)
    .add(1, 'day')
    .format(
      'YYYY-MM-DD'
    )}' and status = 'success' and currency = '${currency}' and gateway = '${gateway}' order by id asc`;
  logger.log(sql);
  transactions = await query(sql);
  let netAmountDue = 0;

  transactions = transactions.map((tx) => {
    return {
      country: getCountryFromCurrency(tx.currency),
      gateway_name: getGatewayName(tx.gateway),
      merchant_name: 'Jumia Mall',
      jumia_reference: tx.idempotency_key,
      retrieval_reference: 'TX-' + tx.id,
      retrieval_related_reference: tx.id,
      gateway_reference: tx.gateway_transaction_id || `${tx.so_tx_id}/${tx.so_loan_id}`,
      transaction_date: moment(tx.created_at).format('YYYY-MM-DD'),
      transaction_type: 'transaction',
      transaction_amount: tx.amount
    };
  });

  logger.log(`Found ${transactions.length} transactions, checking refunds now...`);

  let refunds = await query(
    `SELECT refunds.*, transactions.gateway as gateway FROM refunds LEFT JOIN transactions ON refunds.transaction_id = transactions.id WHERE refunds.created_at > '${from}' AND refunds.created_at < '${moment(
      to || from
    )
      .add(1, 'day')
      .format(
        'YYYY-MM-DD'
      )}' and refunds.status = 'success' and refunds.currency = '${currency}' and transactions.gateway = '${gateway}' order by id asc`
  );
  refunds = refunds.map((r) => {
    return {
      country: getCountryFromCurrency(r.currency),
      gateway_name: getGatewayName(r.gateway),
      merchant_name: 'Jumia Mall',
      jumia_reference: r.idempotency_key,
      retrieval_reference: 'RF-' + r.id,
      retrieval_related_reference: r.transaction_id,
      gateway_reference: r.gateway_transaction_id,
      transaction_date: moment(r.created_at).format('YYYY-MM-DD'),
      transaction_type: 'refund' + (isSynthetic(r.gateway_transaction_id) ? ' (synthetic)' : ''),
      transaction_amount: r.amount * -1
    };
  });

  logger.log(`Found ${refunds.length} refunds, sorting both now`);

  transactions = transactions.concat(refunds);
  transactions.sort((a, b) => {
    return a.retrieval_related_reference - b.retrieval_related_reference;
  });

  transactions = transactions.map((t) => {
    t.retrieval_related_reference = 'TX-' + t.retrieval_related_reference;
    netAmountDue += t.transaction_amount;
    t.balance = netAmountDue / 100;
    t.transaction_amount /= 100;
    return t;
  });

  if (transactions.length == 0) {
    logger.log('No transactions/refunds in the file, population empty for headers');
    transactions.push({
      country: null,
      gateway_name: null,
      merchant_name: null,
      jumia_reference: null,
      retrieval_reference: null,
      retrieval_related_reference: null,
      gateway_reference: null,
      transaction_date: null,
      transaction_type: null,
      transaction_amount: null
    });
  }

  return transactions;
}
