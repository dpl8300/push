import { parseAddAmount } from '../validation';

describe('custom amount validation', () => {
  it.each(['1', '5', '10', '250'])('accepts %s', (value) => {
    expect(parseAddAmount(value)).toBe(Number(value));
  });

  it.each(['', '0', '251', '-1', '1.5', 'abc'])('rejects %s', (value) => {
    expect(parseAddAmount(value)).toBeNull();
  });
});

