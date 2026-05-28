import mongoose, { Document } from 'mongoose';

export interface IShare extends Document {
  credentialId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  presentation: {
    disclosed: Record<string, { value: string; salt: string }>;
    redactedHashes: Record<string, string>;
    rootHash: string;
    signature: string;
    issuerPublicKey: string;
  };
  issuerName: string;
  issueDate: string;
  credentialType: string;
  expiresAt: Date;
}

const schema = new mongoose.Schema({
  credentialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Credential', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  presentation: { type: mongoose.Schema.Types.Mixed, required: true },
  issuerName: { type: String, required: true },
  issueDate: { type: String, required: true },
  credentialType: { type: String, default: 'academic' },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

schema.index({ token: 1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL cleanup

export const Share = mongoose.model<IShare>('Share', schema);
