export async function charge({ amount, method, currency = 'USD', metadata = {} }) {
  await new Promise(r => setTimeout(r, 200));
  return {
    id: `fake_${Math.random().toString(36).slice(2, 10)}`,
    status: 'succeeded',
    amount,
    currency,
    method,
    metadata
  };
}

