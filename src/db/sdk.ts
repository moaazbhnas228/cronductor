import { err, ok } from 'neverthrow';
import pool from './db';
import { sqlError } from '../utils/sqlError';

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

export const getSuccessfulTransactionsFromTo = queryWrapper(async function getSuccessfulTransactionsFromTo(
  from: string,
  to: string
) {
  const [rows] = await pool.query(`SELECT id FROM transactions WHERE created_at BETWEEN ? AND ? AND status = ?`, [
    from,
    to,
    'success'
  ]);
  return rows as any;
});

export async function query(query: string) {
  const [rows] = await pool.query(query);

  return rows as any;
}
