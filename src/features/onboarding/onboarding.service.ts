import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { query, execute } from '@/lib/db/mysql';
import { withTransaction } from '@/lib/db/transaction';
import { JoiningRecord } from '@/types/evaluation';
import { getCandidateById } from '@/features/candidates/candidate.service';
import { convertCandidateToEmployee } from '@/features/employees/employee.service';
import { RowDataPacket } from 'mysql2/promise';

export type DocumentVerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export interface ChecklistDocumentItem {
  id: string;
  title: string;
  category: string;
  categoryId: number;
  isMandatory: boolean;
  experiencedOnly?: boolean;
  status: DocumentVerificationStatus;
  originalFileName?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  remarks?: string | null;
}

export interface JoiningProgressSummary {
  totalApplicable: number;
  totalMandatory: number;
  verifiedMandatory: number;
  percentComplete: number;
  allMandatoryVerified: boolean;
  totalSubmitted: number;
  totalPending: number;
  totalRejected: number;
}

export const MASTER_CHECKLIST_DEFINITIONS: Array<{
  id: string;
  title: string;
  category: string;
  categoryId: number;
  isMandatory: boolean;
  experiencedOnly?: boolean;
}> = [
  // 1. Identity and Address Proof
  { id: 'aadhaar_card', title: 'Aadhaar Card', category: '1. Identity and Address Proof', categoryId: 1, isMandatory: true },
  { id: 'pan_card', title: 'PAN Card', category: '1. Identity and Address Proof', categoryId: 1, isMandatory: true },
  { id: 'passport', title: 'Passport (if available or required)', category: '1. Identity and Address Proof', categoryId: 1, isMandatory: false },
  { id: 'driving_licence_voter_id', title: 'Driving Licence or Voter ID (if required)', category: '1. Identity and Address Proof', categoryId: 1, isMandatory: false },
  { id: 'current_address_proof', title: 'Current Address Proof (if required)', category: '1. Identity and Address Proof', categoryId: 1, isMandatory: false },

  // 2. Educational Documents
  { id: 'ssc_10th', title: 'SSC (10th) Mark Sheet and Certificate', category: '2. Educational Documents', categoryId: 2, isMandatory: true },
  { id: 'hsc_12th', title: 'HSC (12th) Mark Sheet and Certificate', category: '2. Educational Documents', categoryId: 2, isMandatory: true },
  { id: 'graduation_marksheet', title: 'Graduation Mark Sheets', category: '2. Educational Documents', categoryId: 2, isMandatory: true },
  { id: 'graduation_degree', title: 'Graduation Degree Certificate or Provisional Certificate', category: '2. Educational Documents', categoryId: 2, isMandatory: true },
  { id: 'diploma_certificate', title: 'Diploma Certificate (if applicable)', category: '2. Educational Documents', categoryId: 2, isMandatory: false },
  { id: 'certifications', title: 'Professional or Technical Certifications (if applicable)', category: '2. Educational Documents', categoryId: 2, isMandatory: false },

  // 3. Previous Employment Documents (Required only for experienced candidates)
  { id: 'prev_offer_appointment', title: 'Previous Company Offer Letter or Appointment Letter', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: true, experiencedOnly: true },
  { id: 'relieving_letter', title: 'Relieving Letter', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: true, experiencedOnly: true },
  { id: 'experience_certificate', title: 'Experience Certificate', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: true, experiencedOnly: true },
  { id: 'salary_slips_3_months', title: 'Last Three Months\' Salary Slips (if required)', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: false, experiencedOnly: true },
  { id: 'prev_employment_details', title: 'Previous Employment Details', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: false, experiencedOnly: true },
  { id: 'prev_uan_pf', title: 'Previous UAN/PF Account Details (if applicable)', category: '3. Previous Employment Documents', categoryId: 3, isMandatory: false, experiencedOnly: true },

  // 4. Bank and Payroll Documents
  { id: 'bank_account_details', title: 'Bank Account Details', category: '4. Bank and Payroll Documents', categoryId: 4, isMandatory: true },
  { id: 'cancelled_cheque_passbook', title: 'Cancelled Cheque or Bank Passbook Copy (if required)', category: '4. Bank and Payroll Documents', categoryId: 4, isMandatory: true },
  { id: 'pan_for_payroll', title: 'PAN Details for Payroll and Tax Purposes', category: '4. Bank and Payroll Documents', categoryId: 4, isMandatory: true },
  { id: 'uan_pf_details', title: 'UAN/PF Details (if applicable)', category: '4. Bank and Payroll Documents', categoryId: 4, isMandatory: false },

  // 5. Employee Information and Company Forms
  { id: 'emp_info_form', title: 'Employee Information Form', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: true },
  { id: 'emergency_contact_form', title: 'Emergency Contact Information Form', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: true },
  { id: 'signed_offer_letter', title: 'Signed Offer Letter Acceptance', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: true },
  { id: 'signed_appointment_letter', title: 'Signed Appointment Letter', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: false },
  { id: 'company_policies_ack', title: 'Company Policies Acknowledgement Form', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: true },
  { id: 'nda_form', title: 'Non-Disclosure Agreement (NDA), if applicable', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: false },
  { id: 'it_asset_ack', title: 'IT Asset Acknowledgement Form, if equipment is provided', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: false },
  { id: 'bgv_consent', title: 'Background Verification Consent Form, if applicable', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: false },
  { id: 'employee_declaration', title: 'Employee Declaration Form, if required', category: '5. Employee Information and Company Forms', categoryId: 5, isMandatory: false },

  // 6. Other Documents
  { id: 'passport_photo', title: 'Recent Passport-Size Photograph', category: '6. Other Documents', categoryId: 6, isMandatory: true },
  { id: 'medical_fitness', title: 'Medical Fitness Certificate (only if required for the role)', category: '6. Other Documents', categoryId: 6, isMandatory: false },
  { id: 'bgv_documents', title: 'Background Verification Documents (if applicable)', category: '6. Other Documents', categoryId: 6, isMandatory: false },
  { id: 'benefit_nomination', title: 'Nomination Forms for Applicable Employee Benefits', category: '6. Other Documents', categoryId: 6, isMandatory: false },
  { id: 'additional_hr_docs', title: 'Any Additional Documents Required by HR', category: '6. Other Documents', categoryId: 6, isMandatory: false },
];

