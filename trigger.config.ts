import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { MySQL2Instrumentation } from '@opentelemetry/instrumentation-mysql2';
import { defineConfig } from '@trigger.dev/sdk/v3';
import { omit } from 'lodash';

export default defineConfig({
  project: 'proj_yknljgobncekcfhrckkd',
  runtime: 'node',
  logLevel: 'log',
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true
    }
  },
  telemetry: {
    instrumentations: [
      new HttpInstrumentation({
        responseHook(span, response: any) {
          const host = response.req.host || '';
          const path = response.req.path || '';
          const method = response.req.method || '';
          const message = `[${response.statusCode}] ${method} | ${host}${path}`;
          span.updateName(message);
        }
      }),
      new MySQL2Instrumentation({
        responseHook(span, response) {
          span.updateName(`[SQL] | ${response.queryResults.length} results`);
        }
      })
    ]
  },
  dirs: ['./src/trigger']
});
