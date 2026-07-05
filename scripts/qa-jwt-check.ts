import 'dotenv/config';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const norm = (s: string) => (s || '').replace(/\\n/g, '\n');
const priv = norm(process.env.JWT_PRIVATE_KEY || '');
const pub = norm(process.env.JWT_PUBLIC_KEY || '');
const iss = process.env.JWT_ISSUER;
const aud = process.env.JWT_AUDIENCE;
const kid = process.env.JWT_KEY_ID;
console.log('issuer=', iss, 'audience=', aud, 'kid=', kid);
console.log('priv len=', priv.length, 'pub len=', pub.length);

// Derive public key from private and compare to provided public
try {
  const derivedPub = crypto.createPublicKey(priv).export({ type: 'spki', format: 'pem' }).toString();
  const provided = crypto.createPublicKey(pub).export({ type: 'spki', format: 'pem' }).toString();
  console.log('KEYPAIR MATCH:', derivedPub.trim() === provided.trim());
} catch (e) {
  console.log('key parse error:', (e as Error).message);
}

// Full sign+verify round trip mimicking the app
try {
  const token = jwt.sign({ sub: 'x' }, priv, { algorithm: 'RS256', expiresIn: '15m', issuer: iss, audience: aud, keyid: kid });
  const decoded = jwt.verify(token, pub, { algorithms: ['RS256'], issuer: iss, audience: aud });
  console.log('SIGN+VERIFY OK:', !!decoded);
} catch (e) {
  console.log('SIGN/VERIFY FAILED:', (e as Error).message);
}