/**
 * Generate default joining checklist item objects
 */
export function getDefaultJoiningChecklist(candidateType?: string): ChecklistDocumentItem[] {
  const isFresher = (candidateType || '').toLowerCase() === 'fresher';

  return MASTER_CHECKLIST_DEFINITIONS.map((doc) => {
    // If fresher, previous employment items are not mandatory
    const isMandatory = isFresher && doc.experiencedOnly ? false : doc.isMandatory;

    return {
      id: doc.id,
      title: doc.title,
      category: doc.category,
      categoryId: doc.categoryId,
      isMandatory,
      experiencedOnly: Boolean(doc.experiencedOnly),
      status: 'pending' as DocumentVerificationStatus,
      originalFileName: null,
      filePath: null,
      fileSizeBytes: null,
      mimeType: null,
      uploadedAt: null,
      verifiedAt: null,
      verifiedBy: null,
      remarks: null,
    };
  });
}

/**
 * Normalizes raw/saved checklist state into full typed array of 35 items
 */
export function normalizeJoiningChecklist(
  rawChecklist: any,
  candidateType?: string
): ChecklistDocumentItem[] {
  const isFresher = (candidateType || '').toLowerCase() === 'fresher';
  const defaults = getDefaultJoiningChecklist(candidateType);

  if (!rawChecklist) return defaults;

  let parsed: any = rawChecklist;
  if (typeof rawChecklist === 'string') {
    try {
      parsed = JSON.parse(rawChecklist);
    } catch {
      return defaults;
    }
  }

  // Handle case where checklist was stored as array
  if (Array.isArray(parsed)) {
    const savedMap = new Map<string, any>(parsed.map((item: any) => [item.id, item]));
    return defaults.map((def) => {
      const saved = savedMap.get(def.id);
      if (!saved) return def;
      return {
        ...def,
        isMandatory: typeof saved.isMandatory === 'boolean' ? saved.isMandatory : def.isMandatory,
        status: (saved.status || 'pending') as DocumentVerificationStatus,
        originalFileName: saved.originalFileName || null,
        filePath: saved.filePath || null,
        fileSizeBytes: saved.fileSizeBytes || null,
        mimeType: saved.mimeType || null,
        uploadedAt: saved.uploadedAt || null,
        verifiedAt: saved.verifiedAt || null,
        verifiedBy: saved.verifiedBy || null,
        remarks: saved.remarks || null,
      };
    });
  }

  // Handle case where checklist was stored as a key-value object (legacy format)
  if (typeof parsed === 'object' && parsed !== null) {
    const legacyDocMap: Record<string, string> = {
      idProof: 'aadhaar_card',
      academicCertificates: 'graduation_marksheet',
      relievingLetter: 'relieving_letter',
      bankDetails: 'bank_account_details',
      offerSigned: 'signed_offer_letter',
    };

    return defaults.map((def) => {
      // 1. Direct match by id
      if (parsed[def.id] !== undefined) {
        const val = parsed[def.id];
        if (typeof val === 'boolean') {
          return {
            ...def,
            status: val ? 'verified' : 'pending',
          };
        }
        if (typeof val === 'object' && val !== null) {
          return {
            ...def,
            isMandatory: typeof val.isMandatory === 'boolean' ? val.isMandatory : def.isMandatory,
            status: val.status || (val.verified ? 'verified' : 'pending'),
            originalFileName: val.originalFileName || null,
            filePath: val.filePath || null,
            uploadedAt: val.uploadedAt || null,
            verifiedAt: val.verifiedAt || null,
            remarks: val.remarks || null,
          };
        }
      }

      // 2. Legacy key match
      for (const [oldKey, newId] of Object.entries(legacyDocMap)) {
        if (newId === def.id && parsed[oldKey] !== undefined) {
          return {
            ...def,
            status: parsed[oldKey] ? 'verified' : 'pending',
          };
        }
      }

      return def;
    });
  }

  return defaults;
}

/**
 * Calculate document checklist completion progress
 */
export function calculateJoiningProgress(
  checklist: ChecklistDocumentItem[],
  candidateType?: string
): JoiningProgressSummary {
  const isFresher = (candidateType || '').toLowerCase() === 'fresher';

  let totalApplicable = 0;
  let totalMandatory = 0;
  let verifiedMandatory = 0;
  let totalSubmitted = 0;
  let totalPending = 0;
  let totalRejected = 0;

  for (const doc of checklist) {
    // If fresher, exempt experienced-only items
    if (isFresher && doc.experiencedOnly) {
      continue;
    }

    totalApplicable++;

    if (doc.isMandatory) {
      totalMandatory++;
      if (doc.status === 'verified') {
        verifiedMandatory++;
      }
    }

    if (doc.status === 'submitted') {
      totalSubmitted++;
    } else if (doc.status === 'rejected') {
      totalRejected++;
    } else if (doc.status === 'pending') {
      totalPending++;
    }
  }

  const percentComplete =
    totalMandatory > 0 ? Math.round((verifiedMandatory / totalMandatory) * 100) : 100;
  const allMandatoryVerified = totalMandatory > 0 && verifiedMandatory === totalMandatory;

  return {
    totalApplicable,
    totalMandatory,
    verifiedMandatory,
    percentComplete,
    allMandatoryVerified,
    totalSubmitted,
    totalPending,
    totalRejected,
  };
}

