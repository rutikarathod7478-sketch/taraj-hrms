import { query, execute } from '@/lib/db/mysql';
import { withTransaction } from '@/lib/db/transaction';
import { Employee, EmployeeStatus } from '@/types/employee';
import { generateEmployeeCode } from '@/lib/utils';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';

export interface EmployeeFilters {
  departmentId?: number;
  status?: string;
  search?: string;
}

/**
 * Get all employees with department and position joins
 */
export async function getEmployees(filters: EmployeeFilters = {}): Promise<Employee[]> {
  const conditions: string[] = ['1=1'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];

  if (filters.departmentId && Number(filters.departmentId) > 0) {
    conditions.push('e.department_id = ?');
    params.push(Number(filters.departmentId));
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'active' || filters.status === 'joined') {
      conditions.push('(e.status = "active" OR e.status = "joined")');
    } else {
      conditions.push('e.status = ?');
      params.push(filters.status);
    }
  }

  if (filters.search && filters.search.trim() !== '') {
    const term = `%${filters.search.trim()}%`;
    conditions.push('(e.full_name LIKE ? OR e.email LIKE ? OR e.employee_code LIKE ?)');
    params.push(term, term, term);
  }

  const sql = `
    SELECT 
      e.*,
      d.name AS department_name,
      d.code AS department_code,
      p.title AS position_title,
      c.candidate_code,
      ce.round_1_score,
      ce.round_2_score,
      ce.round_3_score,
      ce.overall_percentage
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN candidates c ON e.candidate_id = c.id
    LEFT JOIN candidate_evaluations ce ON e.candidate_id = ce.candidate_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.join_date DESC, e.id DESC
  `;

  return query<(Employee & RowDataPacket)[]>(sql, params);
}

/**
 * Get employee details by ID
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const sql = `
    SELECT 
      e.*,
      d.name AS department_name,
      d.code AS department_code,
      p.title AS position_title
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE e.id = ?
    LIMIT 1
  `;
  const rows = await query<(Employee & RowDataPacket)[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Convert an approved/joined candidate into an official Employee record
 * Uses transaction and prevents duplicate records
 */
export async function convertCandidateToEmployee(params: {
  candidateId: number;
  deptCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: number;
  positionId: number;
  joinDate: string;
}): Promise<Employee> {
  const employeeCode = generateEmployeeCode(params.deptCode);

  const empId = await withTransaction(async (conn: PoolConnection) => {
    // 1. Verify candidate has not already been converted
    const [existing] = await conn.execute(
      `SELECT id FROM employees WHERE candidate_id = ?`,
      [params.candidateId]
    );
    if ((existing as RowDataPacket[]).length > 0) {
      return (existing as RowDataPacket[])[0].id;
    }

    // 2. Insert formal employee record
    const insertEmpSql = `
      INSERT INTO employees (
        candidate_id, employee_code, full_name, email, phone,
        department_id, position_id, join_date, status
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, 'probation'
      )
    `;
    const [empRes] = await conn.execute(insertEmpSql, [
      params.candidateId,
      employeeCode,
      params.fullName.trim(),
      params.email.trim(),
      params.phone.trim(),
      params.departmentId,
      params.positionId,
      params.joinDate,
    ]);

    const newEmpId = (empRes as { insertId: number }).insertId;

    // 3. Link employee_id in joining_records
    await conn.execute(
      `UPDATE joining_records 
       SET employee_id = ?, joining_status = 'completed', confirmed_joining_date = ? 
       WHERE candidate_id = ?`,
      [newEmpId, params.joinDate, params.candidateId]
    );

    // 4. Update candidate status to 'joined'
    await conn.execute(
      `UPDATE candidates SET application_status = 'joined' WHERE id = ?`,
      [params.candidateId]
    );

    // 5. Activity log
    await conn.execute(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details) VALUES (?, 'employee', ?, ?)`,
      [
        'CANDIDATE_ONBOARDED_AS_EMPLOYEE',
        newEmpId,
        JSON.stringify({ candidate_id: params.candidateId, code: employeeCode }),
      ]
    );

    return newEmpId;
  });

  const emp = await getEmployeeById(empId);
  if (!emp) throw new Error('Failed to retrieve newly created employee record.');
  return emp;
}

/**
 * Update employee record
 */
export async function updateEmployee(
  id: number,
  data: Partial<Pick<Employee, 'full_name' | 'email' | 'phone' | 'status' | 'join_date'>>
): Promise<Employee> {
  const fields: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [];

  if (data.full_name) {
    fields.push('full_name = ?');
    params.push(data.full_name.trim());
  }
  if (data.email) {
    fields.push('email = ?');
    params.push(data.email.trim());
  }
  if (data.phone) {
    fields.push('phone = ?');
    params.push(data.phone.trim());
  }
  if (data.status) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.join_date) {
    fields.push('join_date = ?');
    params.push(data.join_date);
  }

  if (fields.length > 0) {
    params.push(id);
    await execute(`UPDATE employees SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
  }

  const updated = await getEmployeeById(id);
  if (!updated) throw new Error('Employee record not found after update.');
  return updated;
}
