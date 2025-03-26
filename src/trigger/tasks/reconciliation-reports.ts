import { logger, schedules } from '@trigger.dev/sdk/v3';
import { RecoSendType, sendReconciliation } from '../utils/sendReconciliation';

export const reconciliationReports = schedules.task({
  id: 'reconciliation-reports',
  // Every day at 2:00 AM.
  cron: '0 2 * * *',
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload, { ctx }) => {
    const result = await sendReconciliation([], RecoSendType.EMAIL, logger as any);

    if (result.isErr()) {
      logger.info(`🔴 Failed to send reconciliation reports`, {
        error: result.error
      });
      throw new Error(result.error.message);
    }

    logger.info(`🟢 Successfully, sent all reconciliation reports`);
  }
});