export interface OnboardingCandidateItem {
  candidate_id: number;
  candidate_code: string;
  full_name: string;
  candidate_name?: string;
  email: string;
  phone: string;
  candidate_type?: 'Fresher' | 'Experienced' | string;
  experience_years?: number;
  department_name: string;
  department_code: string;
  position_title: string;
  application_status: string;
  joining_status: string;
  proposed_joining_date: string;
  confirmed_joining_date?: string | null;
  offer_status: string;
  documents_verified: boolean;
  checklist_status: Record<string, any>;
  joining_documents: ChecklistDocumentItem[];
  progress: JoiningProgressSummary;
  employee_id?: number | null;
  offered_salary?: string | null;
  proposed_ctc?: string | number | null;
  offer_letter_path?: string | null;
  round_1_score?: number | string | null;
  round_2_score?: number | string | null;
  round_3_score?: number | string | null;
}

/**
 * Retrieve candidates undergoing onboarding, upcoming joiners, or candidates who cleared 3 rounds / selected
 */
export async function getOnboardingList(): Promise<OnboardingCandidateItem[]> {
  const sql = `
    SELECT 
      c.id AS candidate_id,
      c.candidate_code,
      c.full_name,
      c.email,
      c.phone,
      c.candidate_type,
      c.experience_years,
      c.application_status,
      COALESCE(d.name, 'General') AS department_name,
      COALESCE(d.code, 'GEN') AS department_code,
      COALESCE(p.title, 'Applicant') AS position_title,
      COALESCE(jr.joining_status, 'pending') AS joining_status,
      COALESCE(jr.proposed_joining_date, CURRENT_DATE) AS proposed_joining_date,
      jr.confirmed_joining_date,
      COALESCE(jr.offer_status, 'draft') AS offer_status,
      COALESCE(jr.documents_verified, 0) AS documents_verified,
      jr.checklist_status,
      jr.employee_id,
      hd.offered_salary,
      ce.round_1_score,
      ce.round_2_score,
      ce.round_3_score
    FROM candidates c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN positions p ON c.position_id = p.id
    LEFT JOIN joining_records jr ON c.id = jr.candidate_id
    LEFT JOIN hiring_decisions hd ON c.id = hd.candidate_id AND hd.is_current = 1
    LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
    WHERE c.is_archived = 0
      AND (
        c.application_status IN ('selected', 'offered', 'joined')
        OR hd.decision IN ('selected', 'offered')
      )
    ORDER BY 
      CASE 
        WHEN COALESCE(jr.joining_status, '') = 'pending' THEN 0 
        WHEN c.application_status = 'offered' THEN 1
        ELSE 2 
      END ASC,
      COALESCE(jr.proposed_joining_date, '2099-12-31') ASC,
      c.id ASC
  `;

  const rows = await query<RowDataPacket[]>(sql);
  return rows.map((r) => {
    const candidateType = r.candidate_type || 'Experienced';
    const normalizedDocs = normalizeJoiningChecklist(r.checklist_status, candidateType);
    const progress = calculateJoiningProgress(normalizedDocs, candidateType);

    // Map legacy key-value checklist for backward compatibility
    const legacyChecklistMap: Record<string, boolean> = {
      idProof: normalizedDocs.find((d) => d.id === 'aadhaar_card')?.status === 'verified',
      academicCertificates: normalizedDocs.find((d) => d.id === 'graduation_marksheet')?.status === 'verified',
      relievingLetter: normalizedDocs.find((d) => d.id === 'relieving_letter')?.status === 'verified',
      bankDetails: normalizedDocs.find((d) => d.id === 'bank_account_details')?.status === 'verified',
      offerSigned: normalizedDocs.find((d) => d.id === 'signed_offer_letter')?.status === 'verified',
      offer_accepted: r.offer_status === 'accepted',
    };

    const unifiedJoiningDate = r.confirmed_joining_date 
      ? String(r.confirmed_joining_date) 
      : (r.proposed_joining_date ? String(r.proposed_joining_date) : null);

    return {
      candidate_id: Number(r.candidate_id),
      candidate_code: String(r.candidate_code),
      full_name: String(r.full_name),
      email: String(r.email),
      phone: String(r.phone),
      candidate_type: candidateType,
      experience_years: r.experience_years ? Number(r.experience_years) : 0,
      department_name: String(r.department_name),
      department_code: String(r.department_code || 'TGS'),
      position_title: String(r.position_title),
      application_status: String(r.application_status),
      joining_status: String(r.joining_status),
      proposed_joining_date: unifiedJoiningDate || String(r.proposed_joining_date),
      confirmed_joining_date: unifiedJoiningDate,
      offer_status: String(r.offer_status),
      documents_verified: progress.allMandatoryVerified || Boolean(r.documents_verified),
      checklist_status: legacyChecklistMap,
      joining_documents: normalizedDocs,
      progress,
      employee_id: r.employee_id ? Number(r.employee_id) : null,
      offered_salary: r.offered_salary ? String(r.offered_salary) : null,
      round_1_score: r.round_1_score,
      round_2_score: r.round_2_score,
      round_3_score: r.round_3_score,
    };
  });
}

/**
 * Retrieve raw joining record checklist for a specific candidate
 */
export async function getCandidateJoiningChecklist(candidateId: number): Promise<{
  documents: ChecklistDocumentItem[];
  progress: JoiningProgressSummary;
  candidateType: string;
}> {
  const [candRows] = await query<RowDataPacket[]>(
    'SELECT candidate_type, experience_years FROM candidates WHERE id = ?',
    [candidateId]
  );
  const candidateType = candRows?.candidate_type || 'Experienced';

  const [jrRows] = await query<RowDataPacket[]>(
    'SELECT checklist_status, documents_verified FROM joining_records WHERE candidate_id = ?',
    [candidateId]
  );

  const docs = normalizeJoiningChecklist(jrRows?.checklist_status, candidateType);
  const progress = calculateJoiningProgress(docs, candidateType);

  return {
    documents: docs,
    progress,
    candidateType,
  };
}

/**
 * Update document verification status (e.g., verified, rejected, pending)
 */
