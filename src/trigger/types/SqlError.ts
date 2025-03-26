export interface SqlError {
  message: string;
  code?: string;
  sqlMessage?: string;
  sqlCode?: string;
  sqlQuery?: string;
}
