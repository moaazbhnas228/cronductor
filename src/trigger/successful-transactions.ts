import { logger, schedules, wait } from '@trigger.dev/sdk/v3';
import { format } from 'date-fns';
import { getSuccessfulTransactionsFromTo } from '../db/sdk';

export const successfulTransactions = schedules.task({
  id: 'successful-transactions',
  // Every 5 mins
  cron: '*/5 * * * *',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    const to = format(payload.timestamp, 'yyyy-MM-dd HH:mm:ss'); // current timestamp from payload
    const from = format(payload.lastTimestamp, 'yyyy-MM-dd HH:mm:ss'); // 5 minutes ago

    logger.info(`🔵 Getting successful transactions from ${from} to ${to}`, {
      from,
      to
    });

    const transactionsResult = await getSuccessfulTransactionsFromTo(from, to);

    if (transactionsResult.isErr()) {
      logger.error(`🔴 Error getting successful transactions from ${from} to ${to}`, {
        error: transactionsResult.error,
        from,
        to
      });
      throw new Error(transactionsResult.error.message);
    }

    if (transactionsResult.value.length === 0) {
      logger.info(`🔴 No successful transactions found from ${from} to ${to}`, {
        from,
        to
      });
      throw new Error(`🔴 No successful transactions found from ${from} to ${to}`);
    }

    logger.info(
      `🟢 Successfully got ${transactionsResult.value.length} successful transactions from ${from} to ${to}`,
      { transactions: transactionsResult.value }
    );
  }
});
