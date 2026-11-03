import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/features/notifications/notification.service';

export async function GET() {
  try {
    const notifications = await getRecentNotifications(25);
    const unreadCount = await getUnreadNotificationCount();
    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.all) {
      await markAllNotificationsAsRead();
    } else if (body.id) {
      await markNotificationAsRead(Number(body.id));
    }
    return NextResponse.json({ success: true, message: 'Notifications updated.' });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
