import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  getOnboardingList,
  updateOnboardingChecklist,
  updateJoiningRecord,
  finalizeOnboarding,
  generateOfferLetterPdf,
  getOfferLetterTemplatePath,
  saveCustomOfferLetter,
  getOrGenerateAppointmentLetterPdf,
  getAppointmentLetterTemplatePath,
  saveCustomAppointmentLetter,
  getCandidateJoiningChecklist,
  updateJoiningDocumentStatus,
  toggleJoiningDocumentMandatory,
  saveCandidateDocumentUpload,
} from '@/features/onboarding/onboarding.service';
import { sendEmail, generateCandidateEmailTemplate } from '@/lib/email/mailer';
import { getCandidateById } from '@/features/candidates/candidate.service';
import { saveUploadedFile } from '@/lib/storage/file-storage';
import { query } from '@/lib/db/mysql';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 1. Get raw candidate joining checklist with progress
    if (action === 'get_checklist') {
      const candidateId = Number(searchParams.get('candidateId'));
      if (!candidateId) {
        return NextResponse.json({ success: false, error: 'candidateId is required' }, { status: 400 });
      }
      const checklistData = await getCandidateJoiningChecklist(candidateId);
      return NextResponse.json({ success: true, data: checklistData });
    }

    // 2. Secure view/download of uploaded candidate document
    if (action === 'view_document' || action === 'download_document') {
      const filePath = searchParams.get('filePath');
      if (!filePath) {
        return new NextResponse('filePath is required', { status: 400 });
      }

      // Restrict access within public/uploads or uploads
      const cleanPath = filePath.replace(/^\/+/, '');
      const diskPath = path.join(process.cwd(), 'public', cleanPath.replace(/^public\//, ''));

      if (!fs.existsSync(diskPath)) {
        return new NextResponse('Document not found on storage server', { status: 404 });
      }

      const fileBuffer = fs.readFileSync(diskPath);
      const ext = path.extname(diskPath).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';

      const isView = action === 'view_document' || searchParams.get('view') === 'true';
      const disposition = isView ? 'inline' : 'attachment';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `${disposition}; filename="${path.basename(diskPath)}"`,
        },
      });
    }

    // Generate, View or Download Offer Letter PDF
    if (action === 'download_offer' || action === 'view_offer') {
      const candidateId = Number(searchParams.get('candidateId'));
      let pdfBytes: Uint8Array;
      if (!candidateId) {
        const templatePath = getOfferLetterTemplatePath();
        if (templatePath && fs.existsSync(templatePath)) {
          pdfBytes = fs.readFileSync(templatePath);
        } else {
          return new NextResponse('candidateId is required', { status: 400 });
        }
      } else {
        pdfBytes = await generateOfferLetterPdf({ candidateId });
      }

      const isView = action === 'view_offer' || searchParams.get('view') === 'true' || searchParams.get('view') === '1';
      const disposition = isView ? 'inline' : 'attachment';

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="Taraj_Global_Offer_Letter_${candidateId || 'Template'}.pdf"`,
        },
      });
    }

    // Generate, View or Download Appointment Letter PDF
    if (action === 'download_appointment' || action === 'view_appointment') {
      const candidateId = Number(searchParams.get('candidateId'));
      let pdfBytes: Uint8Array;
      if (!candidateId) {
        const templatePath = getAppointmentLetterTemplatePath();
        if (templatePath && fs.existsSync(templatePath)) {
          pdfBytes = fs.readFileSync(templatePath);
        } else {
          return new NextResponse('candidateId is required', { status: 400 });
        }
      } else {
        pdfBytes = await getOrGenerateAppointmentLetterPdf({ candidateId });
      }

      const isView = action === 'view_appointment' || searchParams.get('view') === 'true' || searchParams.get('view') === '1';
      const disposition = isView ? 'inline' : 'attachment';

      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${disposition}; filename="Taraj_Global_Appointment_Letter_${candidateId || 'Template'}.pdf"`,
        },
      });
    }

    // Default: list onboarding candidates
    const list = await getOnboardingList();
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, checklist, documentsVerified } = body;

    if (!candidateId) {
      return NextResponse.json({ success: false, error: 'candidateId is required' }, { status: 400 });
    }

    await updateOnboardingChecklist(Number(candidateId), checklist || {}, Boolean(documentsVerified));

    return NextResponse.json({ success: true, message: 'Checklist updated successfully.' });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle Multipart Form Data for candidate document upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const action = formData.get('action') as string;

      if (action === 'upload_document') {
        const file = formData.get('file');
        const candidateId = Number(formData.get('candidateId'));
        const documentId = (formData.get('documentId') as string) || '';

        if (!file || !(file instanceof Blob) || !candidateId || !documentId) {
          return NextResponse.json(
            { success: false, error: 'Valid file, candidateId, and documentId are required.' },
            { status: 400 }
          );
        }

        const stored = await saveUploadedFile('documents', file, `cand_${candidateId}_${documentId}_${Date.now()}`);
        const result = await saveCandidateDocumentUpload({
          candidateId,
          documentId,
          originalFileName: file instanceof File ? file.name : stored.fileName,
          filePath: stored.filePath,
          fileSizeBytes: stored.fileSizeBytes,
          mimeType: stored.mimeType,
        });

        return NextResponse.json({
          success: true,
          message: 'Document uploaded successfully.',
          data: result,
        });
      }
    }

    const body = await request.json();
    const { action } = body;

    // 1. Verify candidate document
    if (action === 'verify_document') {
      const { candidateId, documentId, remarks, verifiedBy } = body;
      if (!candidateId || !documentId) {
        return NextResponse.json(
          { success: false, error: 'candidateId and documentId are required.' },
          { status: 400 }
        );
      }

      const result = await updateJoiningDocumentStatus({
        candidateId: Number(candidateId),
        documentId,
        status: 'verified',
        remarks,
        verifiedBy: verifiedBy || 'HR Operations',
      });

      // If all mandatory documents are now verified, notify candidate if enabled
      if (result.progress.allMandatoryVerified && body.notifyCandidate) {
        try {
          const cand = await getCandidateById(Number(candidateId));
          if (cand?.email) {
            const template = generateCandidateEmailTemplate('documents_verified_success', {
              candidateName: cand.full_name,
              positionTitle: cand.position_title,
              departmentName: cand.department_name,
            });
            await sendEmail({
              to: cand.email,
              subject: template.subject,
              templateType: 'documents_verified_success',
              contentHtml: template.html,
              contentText: template.text,
            });
          }
        } catch (emailErr) {
          console.warn('[Onboarding] Could not dispatch verification success email:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Document verified successfully.',
        data: result,
      });
    }

    // 2. Reject candidate document with reason
    if (action === 'reject_document') {
      const { candidateId, documentId, remarks, notifyCandidate } = body;
      if (!candidateId || !documentId) {
        return NextResponse.json(
          { success: false, error: 'candidateId and documentId are required.' },
          { status: 400 }
        );
      }

      const result = await updateJoiningDocumentStatus({
        candidateId: Number(candidateId),
        documentId,
        status: 'rejected',
        remarks: remarks || 'Please re-submit a clear, valid copy of this document.',
      });

      // Send correction email notification if requested
      if (notifyCandidate) {
        try {
          const cand = await getCandidateById(Number(candidateId));
          if (cand?.email) {
            const docItem = result.documents.find((d) => d.id === documentId);
            const template = generateCandidateEmailTemplate('document_correction_request', {
              candidateName: cand.full_name,
              documentTitle: docItem?.title || documentId,
              remarks,
            });
            await sendEmail({
              to: cand.email,
              subject: template.subject,
              templateType: 'document_correction_request',
              contentHtml: template.html,
              contentText: template.text,
            });
          }
        } catch (emailErr) {
          console.warn('[Onboarding] Could not dispatch correction email:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Document marked as rejected with reason.',
        data: result,
      });
    }

    // 3. Reset document to pending
    if (action === 'reset_document') {
      const { candidateId, documentId } = body;
      if (!candidateId || !documentId) {
        return NextResponse.json(
          { success: false, error: 'candidateId and documentId are required.' },
          { status: 400 }
        );
      }

      const result = await updateJoiningDocumentStatus({
        candidateId: Number(candidateId),
        documentId,
        status: 'pending',
        remarks: null,
      });

      return NextResponse.json({
        success: true,
        message: 'Document reset to pending.',
        data: result,
      });
    }

    // 4. Toggle document mandatory / optional
    if (action === 'toggle_mandatory') {
      const { candidateId, documentId, isMandatory } = body;
      if (!candidateId || !documentId || typeof isMandatory !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'candidateId, documentId, and boolean isMandatory are required.' },
          { status: 400 }
        );
      }

      const result = await toggleJoiningDocumentMandatory({
        candidateId: Number(candidateId),
        documentId,
        isMandatory,
      });

      return NextResponse.json({
        success: true,
        message: `Document set to ${isMandatory ? 'Mandatory' : 'Optional'}.`,
        data: result,
      });
    }

    // 5. Complete onboarding & convert to employee
    if (action === 'complete_onboarding') {
      const { candidateId, confirmedJoiningDate, bypassVerification } = body;
      if (!candidateId || !confirmedJoiningDate) {
        return NextResponse.json(
          { success: false, error: 'candidateId and confirmedJoiningDate are required.' },
          { status: 400 }
        );
      }

      const result = await finalizeOnboarding(
        Number(candidateId),
        confirmedJoiningDate,
        Boolean(bypassVerification)
      );
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Onboarding completed and official employee record created.',
      });
    }

    // 6. Update offer status or joining dates
    if (action === 'update_offer_status' || action === 'update_joining_record') {
      const { candidateId, offerStatus, confirmedJoiningDate, joiningStatus, notes } = body;
      if (!candidateId) {
        return NextResponse.json({ success: false, error: 'candidateId is required.' }, { status: 400 });
      }

      await updateJoiningRecord({
        candidateId: Number(candidateId),
        offerStatus,
        confirmedJoiningDate,
        joiningStatus,
        notes,
      });

      return NextResponse.json({
        success: true,
        message: `Candidate offer status updated to ${offerStatus || 'updated'}.`,
      });
    }

    // 7. Send email notification (offer letter, joining doc mail, appointment letter, etc.)
    if (action === 'send_email') {
      const { candidateId, templateType, notes, confirmedJoiningDate, acceptanceDeadline, recipientEmail } = body;
      const candidate = await getCandidateById(Number(candidateId));

      if (!candidate) {
        return NextResponse.json({ success: false, error: 'Candidate not found.' }, { status: 404 });
      }

      const targetEmail = (recipientEmail || candidate.email || '').trim();
      if (!targetEmail) {
        return NextResponse.json(
          { success: false, error: 'Candidate email address is missing or invalid.' },
          { status: 400 }
        );
      }

      // Ensure we use joining date from confirmedJoiningDate, or falling back to offer/joining_records
      let effectiveJoiningDate = confirmedJoiningDate;
      if (!effectiveJoiningDate) {
        try {
          const jrRows = await query<RowDataPacket[]>(
            'SELECT confirmed_joining_date, proposed_joining_date FROM joining_records WHERE candidate_id = ? LIMIT 1',
            [candidate.id]
          );
          if (jrRows && jrRows.length > 0) {
            effectiveJoiningDate = jrRows[0].confirmed_joining_date || jrRows[0].proposed_joining_date;
          }
        } catch (dbErr) {
          console.warn('[Onboarding] Could not fetch joining_records date:', dbErr);
        }
      }
      if (effectiveJoiningDate) {
        if (typeof effectiveJoiningDate === 'object' && effectiveJoiningDate instanceof Date) {
          effectiveJoiningDate = effectiveJoiningDate.toISOString().slice(0, 10);
        } else {
          effectiveJoiningDate = String(effectiveJoiningDate).slice(0, 10);
        }
      }

      // If joining date or offer email is being sent, also record in joining_records
      if (
        effectiveJoiningDate ||
        templateType === 'offer_letter' ||
        templateType === 'joining' ||
        templateType === 'joining_mail' ||
        templateType === 'appointment_letter'
      ) {
        await updateJoiningRecord({
          candidateId: Number(candidateId),
          offerStatus: 'sent',
          confirmedJoiningDate: effectiveJoiningDate || undefined,
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const downloadAction = templateType === 'appointment_letter' ? 'download_appointment' : 'download_offer';
      const downloadUrl = `${baseUrl}/api/onboarding?action=${downloadAction}&candidateId=${candidate.id}`;

      const template = generateCandidateEmailTemplate(templateType || 'selection', {
        candidateName: candidate.full_name,
        positionTitle: candidate.position_title,
        departmentName: candidate.department_name,
        candidateType: candidate.candidate_type,
        joiningDate: effectiveJoiningDate,
        notes,
        candidateCode: candidate.candidate_code,
        acceptanceDeadline,
        downloadUrl,
      });

      // Prepare PDF attachments if sending offer letter or appointment letter
      const attachments: Array<{
        filename: string;
        path?: string;
        content?: Buffer | string;
        contentType: string;
        cid?: string;
        contentDisposition?: 'attachment' | 'inline' | string;
      }> = [];

      try {
        if (templateType === 'offer_letter') {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'offer_letters');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const pdfFilePath = path.join(uploadsDir, `offer_letter_${candidate.id}.pdf`);

          const pdfBytes = await generateOfferLetterPdf({ candidateId: candidate.id });
          const pdfBuffer = Buffer.from(pdfBytes);
          fs.writeFileSync(pdfFilePath, pdfBuffer);

          const safeName = (candidate.full_name || 'Candidate').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
          attachments.push({
            filename: `Offer_Letter_${safeName}.pdf`,
            content: pdfBuffer,
            path: pdfFilePath,
            contentType: 'application/pdf',
            contentDisposition: 'attachment',
          });
        } else if (templateType === 'appointment_letter') {
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'appointment_letters');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const pdfFilePath = path.join(uploadsDir, `appointment_letter_${candidate.id}.pdf`);

          const pdfBytes = await getOrGenerateAppointmentLetterPdf({ candidateId: candidate.id });
          const pdfBuffer = Buffer.from(pdfBytes);
          fs.writeFileSync(pdfFilePath, pdfBuffer);

          const safeName = (candidate.full_name || 'Candidate').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
          attachments.push({
            filename: `Appointment_Letter_${safeName}.pdf`,
            content: pdfBuffer,
            path: pdfFilePath,
            contentType: 'application/pdf',
            contentDisposition: 'attachment',
          });
        }
      } catch (attErr) {
        console.error('[Mailer] Could not generate attachment for email:', attErr);
      }

      const emailResult = await sendEmail({
        to: targetEmail,
        subject: template.subject,
        templateType: templateType || 'selection',
        contentHtml: template.html,
        contentText: template.text,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      let successMessage = `Email notification dispatched successfully to ${targetEmail}!`;
      if (templateType === 'joining' || templateType === 'joining_mail') {
        successMessage = `Official joining confirmation email dispatched successfully to ${targetEmail} via SMTP!`;
      } else if (templateType === 'joining_doc_mail') {
        successMessage = `Employee joining documents checklist email dispatched successfully to ${targetEmail}!`;
      } else if (templateType === 'offer_letter') {
        successMessage = `Offer letter and email notification dispatched successfully to ${targetEmail}!`;
      } else if (templateType === 'appointment_letter') {
        successMessage = `Appointment letter and email notification dispatched successfully to ${targetEmail}!`;
      }

      return NextResponse.json(
        {
          success: emailResult.success,
          data: emailResult,
          message: emailResult.success ? successMessage : (emailResult.error || 'Failed to dispatch email via SMTP'),
        },
        { status: emailResult.success ? 200 : 500 }
      );
    }

    // 4. Save custom offer letter from Offer Letter Form
    if (action === 'save_offer_letter') {
      const {
        candidateId,
        refNo,
        offerDate,
        candidateName,
        candidateEmail,
        designation,
        department,
        employmentType,
        workLocation,
        joiningDate,
        probationPeriod,
        annualCtc,
        acceptByDate,
        pdfBase64,
      } = body;

      if (!candidateId) {
        return NextResponse.json({ success: false, error: 'candidateId is required.' }, { status: 400 });
      }

      const result = await saveCustomOfferLetter({
        candidateId: Number(candidateId),
        refNo,
        offerDate,
        candidateName,
        candidateEmail,
        designation,
        department,
        employmentType,
        workLocation,
        joiningDate,
        probationPeriod,
        annualCtc,
        acceptByDate,
        pdfBase64,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Offer letter successfully saved and attached to candidate profile.',
      });
    }

    // 5. Save custom appointment letter from Appointment Letter Form
    if (action === 'save_appointment_letter') {
      const {
        candidateId,
        companyAddress,
        letterDate,
        refYear,
        refNumber,
        candidateName,
        addressLine1,
        addressLine2,
        jobTitle,
        department,
        officeLocation,
        startDate,
        currency,
        basicSalary,
        hra,
        specialAllowances,
        totalCtc,
        probationPeriod,
        workingHoursFrom,
        workingHoursTo,
        workingDaysWeek,
        noticeProbation,
        noticeConfirmation,
        returnWithinDays,
        signatoryName,
        pdfBase64,
      } = body;

      if (!candidateId) {
        return NextResponse.json({ success: false, error: 'candidateId is required.' }, { status: 400 });
      }

      const result = await saveCustomAppointmentLetter({
        candidateId: Number(candidateId),
        companyAddress,
        letterDate,
        refYear,
        refNumber,
        candidateName,
        addressLine1,
        addressLine2,
        jobTitle,
        department,
        officeLocation,
        startDate,
        currency,
        basicSalary,
        hra,
        specialAllowances,
        totalCtc,
        probationPeriod,
        workingHoursFrom,
        workingHoursTo,
        workingDaysWeek,
        noticeProbation,
        noticeConfirmation,
        returnWithinDays,
        signatoryName,
        pdfBase64,
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Appointment letter successfully saved and attached to candidate profile.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
