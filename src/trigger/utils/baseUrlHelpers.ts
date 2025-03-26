export const getCustomerTargetUrl = () => {
  let target = 'https://pay.orchestrapay.com';
  if (process.env.NODE_ENV == 'staging') target = 'https://pay-staging.orchestrapay.com';
  else if (process.env.NODE_ENV == 'dev') target = 'http://localhost:3001';

  return target;
};

export const getApiTargetUrl = () => {
  let target = 'https://api.orchestrapay.com';
  if (process.env.NODE_ENV == 'staging') target = 'https://api-staging.orchestrapay.com';
  else if (process.env.NODE_ENV == 'dev') target = 'http://localhost:3000';

  return target;
};
