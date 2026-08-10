import Notification, { NotificationType } from '../models/Notification';
import User from '../models/User';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await Notification.create({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body || '',
      link: input.link || null,
      metadata: input.metadata || {},
    });
  } catch (err) {
    // Notifications are best-effort and must never break the main flow.
    console.error('createNotification failed:', err);
  }
}

export async function notifyAdmins(input: Omit<CreateNotificationInput, 'userId'>): Promise<void> {
  try {
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin', 'support'] },
    }).select('_id').lean();
    for (const admin of admins) {
      await createNotification({ ...input, userId: String(admin._id) });
    }
  } catch (err) {
    console.error('notifyAdmins failed:', err);
  }
}
