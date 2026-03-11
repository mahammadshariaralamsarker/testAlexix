export const getTrustapConfig = () => {
  const apiKey = process.env.TRUSTAP_API_KEY || '';
  const baseUrl = process.env.TRUSTAP_BASE_URL || 'https://sandbox-api.trustap.com';
  const encoded = Buffer.from(`${apiKey}:`).toString('base64');
  return {
    apiKey,
    baseUrl,
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
  };
};