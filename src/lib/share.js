/** Access-code generation + share URL for shared medication lists. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars

export function generateAccessCode(len = 6) {
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export function shareUrl(code) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/sharedview?code=${code}`;
}
