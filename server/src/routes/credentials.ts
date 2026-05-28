import { Router } from 'express';
import { z } from 'zod';
import { Credential } from '../models/Credential';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { issueCredential as issueCred } from '../services/crypto';
import { AppError } from '../utils/errors';

const router = Router();

const issueSchema = z.object({
  fields: z.record(z.string().min(1), z.string().min(1)).refine(
    obj => Object.keys(obj).length >= 2,
    'Need at least 2 fields in the credential'
  ),
  issuerName: z.string().min(1, 'Issuer name required'),
  issueDate: z.string().min(1, 'Issue date required'),
  credentialType: z.string().optional().default('academic'),
});

router.post('/issue', requireAuth, validate(issueSchema), async (req: AuthRequest, res, next) => {
  try {
    const { fields, issuerName, issueDate, credentialType } = req.body;

    const cryptoResult = issueCred(fields);

    const credential = await Credential.create({
      userId: req.userId,
      fields: cryptoResult.fields,
      salts: cryptoResult.salts,
      fieldHashes: cryptoResult.fieldHashes,
      rootHash: cryptoResult.rootHash,
      signature: cryptoResult.signature,
      issuerName,
      issueDate,
      credentialType,
    });

    // don't send back salts or raw hashes in the response
    res.status(201).json({
      id: credential._id,
      fields: cryptoResult.fields,
      issuerName,
      issueDate,
      credentialType,
      rootHash: cryptoResult.rootHash,
      createdAt: credential.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const credentials = await Credential.find({ userId: req.userId })
      .select('-salts -fieldHashes -signature')
      .sort({ createdAt: -1 });

    // mongoose Map → plain object
    const result = credentials.map(c => ({
      id: c._id,
      fields: Object.fromEntries(c.fields as any),
      issuerName: c.issuerName,
      issueDate: c.issueDate,
      credentialType: c.credentialType,
      rootHash: c.rootHash,
      createdAt: c.createdAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const credential = await Credential.findOne({ _id: req.params.id, userId: req.userId })
      .select('-salts -fieldHashes -signature');

    if (!credential) throw new AppError('Credential not found', 404);

    res.json({
      id: credential._id,
      fields: Object.fromEntries(credential.fields as any),
      issuerName: credential.issuerName,
      issueDate: credential.issueDate,
      credentialType: credential.credentialType,
      rootHash: credential.rootHash,
      createdAt: credential.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
