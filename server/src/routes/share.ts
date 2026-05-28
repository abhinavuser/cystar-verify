import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Credential } from '../models/Credential';
import { Share } from '../models/Share';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { verifyLimiter } from '../middleware/rateLimiter';
import { buildPresentation, verifyPresentation } from '../services/crypto';
import { AppError } from '../utils/errors';
import { config } from '../config/env';

const router = Router();

const shareSchema = z.object({
  credentialId: z.string().min(1),
  disclosedFields: z.array(z.string()).min(1, 'Select at least one field to share'),
  expiresInHours: z.number().min(1).max(168).optional().default(24), // max 7 days
});

router.post('/share', requireAuth, validate(shareSchema), async (req: AuthRequest, res, next) => {
  try {
    const { credentialId, disclosedFields, expiresInHours } = req.body;

    const credential = await Credential.findOne({
      _id: credentialId,
      userId: req.userId,
    });
    if (!credential) throw new AppError('Credential not found', 404);

    const credObj = {
      fields: Object.fromEntries(credential.fields as any),
      salts: Object.fromEntries(credential.salts as any),
      fieldHashes: Object.fromEntries(credential.fieldHashes as any),
      rootHash: credential.rootHash,
      signature: credential.signature,
    };

    // make sure requested fields actually exist
    const availableFields = Object.keys(credObj.fields);
    const invalid = disclosedFields.filter((f: string) => !availableFields.includes(f));
    if (invalid.length > 0) {
      throw new AppError(`Unknown fields: ${invalid.join(', ')}`, 400);
    }

    const presentation = buildPresentation(credObj, disclosedFields);
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    await Share.create({
      credentialId: credential._id,
      userId: req.userId,
      token,
      presentation,
      issuerName: credential.issuerName,
      issueDate: credential.issueDate,
      credentialType: credential.credentialType,
      expiresAt,
    });

    const shareUrl = `${config.clientUrl}/verify/${token}`;
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 256, margin: 2 });

    res.status(201).json({
      token,
      shareUrl,
      qrCode: qrDataUrl,
      expiresAt: expiresAt.toISOString(),
      disclosedFields,
    });
  } catch (err) {
    next(err);
  }
});

// public: get shared presentation by token (for rendering the verify page)
router.get('/public/:token', async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token });
    if (!share) throw new AppError('Share link not found or expired', 404);
    if (share.expiresAt < new Date()) throw new AppError('This share link has expired', 410);

    res.json({
      disclosed: share.presentation.disclosed,
      issuerName: share.issuerName,
      issueDate: share.issueDate,
      credentialType: share.credentialType,
      expiresAt: share.expiresAt,
      totalFields: Object.keys(share.presentation.disclosed).length +
        Object.keys(share.presentation.redactedHashes).length,
      disclosedCount: Object.keys(share.presentation.disclosed).length,
    });
  } catch (err) {
    next(err);
  }
});

// public: run full cryptographic verification
router.post('/verify', verifyLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new AppError('Token is required', 400);

    const share = await Share.findOne({ token });
    if (!share) throw new AppError('Share link not found or expired', 404);
    if (share.expiresAt < new Date()) throw new AppError('This share link has expired', 410);

    const result = verifyPresentation(share.presentation);

    res.json({
      ...result,
      issuerName: share.issuerName,
      issueDate: share.issueDate,
      credentialType: share.credentialType,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
