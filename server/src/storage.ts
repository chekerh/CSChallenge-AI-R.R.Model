// Placeholder storage helper - in production integrate with Bolt Storage or S3
import fs from 'fs';
import path from 'path';

export function saveFile(tempPath: string, destName: string) {
  const uploads = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads);
  const dest = path.join(uploads, destName);
  fs.renameSync(tempPath, dest);
  return dest;
}
