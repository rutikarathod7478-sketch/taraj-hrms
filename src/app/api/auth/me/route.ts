import { NextResponse } from 'next/server';
import { getSessionUser, verifyPassword, hashPassword, createToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { query, execute } from '@/lib/db/mysql';
import { UserSession } from '@/types/employee';
import { RowDataPacket } from 'mysql2/promise';
import { promises as fs } from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await query<RowDataPacket[]>(
      'SELECT id, username, email, full_name, avatar_url, role, department_id FROM users WHERE id = ? LIMIT 1',
      [sessionUser.id]
    );
    if (rows && rows.length > 0) {
      const u = rows[0];
      const freshUser: UserSession = {
        id: u.id,
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        department_id: u.department_id,
        avatar_url: u.avatar_url || null,
      };
      return NextResponse.json({
        success: true,
        data: { user: freshUser, ...freshUser },
      });
    }
  } catch (dbErr) {
    console.warn('[API /api/auth/me GET DB query fallback to session]:', dbErr);
  }

  return NextResponse.json({
    success: true,
    data: { user: sessionUser, ...sessionUser },
  });
}

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { full_name, email, username, current_password, new_password, avatar_base64 } = body;

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanFullName = full_name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail).trim();

    // Fetch current user from DB to verify existence and current avatar/password
    const currentUserRows = await query<RowDataPacket[]>(
      'SELECT id, username, email, full_name, avatar_url, password_hash, role, department_id FROM users WHERE id = ? LIMIT 1',
      [sessionUser.id]
    );

    if (!currentUserRows || currentUserRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User account not found.' }, { status: 404 });
    }

    const currentDbUser = currentUserRows[0];

    // Check if email or username is already taken by another user
    const existing = await query<RowDataPacket[]>(
      'SELECT id, username, email FROM users WHERE (email = ? OR username = ?) AND id != ? LIMIT 1',
      [cleanEmail, cleanUsername, sessionUser.id]
    );

    if (existing.length > 0) {
      if (existing[0].email?.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'This email address is already in use by another account.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'This username is already in use by another account.' },
        { status: 400 }
      );
    }

    // If changing password, verify current password
    let updatedPasswordHash: string | null = null;
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to set a new password.' },
          { status: 400 }
        );
      }
      if (new_password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      if (!verifyPassword(current_password, currentDbUser.password_hash)) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 400 });
      }

      updatedPasswordHash = hashPassword(new_password);
    }

    // Process avatar changes if provided
    let newAvatarUrl: string | null | undefined = undefined;

    if (avatar_base64 === 'REMOVE') {
      newAvatarUrl = null;
    } else if (typeof avatar_base64 === 'string' && avatar_base64.startsWith('data:image/')) {
      const match = avatar_base64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ success: false, error: 'Invalid profile image format.' }, { status: 400 });
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Max 5 MB size limit
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'Profile image must be less than 5 MB.' }, { status: 400 });
      }

      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
      };
      const ext = mimeToExt[mimeType] || '.jpg';
      const fileName = `user_${sessionUser.id}_${Date.now()}${ext}`;

      const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.HRMS_DOCUMENTS_READ_WRITE_TOKEN;

      if (blobToken) {
        try {
          const blob = await put(`avatars/${fileName}`, buffer, {
            access: 'public',
            contentType: mimeType,
            token: blobToken,
            addRandomSuffix: false,
          });
          newAvatarUrl = blob.url;
        } catch (blobErr: any) {
          console.error('[API /api/auth/me] Vercel Blob avatar upload failed:', blobErr);
          throw new Error('Failed to upload avatar to cloud storage: ' + (blobErr.message || ''));
        }
      } else {
        try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
          await fs.mkdir(uploadDir, { recursive: true });
          const diskPath = path.join(uploadDir, fileName);
          await fs.writeFile(diskPath, buffer);
          newAvatarUrl = `/uploads/avatars/${fileName}`;
        } catch (fsErr: any) {
          console.error('[API /api/auth/me] Local filesystem avatar save failed:', fsErr);
          throw new Error('Failed to save avatar image on server.');
        }
      }
    }

    // Build SQL update query
    const updateFields: string[] = ['full_name = ?', 'email = ?', 'username = ?', 'updated_at = NOW()'];
    const updateParams: any[] = [cleanFullName, cleanEmail, cleanUsername];

    if (newAvatarUrl !== undefined) {
      updateFields.push('avatar_url = ?');
      updateParams.push(newAvatarUrl);
    }

    if (updatedPasswordHash) {
      updateFields.push('password_hash = ?');
      updateParams.push(updatedPasswordHash);
    }

    updateParams.push(sessionUser.id);

    await execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );

    // Final avatar url for session
    const resolvedAvatarUrl = newAvatarUrl !== undefined ? newAvatarUrl : (currentDbUser.avatar_url ?? null);

    // Construct updated session payload
    const updatedUserSession: UserSession = {
      id: sessionUser.id,
      username: cleanUsername,
      email: cleanEmail,
      full_name: cleanFullName,
      role: sessionUser.role,
      department_id: sessionUser.department_id,
      avatar_url: resolvedAvatarUrl,
    };

    const token = createToken(updatedUserSession);

    const isHttps = request.url.startsWith('https://');
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    };

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: updatedUserSession },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    response.cookies.set('hrims_token', token, cookieOptions);

    return response;
  } catch (err: any) {
    console.error('[API /api/auth/me PUT Error]:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to update profile.' }, { status: 500 });
  }
}