export async function updateJoiningDocumentStatus(params: {
  candidateId: number;
  documentId: string;
  status: DocumentVerificationStatus;
  remarks?: string | null;
  verifiedBy?: string;
}): Promise<{ documents: ChecklistDocumentItem[]; progress: JoiningProgressSummary }> {
  const { candidateId, documentId, status, remarks, verifiedBy } = params;

  const current = await getCandidateJoiningChecklist(candidateId);
  const updatedDocs = current.documents.map((doc) => {
    if (doc.id === documentId) {
      return {
        ...doc,
        status,
        remarks: remarks !== undefined ? remarks : doc.remarks,
        verifiedAt: status === 'verified' ? new Date().toISOString() : doc.verifiedAt,
        verifiedBy: status === 'verified' ? (verifiedBy || 'HR Team') : doc.verifiedBy,
      };
    }
    return doc;
  });

  const progress = calculateJoiningProgress(updatedDocs, current.candidateType);

  await execute(
    `UPDATE joining_records
     SET checklist_status = ?,
         documents_verified = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE candidate_id = ?`,
    [JSON.stringify(updatedDocs), progress.allMandatoryVerified ? 1 : 0, candidateId]
  );

  return { documents: updatedDocs, progress };
}

/**
 * Configure whether a document is mandatory or optional
 */
export async function toggleJoiningDocumentMandatory(params: {
  candidateId: number;
  documentId: string;
  isMandatory: boolean;
}): Promise<{ documents: ChecklistDocumentItem[]; progress: JoiningProgressSummary }> {
  const { candidateId, documentId, isMandatory } = params;

  const current = await getCandidateJoiningChecklist(candidateId);
  const updatedDocs = current.documents.map((doc) => {
    if (doc.id === documentId) {
      return { ...doc, isMandatory };
    }
    return doc;
  });

  const progress = calculateJoiningProgress(updatedDocs, current.candidateType);

  await execute(
    `UPDATE joining_records
     SET checklist_status = ?,
         documents_verified = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE candidate_id = ?`,
    [JSON.stringify(updatedDocs), progress.allMandatoryVerified ? 1 : 0, candidateId]
  );

  return { documents: updatedDocs, progress };
}

/**
 * Register uploaded candidate document and set status to 'submitted'
 */
export async function saveCandidateDocumentUpload(params: {
  candidateId: number;
  documentId: string;
  originalFileName: string;
  filePath: string;
  fileSizeBytes: number;
  mimeType: string;
}): Promise<{ documents: ChecklistDocumentItem[]; progress: JoiningProgressSummary }> {
  const { candidateId, documentId, originalFileName, filePath, fileSizeBytes, mimeType } = params;

  const current = await getCandidateJoiningChecklist(candidateId);
  const updatedDocs = current.documents.map((doc) => {
    if (doc.id === documentId) {
      return {
        ...doc,
        status: 'submitted' as DocumentVerificationStatus,
        originalFileName,
        filePath,
        fileSizeBytes,
        mimeType,
        uploadedAt: new Date().toISOString(),
        remarks: null,
      };
    }
    return doc;
  });

  const progress = calculateJoiningProgress(updatedDocs, current.candidateType);

  // 1. Update joining_records checklist_status
  await execute(
    `UPDATE joining_records
     SET checklist_status = ?,
         documents_verified = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE candidate_id = ?`,
    [JSON.stringify(updatedDocs), progress.allMandatoryVerified ? 1 : 0, candidateId]
  );

  // 2. Also register into candidate_documents table
  try {
    const docTypeEnum = ['resume', 'id_proof', 'qualification', 'offer_letter', 'relieving_letter'].includes(documentId)
      ? documentId
      : 'other';

    await execute(
      `INSERT INTO candidate_documents (candidate_id, document_type, original_filename, stored_filename, file_path, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        candidateId,
        docTypeEnum,
        originalFileName,
        path.basename(filePath),
        filePath,
        mimeType,
        fileSizeBytes,
      ]
    );
  } catch (dbErr) {
    console.warn('[Onboarding] Error recording candidate_documents row:', dbErr);
  }

  return { documents: updatedDocs, progress };
}

/**
 * Update checklist item status & document verification (legacy method)
 */
export async function updateOnboardingChecklist(
  candidateId: number,
  checklist: Record<string, boolean> | ChecklistDocumentItem[],
  documentsVerified: boolean
): Promise<void> {
  const sql = `
    UPDATE joining_records
    SET 
      checklist_status = ?,
      documents_verified = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE candidate_id = ?
  `;
  await execute(sql, [JSON.stringify(checklist), documentsVerified ? 1 : 0, candidateId]);
}

/**
 * Update candidate offer status, confirmed joining date, or joining status
 */
export async function updateJoiningRecord(params: {
  candidateId: number;
  offerStatus?: 'draft' | 'sent' | 'accepted' | 'declined';
  confirmedJoiningDate?: string | null;
  joiningStatus?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}): Promise<void> {
  const { candidateId, offerStatus, confirmedJoiningDate, joiningStatus, notes } = params;

  // Ensure record exists
  const existing = await query<RowDataPacket[]>(
    'SELECT id FROM joining_records WHERE candidate_id = ? LIMIT 1',
    [candidateId]
  );

  if (!existing || existing.length === 0) {
    const cand = await getCandidateById(candidateId);
    if (!cand) throw new Error('Candidate not found.');
    await execute(
      `INSERT INTO joining_records (
        candidate_id, assigned_department_id, assigned_position_id,
        proposed_joining_date, offer_status, joining_status
      ) VALUES (?, ?, ?, CURRENT_DATE, ?, ?)`,
      [
        candidateId,
        cand.department_id,
        cand.position_id,
        offerStatus || 'sent',
        joiningStatus || 'pending',
      ]
    );
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (offerStatus !== undefined) {
    updates.push('offer_status = ?');
    values.push(offerStatus);
  }

  if (confirmedJoiningDate !== undefined) {
    updates.push('confirmed_joining_date = ?');
    values.push(confirmedJoiningDate);
    updates.push('proposed_joining_date = ?');
    values.push(confirmedJoiningDate);
  }

  if (joiningStatus !== undefined) {
    updates.push('joining_status = ?');
    values.push(joiningStatus);
  }

  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(candidateId);
    const sql = `UPDATE joining_records SET ${updates.join(', ')} WHERE candidate_id = ?`;
    await execute(sql, values);
  }

  if (offerStatus === 'accepted') {
    try {
      await execute(
        `UPDATE candidates SET application_status = 'offered', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [candidateId]
      );

      const row = await query<RowDataPacket[]>(
        'SELECT checklist_status FROM joining_records WHERE candidate_id = ?',
        [candidateId]
      );
      if (row && row.length > 0 && row[0].checklist_status) {
        let parsed = row[0].checklist_status;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item: any) => {
            if (item.id === 'signed_offer_letter') {
              return { ...item, status: 'verified', verifiedAt: new Date().toISOString() };
            }
            return item;
          });
          await execute('UPDATE joining_records SET checklist_status = ? WHERE candidate_id = ?', [
            JSON.stringify(updated),
            candidateId,
          ]);
        } else if (parsed && typeof parsed === 'object') {
          parsed.offer_accepted = true;
          parsed.offerSigned = true;
          await execute('UPDATE joining_records SET checklist_status = ? WHERE candidate_id = ?', [
            JSON.stringify(parsed),
            candidateId,
          ]);
        }
      }
    } catch (safeErr) {
      console.warn('[Onboarding] Non-blocking safe sync error on offer accepted:', safeErr);
    }
  }
}

