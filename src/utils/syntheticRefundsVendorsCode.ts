export enum SyntheticRefundsVendorCode {
  Souhoola = 'SORE',
  Easybuy = 'EBRE',
  Spotit = 'SPRE'
}

export function isSynthetic(gateway_transaction_id: string) {
  if (!gateway_transaction_id) return;
  if (
    gateway_transaction_id.includes('SORE') ||
    gateway_transaction_id.includes('EBRE') ||
    gateway_transaction_id.includes('SPRE')
  )
    return true;
  return false;
}
