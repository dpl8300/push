export const MIN_ADD_AMOUNT = 1;
export const MAX_ADD_AMOUNT = 250;

export function parseAddAmount(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;

  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) return null;
  if (amount < MIN_ADD_AMOUNT || amount > MAX_ADD_AMOUNT) return null;
  return amount;
}