export async function finalizeOnboarding(
  candidateId: number,
  confirmedJoiningDate: string,
  bypassVerification: boolean = false
): Promise<{ success: boolean; employeeId?: number; employeeCode?: string }> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) throw new Error('Candidate not found.');

  // Enforce Requirement 9: Prevent onboarding workflow from being marked complete until all configured mandatory documents are verified
  if (!bypassVerification) {
    const checklistData = await getCandidateJoiningChecklist(candidateId);
    if (!checklistData.progress.allMandatoryVerified) {
      throw new Error(
        `Cannot complete onboarding: All configured mandatory documents must be verified first by HR (${checklistData.progress.verifiedMandatory} of ${checklistData.progress.totalMandatory} verified).`
      );
    }
  }

  // Find department code
  const [deptRows] = await query<RowDataPacket[]>('SELECT code FROM departments WHERE id = ?', [candidate.department_id]);
  const deptCode = deptRows?.code || 'TGS';

  const employee = await convertCandidateToEmployee({
    candidateId,
    deptCode,
    fullName: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone,
    departmentId: candidate.department_id,
    positionId: candidate.position_id,
    joinDate: confirmedJoiningDate,
  });

  return {
    success: true,
    employeeId: employee.id,
    employeeCode: employee.employee_code,
  };
}

export interface CustomOfferLetterInput {
  candidateId: number;
  refNo?: string;
  offerDate?: string;
  candidateName?: string;
  candidateEmail?: string;
  designation?: string;
  department?: string;
  employmentType?: string;
  workLocation?: string;
  joiningDate?: string;
  probationPeriod?: string;
  annualCtc?: string;
  acceptByDate?: string;
  pdfBase64?: string;
}

/**
 * Programmatic A4 PDF builder with exact Taraj Global branding, logos, watermark & layout
 */
