import { logger, schedules } from '@trigger.dev/sdk/v3';
import { format } from 'date-fns';
import { getHistoricalSuccessfulAverageForTimeRange, getSuccessfulTransactionsFromTo } from '../db/sdk';
import { formatInTimeZone } from 'date-fns-tz';

const HISTORICAL_DAYS = 30;
const HISTORICAL_AVERAGE_THRESHOLD = 5;

export const successfulTransactions = schedules.task({
  id: 'successful-transactions',
  // Every 5 mins
  cron: '*/5 * * * *',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    const to = formatInTimeZone(payload.timestamp, 'UTC', 'yyyy-MM-dd HH:mm:ss'); // current timestamp from payload
    const from = formatInTimeZone(payload.lastTimestamp, 'UTC', 'yyyy-MM-dd HH:mm:ss'); // 5 minutes ago

    logger.info(`🔵 Getting successful transactions from ${from} to ${to}`, {
      from,
      to
    });

    const transactionsResult = await getSuccessfulTransactionsFromTo(from, to);

    if (transactionsResult.isErr()) {
      logger.error(`🔴 Error getting successful transactions.`, {
        error: transactionsResult.error,
        from,
        to
      });
      throw new Error(transactionsResult.error.message);
    }

    const historicalAverage = await getHistoricalSuccessfulAverageForTimeRange(from, to, HISTORICAL_DAYS);

    if (historicalAverage.isErr()) {
      logger.error(`🔴 Error getting historical average.`, {
        error: historicalAverage.error,
        from,
        to
      });
      throw new Error(historicalAverage.error.message);
    }

    if (historicalAverage.value <= HISTORICAL_AVERAGE_THRESHOLD) {
      logger.info(
        `🟢 Skipping alert: Historical average ${historicalAverage.value} is lower than ${HISTORICAL_AVERAGE_THRESHOLD}.`,
        {
          from,
          to,
          historicalAverage: historicalAverage.value
        }
      );
      return; // Stop execution here
    }

    if (transactionsResult.value.length === 0) {
      logger.info(`🔴 No successful transactions found.`, {
        from,
        to
      });
      throw new Error(`No successful transactions found.`);
    }

    logger.info(`🟢 Got ${transactionsResult.value.length} successful transactions.`, {
      transactions: transactionsResult.value,
      from,
      to
    });
  }
});
