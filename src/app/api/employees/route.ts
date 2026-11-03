import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, updateEmployee } from '@/features/employees/employee.service';
import { validateEmployeeUpdate } from '@/features/employees/employee.validation';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id') ? Number(searchParams.get('department_id')) : undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const employees = await getEmployees({ departmentId, status, search });
    return NextResponse.json({ success: true, data: employees });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user && user.role !== 'super_admin' && user.role !== 'hr_manager') {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify employee records.' }, { status: 403 });
    }

    const body = await request.json();
    const id = Number(body.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Valid employee ID is required.' }, { status: 400 });
    }

    const validation = validateEmployeeUpdate(body);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const updated = await updateEmployee(id, body);
    return NextResponse.json({ success: true, data: updated, message: 'Employee updated successfully.' });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
