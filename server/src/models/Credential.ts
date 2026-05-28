import mongoose, { Document } from 'mongoose';

export interface ICredential extends Document {
  userId: mongoose.Types.ObjectId;
  fields: Record<string, string>;
  salts: Record<string, string>;
  fieldHashes: Record<string, string>;
  rootHash: string;
  signature: string;
  credentialType: string;
  issuerName: string;
  issueDate: string;
  createdAt: Date;
}

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fields: { type: Map, of: String, required: true },
  salts: { type: Map, of: String, required: true },
  fieldHashes: { type: Map, of: String, required: true },
  rootHash: { type: String, required: true },
  signature: { type: String, required: true },
  credentialType: { type: String, default: 'academic' },
  issuerName: { type: String, required: true },
  issueDate: { type: String, required: true },
}, { timestamps: true });

schema.index({ userId: 1 });

export const Credential = mongoose.model<ICredential>('Credential', schema);
