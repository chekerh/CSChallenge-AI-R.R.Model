import User from '../models/User';

/**
 * Bootstrap a super admin role for a known email.
 *
 * This is a one-way operational tool: it only elevates roles, and only when
 * BOOTSTRAP_SUPER_ADMIN_EMAIL is set. Use in staging/prod with care.
 */
export async function bootstrapSuperAdmin(): Promise<void> {
  const email = String(process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  if (!email) return;

  const u = await User.findOne({ email }).select('_id role').lean();
  if (!u) return;
  const current = (u as { role?: string }).role || 'user';
  if (current === 'super_admin') return;

  await User.updateOne({ _id: (u as { _id: unknown })._id }, { role: 'super_admin' });
  // eslint-disable-next-line no-console
  console.log(`[bootstrap] Elevated ${email} to super_admin`);
}

