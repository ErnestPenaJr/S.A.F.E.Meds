/** Password hashing with scrypt (node:crypto). Stored as scrypt$salt$hash. */
import crypto from 'node:crypto';

const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const dk = crypto.scryptSync(password, salt, KEYLEN, PARAMS);
  return `scrypt$${salt.toString('hex')}$${dk.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;
  const dk = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), KEYLEN, PARAMS);
  const expected = Buffer.from(hashHex, 'hex');
  return expected.length === dk.length && crypto.timingSafeEqual(expected, dk);
}
