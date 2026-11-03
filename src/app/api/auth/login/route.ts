import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { verifyPassword, createToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username or email and password are required.' },
        { status: 400 }
      );
    }

    const rows = await query<RowDataPacket[]>(
      'SELECT id, username, email, full_name, role, department_id, password_hash, is_active FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const user = rows[0];

    if (!user.is_active) {
      return NextResponse.json({ success: false, error: 'Account is deactivated. Please contact HR.' }, { status: 403 });
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department_id: user.department_id,
    };

    const token = createToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      data: { user: sessionPayload, role: user.role },
      message: 'Authentication successful.',
    });

    const isHttps = request.url.startsWith('https://');
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    };

    response.cookies.set(SESSION_COOKIE_NAME, token, cookieOptions);
    response.cookies.set('hrims_token', token, cookieOptions);

    return response;
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[API /api/auth/login Error]:', e);
    const isConnRefused = e.message?.includes('ECONNREFUSED');
    const errorMessage = isConnRefused
      ? 'Database connection failed. Please ensure MySQL server is running in XAMPP on port 3306.'
      : e.message || 'Authentication service error.';

    return NextResponse.json(
      { success: false, error: errorMessage, message: errorMessage },
      { status: 500 }
    );
  }
}
