import { SqlError } from '../types/SqlError';

export function sqlError(err: any): SqlError {
  const result = {
    message: err.message,
    code: err.code,
    sqlMessage: err.sqlMessage,
    sqlCode: err.code,
    sqlQuery: err.sql
  };

  return result;
}
