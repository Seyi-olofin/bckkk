const fetch = require('node-fetch');
const crypto = require('crypto');

const PAYSTACK_BASE = 'https://api.paystack.co';

function initTransaction(secretKey, { amount, email, reference, callback_url, metadata }) {
  if (!secretKey) return Promise.reject(new Error('No PAYSTACK_SECRET_KEY'));
  const body = {
    amount,
    email,
    reference,
    callback_url,
    metadata,
  };

  return fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(r => r.json());
}

function verifyTransaction(secretKey, reference) {
  if (!secretKey) return Promise.reject(new Error('No PAYSTACK_SECRET_KEY'));
  return fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  }).then(r => r.json());
}

function verifyWebhookSignature(secretKey, rawBody, signatureHeader) {
  if (!secretKey) return false;
  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return hash === signatureHeader;
}

module.exports = { initTransaction, verifyTransaction, verifyWebhookSignature };
