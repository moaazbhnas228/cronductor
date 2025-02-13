import { query } from '../db/sdk';
import { SyntheticRefundsVendorCode } from './syntheticRefundsVendorsCode';

export async function getSyntheticRefunds(
  //date: string,
  vendorCode: SyntheticRefundsVendorCode,
  page: number = 1,
  date?: string
) {
  const pageSize = 500;
  const offset = (page - 1) * pageSize;

  if (!date) {
    // Pagination without date filter
    return await query(`
        SELECT r.*, t.* 
        FROM refunds r
        LEFT JOIN transactions t ON r.transaction_id = t.id
        WHERE r.gateway_transaction_id LIKE '%${vendorCode}%'
        ORDER BY r.id DESC
        LIMIT ${pageSize} OFFSET ${offset};
      `);
  } else {
    // Filtering by date
    return await query(`
        SELECT r.*, t.* 
        FROM refunds r
        LEFT JOIN transactions t ON r.transaction_id = t.id
        WHERE r.gateway_transaction_id LIKE '%${vendorCode}%'
        AND DATE(r.created_at) = '${date}'
        ORDER BY r.id DESC;
      `);
  }
}
