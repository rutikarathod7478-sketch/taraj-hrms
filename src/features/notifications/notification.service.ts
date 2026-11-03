import { query, execute } from '@/lib/db/mysql';
import { AppNotification } from '@/types/notification';
import { RowDataPacket } from 'mysql2/promise';

/**
 * Get recent in-app notifications
 */
export async function getRecentNotifications(limit = 20): Promise<AppNotification[]> {
  const sql = `
    SELECT 
      id, user_id, title, message, type, link,
      is_read = 1 AS is_read,
      created_at
    FROM notifications
    ORDER BY id DESC
    LIMIT ?
  `;
  return query<(AppNotification & RowDataPacket)[]>(sql, [limit]);
}

/**
 * Get count of unread notifications
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const sql = `SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0`;
  const rows = await query<RowDataPacket[]>(sql);
  return Number(rows[0]?.count) || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: number): Promise<void> {
  await execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await execute(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`);
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  userId?: number | null;
  title: string;
  message: string;
  type?: string;
  link?: string;
}): Promise<void> {
  await execute(
    `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    [data.userId || null, data.title, data.message, data.type || 'info', data.link || null]
  );
}