export async function buildOfferLetterPdfDoc(params: CustomOfferLetterInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // Standard A4
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  // Color tokens
  const blue = rgb(0.012, 0.651, 1.0); // #03A6FF
  const orange = rgb(1.0, 0.439, 0.0); // #FF7000
  const green = rgb(0.447, 0.835, 0.412); // #72D569
  const navy = rgb(0.078, 0.129, 0.239); // #14213D
  const textDark = rgb(0.122, 0.161, 0.216); // #1F2937
  const muted = rgb(0.42, 0.447, 0.502); // #6B7280
  const borderCol = rgb(0.851, 0.871, 0.898); // #D9DEE5

  const candidateName = params.candidateName || 'Candidate Name';
  const email = params.candidateEmail || 'candidate@example.com';
  const designation = params.designation || 'Software Specialist';
  const department = params.department || 'Operations';
  const employmentType = params.employmentType || 'Full-time';
  const workLocation = params.workLocation || 'Pune, Maharashtra, India';
  const joiningDate = params.joiningDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const probation = params.probationPeriod || '6 months';
  const ctc = params.annualCtc || 'INR 6,00,000 per annum';
  const refNo = params.refNo || `TGS/OL/2026/${String(params.candidateId).padStart(3, '0')}`;
  const offerDate = params.offerDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const acceptBy = params.acceptByDate || new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // 1. Watermark TG Icon
  const iconPath = path.join(process.cwd(), 'public', 'logos', 'tg-icon.png');
  if (fs.existsSync(iconPath)) {
    try {
      const iconBytes = fs.readFileSync(iconPath);
      const iconImg = await doc.embedPng(iconBytes);
      const wmWidth = 320;
      const wmHeight = (iconImg.height / iconImg.width) * wmWidth;
      page.drawImage(iconImg, {
        x: (width - wmWidth) / 2,
        y: (height - wmHeight) / 2,
        width: wmWidth,
        height: wmHeight,
        opacity: 0.12,
      });
    } catch {}
  }

  // 2. Top Centered Logo
  let topY = height - 42;
  const logoPath = path.join(process.cwd(), 'public', 'logos', 'tgs-logo-full.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await doc.embedPng(logoBytes);
      const logoW = 165;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      page.drawImage(logoImg, {
        x: (width - logoW) / 2,
        y: topY - logoH,
        width: logoW,
        height: logoH,
      });
      topY = topY - logoH - 12;
    } catch {
      topY -= 30;
    }
  }

  // Helper for 3-color stripe
  function drawStripe(y: number) {
    const segW = (width - 80) / 3;
    page.drawRectangle({ x: 40, y, width: segW, height: 2.5, color: orange });
    page.drawRectangle({ x: 40 + segW, y, width: segW, height: 2.5, color: green });
    page.drawRectangle({ x: 40 + segW * 2, y, width: segW, height: 2.5, color: blue });
  }

  drawStripe(topY);
  topY -= 16;

  // Date and Ref No Row
  page.drawText(`Date: ${offerDate}`, { x: 40, y: topY, size: 9.5, font: boldFont, color: textDark });
  const refText = `Ref No.: ${refNo}`;
  const refW = boldFont.widthOfTextAtSize(refText, 9.5);
  page.drawText(refText, { x: width - 40 - refW, y: topY, size: 9.5, font: boldFont, color: textDark });
  topY -= 18;

  // Title: OFFER LETTER
  const titleText = 'OFFER LETTER';
  const titleW = boldFont.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, { x: (width - titleW) / 2, y: topY, size: 14, font: boldFont, color: navy });
  page.drawRectangle({ x: (width - 36) / 2, y: topY - 5, width: 36, height: 2.5, color: orange });
  topY -= 20;

  // Candidate Box (blue left border)
  page.drawRectangle({ x: 40, y: topY - 28, width: width - 80, height: 28, color: rgb(0.97, 0.98, 0.99) });
  page.drawRectangle({ x: 40, y: topY - 28, width: 3.5, height: 28, color: blue });
  page.drawText(`To: ${candidateName}`, { x: 50, y: topY - 12, size: 9.5, font: boldFont, color: textDark });
  page.drawText(`Email: ${email}`, { x: 50, y: topY - 24, size: 9.5, font: regularFont, color: textDark });
  topY -= 36;

  // Subject Bar (orange left border)
  page.drawRectangle({ x: 40, y: topY - 18, width: width - 80, height: 18, color: rgb(1.0, 0.99, 0.96) });
  page.drawRectangle({ x: 40, y: topY - 18, width: 3.5, height: 18, color: orange });
  page.drawText(`Subject: Offer of Employment - ${designation}`, { x: 50, y: topY - 13, size: 9.5, font: boldFont, color: navy });
  topY -= 26;

  // Salutation & Intro
  page.drawText(`Dear ${candidateName},`, { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark });
  topY -= 14;

  const intro = `We are pleased to offer you the position of ${designation} in the ${department} Department at Taraj Global Solutions. We were deeply impressed by your credentials and look forward to your contributions.`;
  page.drawText(intro, { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark, maxWidth: width - 80, lineHeight: 13.5 });
  topY -= 34;

  // Section 1: Employment Details
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('1', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('EMPLOYMENT DETAILS', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 190, y: topY + 3, width: width - 230, height: 0.8, color: borderCol });
  topY -= 12;

  // Table (2 columns x 3 rows)
  const tblX = 40;
  const tblW = width - 80;
  const rowH = 17;
  const c1W = tblW * 0.22;
  const c2W = tblW * 0.28;
  const c3W = tblW * 0.22;
  const c4W = tblW * 0.28;

  const tableData = [
    [['Designation', designation], ['Department', department]],
    [['Employment Type', employmentType], ['Work Location', workLocation]],
    [['Joining Date', joiningDate], ['Probation Period', probation]],
  ];

  for (let r = 0; r < 3; r++) {
    const rowY = topY - (r + 1) * rowH;
    page.drawRectangle({ x: tblX, y: rowY, width: tblW, height: rowH, borderColor: borderCol, borderWidth: 0.8 });
    page.drawLine({ start: { x: tblX + c1W, y: rowY }, end: { x: tblX + c1W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });
    page.drawLine({ start: { x: tblX + c1W + c2W, y: rowY }, end: { x: tblX + c1W + c2W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });
    page.drawLine({ start: { x: tblX + c1W + c2W + c3W, y: rowY }, end: { x: tblX + c1W + c2W + c3W, y: rowY + rowH }, color: borderCol, thickness: 0.8 });

    // left cell
    page.drawText(tableData[r][0][0], { x: tblX + 6, y: rowY + 5, size: 8.5, font: regularFont, color: muted });
    const val1 = tableData[r][0][1];
    const val1W = boldFont.widthOfTextAtSize(val1, 8.5);
    page.drawText(val1, { x: tblX + c1W + c2W - val1W - 6, y: rowY + 5, size: 8.5, font: boldFont, color: textDark });

    // right cell
    page.drawText(tableData[r][1][0], { x: tblX + c1W + c2W + 6, y: rowY + 5, size: 8.5, font: regularFont, color: muted });
    const val2 = tableData[r][1][1];
    const val2W = boldFont.widthOfTextAtSize(val2, 8.5);
    page.drawText(val2, { x: tblX + tblW - val2W - 6, y: rowY + 5, size: 8.5, font: boldFont, color: textDark });
  }

  topY -= (3 * rowH + 16);

  // Section 2: Compensation & Benefits
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('2', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('COMPENSATION & BENEFITS', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 220, y: topY + 3, width: width - 260, height: 0.8, color: borderCol });
  topY -= 14;

  page.drawText(`Your annual CTC will be ${ctc}, with the detailed salary structure provided separately in Annexure A.`, {
    x: 40,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 80,
    lineHeight: 13.5,
  });
  topY -= 26;

  // Section 3: Terms & Onboarding
  page.drawCircle({ x: 46, y: topY + 3.5, size: 7, color: blue });
  page.drawText('3', { x: 44, y: topY + 0.5, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('TERMS & ONBOARDING', { x: 58, y: topY, size: 9.5, font: boldFont, color: navy });
  page.drawRectangle({ x: 190, y: topY + 3, width: width - 230, height: 0.8, color: borderCol });
  topY -= 14;

  page.drawText('1.', { x: 40, y: topY, size: 9.5, font: boldFont, color: orange });
  page.drawText('Required Documents: Please submit your updated resume, identity proof, educational certificates, and other applicable joining documents upon acceptance.', {
    x: 54,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 94,
    lineHeight: 13.5,
  });
  topY -= 28;

  page.drawText('2.', { x: 40, y: topY, size: 9.5, font: boldFont, color: orange });
  page.drawText(`Offer Acceptance: Please confirm your acceptance by ${acceptBy} by signing below or through the designated electronic acceptance process.`, {
    x: 54,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
    maxWidth: width - 94,
    lineHeight: 13.5,
  });
  topY -= 32;

  // Closing
  page.drawText('We look forward to welcoming you to Taraj Global Solutions and wish you success in your new role.', {
    x: 40,
    y: topY,
    size: 9.5,
    font: regularFont,
    color: textDark,
  });
  topY -= 14;
  page.drawText('Sincerely,', { x: 40, y: topY, size: 9.5, font: regularFont, color: textDark });
  topY -= 12;
  page.drawText('Authorized Signatory', { x: 40, y: topY, size: 9.5, font: boldFont, color: navy });
  topY -= 11;
  page.drawText('Human Resources Department, Taraj Global Solutions', { x: 40, y: topY, size: 8.5, font: regularFont, color: muted });
  topY -= 36;

  // Signatures
  const sigW = (width - 120) / 2;
  // Left:
  page.drawLine({ start: { x: 40, y: topY }, end: { x: 40 + sigW, y: topY }, color: navy, thickness: 1 });
  page.drawText('Authorized Signatory', { x: 40, y: topY - 12, size: 9.5, font: boldFont, color: navy });
  page.drawText('Taraj Global Solutions', { x: 40, y: topY - 23, size: 8.5, font: regularFont, color: muted });

  // Right:
  const sigRightX = width - 40 - sigW;
  page.drawLine({ start: { x: sigRightX, y: topY }, end: { x: width - 40, y: topY }, color: navy, thickness: 1 });
  page.drawText('Candidate Acceptance', { x: sigRightX, y: topY - 12, size: 9.5, font: boldFont, color: navy });
  page.drawText('I accept the employment offer stated above.', { x: sigRightX, y: topY - 22, size: 8.5, font: regularFont, color: muted });
  page.drawText(`Name: ${candidateName}`, { x: sigRightX, y: topY - 33, size: 9.0, font: boldFont, color: textDark });
  page.drawText('Date: ______________', { x: sigRightX, y: topY - 44, size: 9.0, font: regularFont, color: textDark });

  // Footer Pinned
  drawStripe(36);
  page.drawText('Taraj Global Solutions | Confidential Offer Document', { x: 40, y: 24, size: 8, font: regularFont, color: muted });
  page.drawText('Page 1 of 1', { x: width - 40 - regularFont.widthOfTextAtSize('Page 1 of 1', 8), y: 24, size: 8, font: regularFont, color: muted });

  return await doc.save();
}

/**
 * Retrieve path to the offer letter template PDF (supports public/templates, public/templete, and various filenames)
 */
export function getOfferLetterTemplatePath(): string | null {
  const candidateDirs = [
    path.join(process.cwd(), 'public', 'templates'),
    path.join(process.cwd(), 'public', 'templete'),
    path.join(process.cwd(), 'public', 'template'),
  ];
  const candidateNames = [
    'tgs offerletter.pdf',
    'tgs_offerletter.pdf',
    'tgs offer letter.pdf',
    'tgs_offer_letter.pdf',
    'offerletter.pdf',
    'offer_letter.pdf',
    'offer letter.pdf',
    'Taraj_Offer_Letter.pdf',
    'offer.pdf',
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      for (const name of candidateNames) {
        const p = path.join(dir, name);
        if (fs.existsSync(p)) {
          return p;
        }
      }
      try {
        const files = fs.readdirSync(dir);
        const match = files.find(
          (f) => f.toLowerCase().includes('offer') && f.toLowerCase().endsWith('.pdf')
        );
        if (match) {
          return path.join(dir, match);
        }
      } catch {}
    }
  }
  return null;
}

/**
 * Generate official offer letter PDF using saved file, template or programmatic PDF layout
 */
export async function generateOfferLetterPdf(params: {
  candidateId: number;
  salary?: string;
  joiningDate?: string;
}): Promise<Uint8Array> {
  const customSavedPath = path.join(process.cwd(), 'public', 'uploads', 'offer_letters', `offer_letter_${params.candidateId}.pdf`);
  const templatePath = getOfferLetterTemplatePath();
  const templateMtime = templatePath && fs.existsSync(templatePath) ? fs.statSync(templatePath).mtimeMs : 0;
  const customMtime = fs.existsSync(customSavedPath) ? fs.statSync(customSavedPath).mtimeMs : 0;

  // If a custom saved file exists and is strictly newer than the template file, use it
  if (fs.existsSync(customSavedPath) && customMtime >= templateMtime) {
    return fs.readFileSync(customSavedPath);
  }

  // If a template exists in public/templates (or public/templete), use the template PDF!
  if (templatePath && fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath);
  }

  const candidate = await getCandidateById(params.candidateId);
  if (!candidate) throw new Error('Candidate not found.');

  return await buildOfferLetterPdfDoc({
    candidateId: params.candidateId,
    candidateName: candidate.full_name,
    candidateEmail: candidate.email,
    designation: candidate.position_title,
    department: candidate.department_name,
    annualCtc: params.salary || candidate.expected_ctc || 'INR 6,00,000 per annum',
    joiningDate: params.joiningDate || undefined,
  });
}

/**
 * Save custom offer letter generated from the interactive Offer Letter Form
 */
export async function saveCustomOfferLetter(params: CustomOfferLetterInput): Promise<{ filePath: string; fileName: string }> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'offer_letters');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `offer_letter_${params.candidateId}.pdf`;
  const filePathOnDisk = path.join(uploadsDir, fileName);
  const relativeWebPath = `/uploads/offer_letters/${fileName}`;

  let pdfBytes: Uint8Array;
  if (params.pdfBase64) {
    const base64Data = params.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    pdfBytes = Buffer.from(base64Data, 'base64');
  } else {
    const templatePath = getOfferLetterTemplatePath();
    if (templatePath && fs.existsSync(templatePath)) {
      pdfBytes = fs.readFileSync(templatePath);
    } else {
      pdfBytes = await buildOfferLetterPdfDoc(params);
    }
  }

  fs.writeFileSync(filePathOnDisk, pdfBytes);

  // Update candidate joining record offer status & checklist
  try {
    await execute(
      `UPDATE joining_records 
       SET offer_status = 'sent',
           confirmed_joining_date = COALESCE(?, confirmed_joining_date),
           proposed_joining_date = COALESCE(?, proposed_joining_date),
           checklist_status = JSON_SET(COALESCE(checklist_status, '{}'), '$.offer_letter_generated', true, '$.offer_letter_path', ?)
       WHERE candidate_id = ?`,
      [params.joiningDate || null, params.joiningDate || null, relativeWebPath, params.candidateId]
    );

    // Register into candidate_documents table
    await execute(
      `INSERT INTO candidate_documents (candidate_id, document_type, original_filename, stored_filename, file_path, mime_type, file_size)
       VALUES (?, 'offer_letter', ?, ?, ?, 'application/pdf', ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), file_size = VALUES(file_size), uploaded_at = NOW()`,
      [params.candidateId, `Taraj_Offer_Letter_${params.candidateId}.pdf`, fileName, relativeWebPath, pdfBytes.length]
    );
  } catch (dbErr) {
    console.warn('Database record update warning in saveCustomOfferLetter:', dbErr);
  }

  return {
    filePath: relativeWebPath,
    fileName,
  };
}

