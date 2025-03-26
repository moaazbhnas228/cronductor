import { logger, schedules } from '@trigger.dev/sdk/v3';
import moment from 'moment';
import { sendSpotitRefundsEmail } from '../utils/sendSpotitRefundsEmail';
import { getSpotitSyntheticRefunds } from '../utils/getSpotitSyntheticRefunds';

export const spotitSyntheticReports = schedules.task({
  id: 'spotit-synthetic-reports',
  // Every day at 4:00 AM.
  cron: '0 4 * * *',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    logger.log(`🔵 It's 4AM, we're sending a synthetic refunds report to Spotit's team.`);

    if (process.env.NODE_ENV != 'production') {
      logger.log(`🔵 Current environment is not set as production, will not send e-mail to Spotit with refunds.`);
      return;
    }

    const date = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const result = await logger.trace('spotit-synthetic-reports', async (span) => {
      span.setAttribute('date', date);

      return await sendSpotitRefundsEmail(date, await getSpotitSyntheticRefunds(1, date, 'json'), logger as any);
    });

    if (result.isErr()) {
      logger.info(`🔴 Failed to send Spotit synthetic reports`, {
        error: result.error
      });
    }

    logger.log(`🟢 Sent e-mail to finops with synthetic refunds to be processed by Spotit`);
  }
});
