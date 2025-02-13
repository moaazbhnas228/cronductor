import { app } from './api';
import { getSuccessfulTransactionsFromTo } from './db/sdk';

const port = process.env.PORT || 3333;

// getSuccessfulTransactionsFromTo(
//   '2025-01-01 00:00:00',
//   '2025-01-25 00:00:00'
// ).then((result) => {
//   console.log('🤓', result);
// });

app.listen(port, () =>
  console.log(`API available on http://localhost:${port}`)
);