export interface CustomAppointmentLetterInput {
  candidateId: number;
  companyAddress?: string;
  letterDate?: string;
  refYear?: string;
  refNumber?: string;
  candidateName?: string;
  addressLine1?: string;
  addressLine2?: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  startDate?: string;
  currency?: string;
  basicSalary?: string;
  hra?: string;
  specialAllowances?: string;
  totalCtc?: string;
  probationPeriod?: string;
  workingHoursFrom?: string;
  workingHoursTo?: string;
  workingDaysWeek?: string;
  noticeProbation?: string;
  noticeConfirmation?: string;
  returnWithinDays?: string;
  signatoryName?: string;
  pdfBase64?: string;
}

/**
 * Save custom appointment letter generated from the interactive Appointment Letter Form
 */
export async function saveCustomAppointmentLetter(
  params: CustomAppointmentLetterInput
): Promise<{ filePath: string; fileName: string }> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'appointment_letters');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `appointment_letter_${params.candidateId}.pdf`;
  const filePathOnDisk = path.join(uploadsDir, fileName);
  const relativeWebPath = `/uploads/appointment_letters/${fileName}`;

  let pdfBytes: Uint8Array;
  if (params.pdfBase64) {
    const base64Data = params.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    pdfBytes = Buffer.from(base64Data, 'base64');
  } else {
    // If template exists in public/templates/apptgs.pdf, use that as base
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'apptgs.pdf');
    if (fs.existsSync(templatePath)) {
      pdfBytes = fs.readFileSync(templatePath);
    } else {
      const doc = await PDFDocument.create();
      doc.addPage([595.28, 841.89]);
      doc.addPage([595.28, 841.89]);
      pdfBytes = await doc.save();
    }
  }

  fs.writeFileSync(filePathOnDisk, pdfBytes);

  // Update candidate joining record offer status & checklist
  try {
    await execute(
      `UPDATE joining_records 
       SET offer_status = 'sent',
           confirmed_joining_date = COALESCE(?, confirmed_joining_date),
           proposed_joining_date = COALESCE(?, proposed_joining_date),
           checklist_status = JSON_SET(COALESCE(checklist_status, '{}'), '$.appointment_letter_generated', true, '$.appointment_letter_path', ?)
       WHERE candidate_id = ?`,
      [params.startDate || null, params.startDate || null, relativeWebPath, params.candidateId]
    );

    // Register into candidate_documents table
    await execute(
      `INSERT INTO candidate_documents (candidate_id, document_type, original_filename, stored_filename, file_path, mime_type, file_size)
       VALUES (?, 'appointment_letter', ?, ?, ?, 'application/pdf', ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), file_size = VALUES(file_size), uploaded_at = NOW()`,
      [params.candidateId, `Taraj_Appointment_Letter_${params.candidateId}.pdf`, fileName, relativeWebPath, pdfBytes.length]
    );
  } catch (dbErr) {
    console.warn('Database record update warning in saveCustomAppointmentLetter:', dbErr);
  }

  return {
    filePath: relativeWebPath,
    fileName,
  };
}

