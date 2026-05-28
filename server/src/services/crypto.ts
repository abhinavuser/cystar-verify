import crypto from 'crypto';
import { config } from '../config/env';

let privateKey: crypto.KeyObject;
let publicKey: crypto.KeyObject;

export function initKeys() {
  if (config.signingKeyPrivate && config.signingKeyPublic) {
    const privPem = Buffer.from(config.signingKeyPrivate, 'base64').toString('utf8');
    const pubPem = Buffer.from(config.signingKeyPublic, 'base64').toString('utf8');
    privateKey = crypto.createPrivateKey({ key: privPem, format: 'pem', type: 'pkcs8' });
    publicKey = crypto.createPublicKey({ key: pubPem, format: 'pem', type: 'spki' });
    console.log('signing keys loaded from env');
  } else {
    const pair = crypto.generateKeyPairSync('ed25519');
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;

    const privB64 = Buffer.from(
      pair.privateKey.export({ type: 'pkcs8', format: 'pem' }) as string
    ).toString('base64');
    const pubB64 = Buffer.from(
      pair.publicKey.export({ type: 'spki', format: 'pem' }) as string
    ).toString('base64');

    console.log('\n--- generated new Ed25519 signing keys ---');
    console.log('persist these in your .env:');
    console.log(`SIGNING_KEY_PRIVATE=${privB64}`);
    console.log(`SIGNING_KEY_PUBLIC=${pubB64}`);
    console.log('-------------------------------------------\n');
  }
}

export function getPublicKeyPem(): string {
  return publicKey.export({ type: 'spki', format: 'pem' }) as string;
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// per-field commitment: HMAC keyed by random salt
export function hashField(salt: string, name: string, value: string): string {
  return crypto.createHmac('sha256', salt).update(`${name}:${value}`).digest('hex');
}

// deterministic root: sort field names, concat their hashes, SHA256 the lot
export function computeRootHash(fieldHashes: Record<string, string>): string {
  const concat = Object.keys(fieldHashes)
    .sort()
    .map(k => fieldHashes[k])
    .join('');
  return crypto.createHash('sha256').update(concat).digest('hex');
}

export function signData(hexData: string): string {
  return crypto.sign(null, Buffer.from(hexData, 'hex'), privateKey).toString('base64');
}

export function verifySignature(hexData: string, sig: string): boolean {
  try {
    return crypto.verify(
      null,
      Buffer.from(hexData, 'hex'),
      publicKey,
      Buffer.from(sig, 'base64')
    );
  } catch {
    return false;
  }
}

// full issuance pipeline — takes raw fields, returns signed credential blob
export function issueCredential(fields: Record<string, string>) {
  const salts: Record<string, string> = {};
  const fieldHashes: Record<string, string> = {};

  for (const [name, value] of Object.entries(fields)) {
    const salt = generateSalt();
    salts[name] = salt;
    fieldHashes[name] = hashField(salt, name, value);
  }

  const rootHash = computeRootHash(fieldHashes);
  const signature = signData(rootHash);

  return { fields, salts, fieldHashes, rootHash, signature };
}

// selective disclosure: only reveal chosen fields, provide hashes for the rest
export function buildPresentation(
  credential: {
    fields: Record<string, string>;
    salts: Record<string, string>;
    fieldHashes: Record<string, string>;
    rootHash: string;
    signature: string;
  },
  disclose: string[]
) {
  const disclosed: Record<string, { value: string; salt: string }> = {};
  const redactedHashes: Record<string, string> = {};

  for (const name of Object.keys(credential.fields)) {
    if (disclose.includes(name)) {
      disclosed[name] = {
        value: credential.fields[name],
        salt: credential.salts[name],
      };
    } else {
      redactedHashes[name] = credential.fieldHashes[name];
    }
  }

  return {
    disclosed,
    redactedHashes,
    rootHash: credential.rootHash,
    signature: credential.signature,
    issuerPublicKey: getPublicKeyPem(),
  };
}

// full verification: recompute hashes, rebuild root, check signature
export function verifyPresentation(presentation: {
  disclosed: Record<string, { value: string; salt: string }>;
  redactedHashes: Record<string, string>;
  rootHash: string;
  signature: string;
}) {
  const recomputed: Record<string, string> = {};
  for (const [name, { value, salt }] of Object.entries(presentation.disclosed)) {
    recomputed[name] = hashField(salt, name, value);
  }

  const allHashes: Record<string, string> = {
    ...recomputed,
    ...presentation.redactedHashes,
  };

  const computedRoot = computeRootHash(allHashes);

  if (computedRoot !== presentation.rootHash) {
    return {
      valid: false,
      reason: 'Hash mismatch — disclosed data may have been tampered with',
    };
  }

  if (!verifySignature(presentation.rootHash, presentation.signature)) {
    return {
      valid: false,
      reason: 'Signature verification failed — credential may be forged',
    };
  }

  return {
    valid: true,
    reason: 'Cryptographic verification passed',
    disclosedFields: Object.keys(presentation.disclosed),
    totalFields: Object.keys(allHashes).length,
  };
}
