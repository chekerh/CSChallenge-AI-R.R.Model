import mongoose from 'mongoose';
import Resume from '../models/Resume';
import ResumeVersion from '../models/ResumeVersion';

export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function assertResumeOwned(resumeId: string, userId: string) {
  return Resume.findOne({ _id: resumeId, user_id: userId }).lean();
}

export async function assertVersionOwnedByUser(versionId: string, userId: string) {
  const version = await ResumeVersion.findById(versionId).lean();
  if (!version) return { ok: false as const, status: 404 as const };
  const resume = await Resume.findOne({ _id: version.resume_id, user_id: userId }).lean();
  if (!resume) return { ok: false as const, status: 403 as const };
  return { ok: true as const, version, resume };
}