/**
 * Retrieve path to the appointment letter template PDF (supports public/templates, public/templete, etc.)
 */
export function getAppointmentLetterTemplatePath(): string | null {
  const candidateDirs = [
    path.join(process.cwd(), 'public', 'templates'),
    path.join(process.cwd(), 'public', 'templete'),
    path.join(process.cwd(), 'public', 'template'),
  ];
  const candidateNames = ['apptgs.pdf', 'appointment_letter.pdf', 'appointment.pdf', 'Taraj_Appointment_Letter.pdf'];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      for (const name of candidateNames) {
        const p = path.join(dir, name);
        if (fs.existsSync(p)) return p;
      }
      try {
        const files = fs.readdirSync(dir);
        const match = files.find(
          (f) => (f.toLowerCase().includes('apptgs') || f.toLowerCase().includes('appoint')) && f.toLowerCase().endsWith('.pdf')
        );
        if (match) return path.join(dir, match);
      } catch {}
    }
  }
  return null;
}

/**
 * Retrieve or generate Appointment Letter PDF (uses custom uploaded PDF or template)
 */
export async function getOrGenerateAppointmentLetterPdf(params: {
  candidateId: number;
}): Promise<Uint8Array> {
  const customSavedPath = path.join(
    process.cwd(),
    'public',
    'uploads',
    'appointment_letters',
    `appointment_letter_${params.candidateId}.pdf`
  );
  const templatePath = getAppointmentLetterTemplatePath();
  const templateMtime = templatePath && fs.existsSync(templatePath) ? fs.statSync(templatePath).mtimeMs : 0;
  const customMtime = fs.existsSync(customSavedPath) ? fs.statSync(customSavedPath).mtimeMs : 0;

  if (fs.existsSync(customSavedPath) && customMtime >= templateMtime) {
    return fs.readFileSync(customSavedPath);
  }

  if (templatePath && fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath);
  }

  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  doc.addPage([595.28, 841.89]);
  return await doc.save();
}


