import { logger, schedules } from '@trigger.dev/sdk/v3';
import moment from 'moment';
import { sendSouhoolaRefundsEmail } from '../utils/sendSouhoolaRefundsEmail';
import { getSouhoolaSyntheticRefunds } from '../utils/getSouhoolaSyntheticRefunds';

export const souhoolaSyntheticReports = schedules.task({
  id: 'souhoola-synthetic-reports',
  // Every day at 5:00 AM.
  cron: '0 5 * * *',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    logger.log(`🔵 It's 5AM, we're sending a synthetic refunds report to Souhoola's team.`);

    if (process.env.NODE_ENV != 'production') {
      logger.log(`🔵 Current environment is not set as production, will not send e-mail to Souhoola with refunds.`);
      return;
    }

    const date = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const result = await logger.trace('souhoola-synthetic-reports', async (span) => {
      span.setAttribute('date', date);

      return await sendSouhoolaRefundsEmail(date, await getSouhoolaSyntheticRefunds(1, date, 'json'), logger as any);
    });

    if (result.isErr()) {
      logger.info(`🔴 Failed to send Souhoola synthetic reports`, {
        error: result.error
      });
    }

    logger.log(`🟢 Sent e-mail to finops with synthetic refunds to be processed by Souhoola`);
  }
});
