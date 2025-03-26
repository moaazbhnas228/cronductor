import { err, ok } from 'neverthrow';
import pool from './db';
import { sqlError } from '../utils/sqlError';
import { getHours, getMinutes } from 'date-fns';

type AsyncFunction<Params extends any[], ReturnType> = (...params: Params) => Promise<ReturnType>;

function queryWrapper<Params extends any[], ReturnType = any>(cb: AsyncFunction<Params, ReturnType>) {
  return async function wrapper(...params: Params) {
    try {
      const result = await cb(...params);
      return ok(result);
    } catch (error) {
      console.error('🔴 SQL Error:', sqlError(error));
      return err(sqlError(error));
    }
  };
}

export const getSuccessfulTransactionsFromTo = queryWrapper(async (from: string, to: string) => {
  const [rows] = await pool.query(`SELECT id FROM transactions WHERE created_at BETWEEN ? AND ? AND status = ?`, [
    from,
    to,
    'success'
  ]);
  return rows as any;
});

export const getHistoricalSuccessfulAverageForTimeRange = queryWrapper(async (from: string, to: string, days = 30) => {
  const fromHour = getHours(from);
  const fromMinute = getMinutes(from);
  const toMinute = getMinutes(to);

  const query = `
  SELECT COUNT(id) / COUNT(DISTINCT DATE(created_at)) AS average_transactions
  FROM transactions
  WHERE HOUR(created_at) = ${fromHour}
  AND MINUTE(created_at) BETWEEN ${fromMinute} AND ${toMinute}
  AND status = 'success'
  AND created_at >= DATE_SUB('${from}', INTERVAL ${days} DAY)
  AND created_at < '${from}'
  `;

  const [rows] = await pool.query(query);
  return rows[0]?.average_transactions || 0;
});

export async function query(query: string) {
  const [rows] = await pool.query(query);

  return rows as any;
}
