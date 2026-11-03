import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { DEPARTMENTS_CONFIG } from '@/features/departments/department.config';

export async function GET(request: NextRequest) {
  try {
    const rows = await query<any[]>('SELECT id, name, code, description FROM departments WHERE is_active = 1 ORDER BY id ASC');
    if (rows && rows.length > 0) {
      return NextResponse.json({ success: true, data: rows });
    }

    // Fallback to central config if table is empty
    return NextResponse.json({
      success: true,
      data: DEPARTMENTS_CONFIG.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
      })),
    });
  } catch (err: any) {
    // Graceful fallback to static configuration
    return NextResponse.json({
      success: true,
      data: DEPARTMENTS_CONFIG.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
      })),
    });
  }
}
