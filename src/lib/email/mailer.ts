import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';
import { execute } from '@/lib/db/mysql';

export interface EmailPayload {
  to: string;
  subject: string;
  templateType:
    | 'registration_confirmation'
    | 'hr_registration_alert'
    | 'interview_scheduled'
    | 'three_rounds_marks'
    | 'rejection'
    | 'selection'
    | 'joining_instructions'
    | 'offer_letter'
    | 'joining_doc_mail'
    | 'appointment_letter'
    | 'joining_mail'
    | 'onboarding_reminder'
    | 'custom'
    | string;
  contentHtml: string;
  contentText?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
    cid?: string;
    contentDisposition?: 'attachment' | 'inline' | string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

function isPlaceholderPassword(pass: string | undefined): boolean {
  if (!pass) return true;
  let p = pass.trim().toLowerCase();
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    p = p.slice(1, -1);
  }
  return (
    p === '' ||
    p === 'youremailpasswordhere' ||
    p === 'your_email_password_here' ||
    p === 'your_smtp_app_password_here' ||
    p === 'your_password_here' ||
    p.includes('placeholder') ||
    p.includes('passwordhere') ||
    p.includes('tokenhere')
  );
}

/**
 * Configure SMTP Transporter using environment settings.
 * Defaults sender and auth user to hr@tarajglobal.com.
 */
function getSmtpTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim() || 'info@tgstechinfo.com';
  let pass = process.env.SMTP_PASS?.trim();
  if (pass && ((pass.startsWith('"') && pass.endsWith('"')) || (pass.startsWith("'") && pass.endsWith("'")))) {
    pass = pass.slice(1, -1);
  }
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass: pass || '',
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 12000,
  });
}

/**
 * Sends email using configured SMTP or logs explicitly as unconfigured/pending.
 * Configured with info@tgstechinfo.com as sender and reply-to.
 * Always persists the attempt in `email_logs` table in MySQL and handles all errors gracefully.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  const defaultFrom = '"Taraj Global Solutions" <info@tgstechinfo.com>';
  const configuredFrom = process.env.SMTP_FROM || defaultFrom;
  const replyTo = process.env.HR_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'info@tgstechinfo.com';
  const rawPass = process.env.SMTP_PASS;

  let status: 'sent' | 'failed' = 'failed';
  let errorMessage: string | null = null;
  let messageId: string | undefined = undefined;

  // 1. Check if SMTP host is configured
  if (!process.env.SMTP_HOST?.trim()) {
    status = 'failed';
    errorMessage = 'SMTP configuration is not set (missing SMTP_HOST in .env.local). Email recorded in audit log.';
    console.warn(`[Mailer] Unconfigured SMTP host for ${payload.to}: ${payload.subject}`);
  }
  // 2. Check if password is still a placeholder
  else if (isPlaceholderPassword(rawPass)) {
    status = 'failed';
    errorMessage = 'SMTP credentials pending: SMTP_PASS is currently set to placeholder in .env.local. Email dispatch queued in audit log.';
    console.info(`[Mailer] SMTP password is placeholder for ${payload.to}: ${payload.subject}. Awaiting real credentials.`);
  }
  // 3. Attempt live network dispatch
  else {
    try {
      const transporter = getSmtpTransporter();
      if (!transporter) {
        throw new Error('Failed to initialize SMTP transporter.');
      }

      const mailOptions: SendMailOptions = {
        from: configuredFrom,
        to: payload.to,
        replyTo,
        subject: payload.subject,
        html: payload.contentHtml,
        text: payload.contentText,
      };

      if (payload.attachments && payload.attachments.length > 0) {
        mailOptions.attachments = payload.attachments.map((att) => {
          const item: Record<string, any> = {
            filename: att.filename,
            contentType: att.contentType || 'application/pdf',
            contentDisposition: (att.contentDisposition || 'attachment') as any,
          };
          if (att.content) {
            item.content = att.content;
          } else if (att.path) {
            item.path = att.path;
          }
          if (att.cid) {
            item.cid = att.cid;
          }
          return item;
        });
        console.log(`[Mailer] Attaching ${payload.attachments.length} file(s) via SMTP (attachment disposition):`, payload.attachments.map(a => a.filename));
      }

      const info = await transporter.sendMail(mailOptions);

      status = 'sent';
      messageId = info.messageId;
      console.log(`[Mailer] Email sent successfully to ${payload.to} (MessageId: ${messageId})`);
    } catch (err: unknown) {
      status = 'failed';
      const errorObj = err as Error;
      const rawError = errorObj?.message || 'Failed to dispatch email via SMTP server.';

      // Graceful classification of authentication errors
      if (rawError.includes('535') || rawError.toLowerCase().includes('authentication failed')) {
        errorMessage = `SMTP authentication failed: Invalid username or password for ${process.env.SMTP_USER || 'info@tgstechinfo.com'}. Please verify SMTP_PASS in .env.local.`;
      } else {
        errorMessage = rawError;
      }

      console.warn(`[Mailer] Graceful delivery notice for ${payload.to}:`, errorMessage);
    }
  }

  // Persist attempt in MySQL email_logs
  try {
    await execute(
      `INSERT INTO email_logs (recipient_email, subject, template_type, status, error_message, sent_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payload.to,
        payload.subject,
        payload.templateType,
        status,
        errorMessage,
        status === 'sent' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
      ]
    );
  } catch (dbErr) {
    console.error('[Mailer] Failed to record email_logs in database:', dbErr);
  }

  return {
    success: status === 'sent',
    status,
    messageId,
    error: errorMessage || undefined,
  };
}

/**
 * Standard email notification templates
 */
export function generateCandidateEmailTemplate(
  type: EmailPayload['templateType'],
  data: {
    candidateName: string;
    positionTitle?: string;
    departmentName?: string;
    joiningDate?: string;
    notes?: string;
    candidateCode?: string;
    acceptanceDeadline?: string;
    downloadUrl?: string;
    candidateType?: string;
    documentTitle?: string;
    remarks?: string;
  }
): { subject: string; html: string; text?: string } {
  switch (type) {
    case 'offer_letter': {
      const jobRole = data.positionTitle || 'Associate';
      const deptName = data.departmentName || 'Operations';
      const deadline =
        data.acceptanceDeadline ||
        (data.joiningDate
          ? `prior to your joining date (${data.joiningDate})`
          : 'within 7 days of receiving this email');
      const safeCandName = data.candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');

      return {
        subject: `Employment Offer: ${jobRole} at Taraj Global Solutions - ${data.candidateName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Taraj Global Header -->
              <div style="border-bottom: 3.5px solid; border-image: linear-gradient(to right, #ff7000 33%, #72d569 33% 66%, #03a6ff 66%) 1; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: #14213d; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Human Resources &bull; Offer of Employment</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Greetings from Taraj Global Solutions.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We are pleased to extend an offer of employment to you for the position of <strong>${jobRole}</strong> in the <strong>${deptName}</strong> department at Taraj Global Solutions.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Please find attached your Offer Letter in PDF format, outlining the details of your position, compensation, proposed date of joining, and applicable terms and conditions.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Kindly review the offer letter carefully and confirm your acceptance by replying to this email by <strong>${deadline}</strong>. Please provide a signed copy of the offer letter, if required by the company.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Upon receiving your acceptance, our HR team will share the joining-document checklist and provide further instructions regarding the onboarding process.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We appreciate your interest in joining Taraj Global Solutions and look forward to welcoming you to our team.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Best regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d; font-size: 14.5px;">Human Resources Team</p>
                <p style="margin: 0; color: #475569; font-weight: 600;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a></p>
                <p style="margin: 14px 0 0 0; color: #1e3a8a; font-weight: 600;">Attachment: Offer_Letter_${safeCandName}.pdf</p>
                ${
                  data.downloadUrl
                    ? `
                <div style="margin-top: 8px;">
                  <a href="${data.downloadUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #03a6ff; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 12.5px; border-radius: 6px;">
                    📥 View / Download Offer Letter (PDF)
                  </a>
                </div>
                `
                    : ''
                }
              </div>
            </div>
            
            <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin-top: 16px;">
              This email and its attachments are confidential and intended solely for the recipient. &bull; Taraj Global Solutions
            </p>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nGreetings from Taraj Global Solutions.\n\nWe are pleased to extend an offer of employment to you for the position of ${jobRole} in the ${deptName} department at Taraj Global Solutions.\n\nPlease find attached your Offer Letter in PDF format, outlining the details of your position, compensation, proposed date of joining, and applicable terms and conditions.\n\nKindly review the offer letter carefully and confirm your acceptance by replying to this email by ${deadline}. Please provide a signed copy of the offer letter, if required by the company.\n\nUpon receiving your acceptance, our HR team will share the joining-document checklist and provide further instructions regarding the onboarding process.\n\nWe appreciate your interest in joining Taraj Global Solutions and look forward to welcoming you to our team.\n\nBest regards,\nHuman Resources Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com\nAttachment: Offer_Letter_${safeCandName}.pdf`,
      };
    }
    case 'registration_confirmation':
      return {
        subject: 'Thank you for registering with Taraj Global Solutions',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">HR &amp; Recruitment Management</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear ${data.candidateName},</p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Thank you for registering with <strong>Taraj Global Solutions</strong>.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                We have successfully received your registration details. Our HR team will review your information and contact you regarding the next steps in the recruitment process.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                Please check your registered email regularly for further updates.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                For any queries, please contact our team at <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a>.
              </p>
              
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Best regards,</p>
                <p style="margin: 0; font-weight: 700; color: #0f172a;">HR Team</p>
                <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none;">info@tgstechinfo.com</a></p>
              </div>
            </div>
            
            <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px;">
              This is an automated notification from Taraj Global Solutions Careers Portal.
            </p>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nThank you for registering with Taraj Global Solutions.\nWe have successfully received your registration details. Our HR team will review your information and contact you regarding the next steps in the recruitment process.\nPlease check your registered email regularly for further updates.\nFor any queries, please contact our team at info@tgstechinfo.com.\n\nBest regards,\nHR Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`,
      };
    case 'selection':
      return {
        subject: `Congratulations! Selection for ${data.positionTitle || 'Position'} at Taraj Global Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Congratulations, ${data.candidateName}!</h2>
            <p>We are delighted to inform you that you have been successfully selected for the position of <strong>${data.positionTitle || 'Specialist'}</strong> in the <strong>${data.departmentName || 'Department'}</strong> at Taraj Global Solutions.</p>
            <p>Our HR team is currently preparing your official Offer Letter and joining documentation.</p>
            ${data.joiningDate ? `<p>Your proposed joining date is: <strong>${data.joiningDate}</strong>.</p>` : ''}
            <p>Warm regards,<br>HR Team<br>Taraj Global Solutions<br>Email: info@tgstechinfo.com</p>
          </div>
        `,
      };
    case 'rejection':
      return {
        subject: `Application Update - Taraj Global Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Dear ${data.candidateName},</h2>
            <p>Thank you for taking the time to interview with us for the <strong>${data.positionTitle || 'Position'}</strong> role at Taraj Global Solutions.</p>
            <p>Although your qualifications were impressive, we have chosen to move forward with candidates whose experience more closely matches our immediate requirements for this role.</p>
            <p>We wish you the very best in your professional endeavors.</p>
            <p>Sincerely,<br>HR Team<br>Taraj Global Solutions<br>Email: info@tgstechinfo.com</p>
          </div>
        `,
      };
    case 'joining_doc_mail': {
      const jobRole = data.positionTitle || 'Specialist';
      const deptName = data.departmentName || 'Operations';
      const isExperienced = (data.candidateType || '').toLowerCase() === 'experienced';

      return {
        subject: `Employee Joining Documents Checklist - Taraj Global Solutions - ${data.candidateName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 680px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Taraj Global Header -->
              <div style="border-bottom: 3.5px solid; border-image: linear-gradient(to right, #ff7000 33%, #72d569 33% 66%, #03a6ff 66%) 1; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: #14213d; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Human Resources &bull; Employee Onboarding &bull; Joining Documents Checklist</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Greetings from Taraj Global Solutions!
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Congratulations on your selection for the position of <strong>${jobRole}</strong> in the <strong>${deptName}</strong> department at Taraj Global Solutions.
              </p>

              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                As part of your pre-onboarding process, please find below the official <strong>Employee Joining Documents Checklist</strong>. Kindly arrange and submit clear soft copies (PDF, JPG, or PNG) of the following documents:
              </p>

              <!-- Section 1: Identity and Address Proof -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #03a6ff;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">1. Identity and Address Proof</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li><strong>Aadhaar Card</strong> (Mandatory)</li>
                  <li><strong>PAN Card</strong> (Mandatory)</li>
                  <li>Passport (if available or required)</li>
                  <li>Driving Licence or Voter ID (if required)</li>
                  <li>Current Address Proof (if required)</li>
                </ul>
              </div>

              <!-- Section 2: Educational Documents -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #72d569;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">2. Educational Documents</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li><strong>SSC (10th)</strong> Mark Sheet and Certificate</li>
                  <li><strong>HSC (12th)</strong> Mark Sheet and Certificate</li>
                  <li><strong>Graduation</strong> Mark Sheets (All Semesters / Consolidate)</li>
                  <li><strong>Graduation Degree Certificate</strong> or Provisional Certificate</li>
                  <li>Diploma Certificate (if applicable)</li>
                  <li>Professional or Technical Certifications (if applicable)</li>
                </ul>
              </div>

              <!-- Section 3: Previous Employment Documents -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #ff7000;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a; font-weight: 700;">3. Previous Employment Documents</h3>
                <p style="margin: 0 0 8px 0; font-size: 11.5px; color: #b45309; font-style: italic; font-weight: 600;">*Required only for experienced candidates.*</p>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li>Previous Company Offer Letter or Appointment Letter</li>
                  <li>Relieving Letter</li>
                  <li>Experience Certificate</li>
                  <li>Last Three Months' Salary Slips (if required)</li>
                  <li>Previous Employment Details</li>
                  <li>Previous UAN / PF Account Details (if applicable)</li>
                </ul>
              </div>

              <!-- Section 4: Bank and Payroll Documents -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #6366f1;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">4. Bank and Payroll Documents</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li>Bank Account Details (Account Number &amp; IFSC Code)</li>
                  <li>Cancelled Cheque or Bank Passbook Copy (if required)</li>
                  <li>PAN Details for Payroll and Tax Purposes</li>
                  <li>UAN / PF Details (if applicable)</li>
                </ul>
              </div>

              <!-- Section 5: Employee Information and Company Forms -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0d9488;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">5. Employee Information and Company Forms</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li>Employee Information Form</li>
                  <li>Emergency Contact Information Form</li>
                  <li>Signed Offer Letter Acceptance</li>
                  <li>Signed Appointment Letter (upon issuance)</li>
                  <li>Company Policies Acknowledgement Form</li>
                  <li>Non-Disclosure Agreement (NDA), if applicable</li>
                  <li>IT Asset Acknowledgement Form, if equipment is provided</li>
                  <li>Background Verification Consent Form, if applicable</li>
                  <li>Employee Declaration Form, if required</li>
                </ul>
              </div>

              <!-- Section 6: Other Documents -->
              <div style="margin: 18px 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #8b5cf6;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a; font-weight: 700;">6. Other Documents</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li>Recent Passport-Size Photograph (White background)</li>
                  <li>Medical Fitness Certificate (only if required for the role)</li>
                  <li>Background Verification Documents (if applicable)</li>
                  <li>Nomination Forms for Applicable Employee Benefits</li>
                  <li>Any Additional Documents Required by HR</li>
                </ul>
              </div>

              <!-- Important Appointment Letter Notice Box -->
              <div style="margin: 24px 0 20px 0; padding: 18px 20px; background-color: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px;">
                <p style="margin: 0 0 6px 0; font-weight: 800; color: #1e3a8a; font-size: 14.5px;">
                  📌 Important Submission &amp; Appointment Letter Notice:
                </p>
                <p style="margin: 0 0 8px 0; font-size: 13.5px; color: #1e293b; line-height: 1.6;">
                  Please submit the requested soft copies of your documents <strong>as soon as possible</strong> by replying directly to this email with attachments or through your designated candidate onboarding portal.
                </p>
                <p style="margin: 0; font-size: 13.5px; color: #1d4ed8; font-weight: 700; line-height: 1.6;">
                  After you send your documents and our HR team completes verification, we will promptly issue and send you your official Appointment Letter.
                </p>
              </div>

              <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
                If you have any questions or require assistance regarding any of the documents listed above, please feel free to reach out to the HR Operations team.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Warm regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d; font-size: 14.5px;">Human Resources Team</p>
                <p style="margin: 0; color: #475569; font-weight: 600;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a></p>
              </div>
            </div>
            
            <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin-top: 16px;">
              This email is confidential and intended solely for the recipient. &bull; Taraj Global Solutions
            </p>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nGreetings from Taraj Global Solutions!\n\nCongratulations on your selection for the position of ${jobRole} in the ${deptName} department at Taraj Global Solutions.\n\nAs part of your pre-onboarding process, please review the Employee Joining Documents Checklist below and submit soft copies of the required documents:\n\n1. Identity and Address Proof:\n- Aadhaar Card (Mandatory)\n- PAN Card (Mandatory)\n- Passport (if available or required)\n- Driving Licence or Voter ID (if required)\n- Current Address Proof (if required)\n\n2. Educational Documents:\n- SSC (10th) Mark Sheet and Certificate\n- HSC (12th) Mark Sheet and Certificate\n- Graduation Mark Sheets\n- Graduation Degree Certificate or Provisional Certificate\n- Diploma Certificate (if applicable)\n- Professional or Technical Certifications (if applicable)\n\n3. Previous Employment Documents (*Required only for experienced candidates*):\n- Previous Company Offer Letter or Appointment Letter\n- Relieving Letter\n- Experience Certificate\n- Last Three Months' Salary Slips (if required)\n- Previous Employment Details\n- Previous UAN / PF Account Details (if applicable)\n\n4. Bank and Payroll Documents:\n- Bank Account Details\n- Cancelled Cheque or Bank Passbook Copy (if required)\n- PAN Details for Payroll and Tax Purposes\n- UAN / PF Details (if applicable)\n\n5. Employee Information and Company Forms:\n- Employee Information Form\n- Emergency Contact Information Form\n- Signed Offer Letter Acceptance\n- Signed Appointment Letter\n- Company Policies Acknowledgement Form\n- Non-Disclosure Agreement (NDA), if applicable\n- IT Asset Acknowledgement Form, if equipment is provided\n- Background Verification Consent Form, if applicable\n- Employee Declaration Form, if required\n\n6. Other Documents:\n- Recent Passport-Size Photograph\n- Medical Fitness Certificate (only if required for the role)\n- Background Verification Documents (if applicable)\n- Nomination Forms for Applicable Employee Benefits\n- Any Additional Documents Required by HR\n\nIMPORTANT INSTRUCTION:\nPlease submit the requested documents as soon as possible by replying directly to this email with attachments or through your candidate portal. After verification of your submitted documents, we will issue and send you your official Appointment Letter.\n\nWarm regards,\nHuman Resources Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`,
      };
    }
    case 'document_correction_request': {
      return {
        subject: `Document Correction Required - Taraj Global Solutions - ${data.candidateName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="border-bottom: 3px solid #ff7000; padding-bottom: 14px; margin-bottom: 20px;">
                <h1 style="color: #14213d; font-size: 20px; font-weight: 800; margin: 0;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase;">HR &bull; Joining Document Verification Update</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                During the verification of your joining documents, our HR team noticed that the following document requires your correction or resubmission:
              </p>

              <div style="margin: 18px 0; padding: 16px; background-color: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px;">
                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #9a3412;">
                  Document: ${data.documentTitle || 'Submitted Document'}
                </p>
                <p style="margin: 0; font-size: 13px; color: #7c2d12;">
                  <strong>HR Remarks / Reason:</strong> ${data.remarks || 'Please provide a clear and complete copy.'}
                </p>
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Kindly reply to this email with the updated copy or re-upload it through your candidate portal as soon as possible so that your onboarding process can proceed without delay.
              </p>

              <p style="font-size: 13.5px; color: #1e3a8a; font-weight: 600; margin-top: 16px;">
                Once all required documents are verified, your official Appointment Letter will be issued.
              </p>

              <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13.5px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Best regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d;">HR Onboarding Team</p>
                <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none;">info@tgstechinfo.com</a></p>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nDuring document verification, the following document requires correction:\nDocument: ${data.documentTitle || 'Submitted Document'}\nRemarks: ${data.remarks || 'Please re-upload a clear copy.'}\n\nPlease reply with the updated copy as soon as possible. Once verified, your Appointment Letter will be issued.\n\nHR Team\nTaraj Global Solutions`,
      };
    }
    case 'documents_verified_success': {
      return {
        subject: `All Joining Documents Verified - Taraj Global Solutions - ${data.candidateName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="border-bottom: 3px solid #72d569; padding-bottom: 14px; margin-bottom: 20px;">
                <h1 style="color: #14213d; font-size: 20px; font-weight: 800; margin: 0;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase;">HR &bull; Document Verification Cleared</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We are pleased to inform you that our HR verification desk has successfully audited and verified all your submitted joining documents.
              </p>

              <div style="margin: 18px 0; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #15803d;">
                  ✓ Pre-Joining Documentation Status: 100% Cleared &amp; Approved
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #166534;">
                  All required mandatory credentials (Identity, Educational, Bank, and Declarations) are in full compliance with Taraj Global Solutions policy.
                </p>
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Our HR department is now generating your official <strong>Letter of Appointment</strong>. You will receive it shortly along with your Day 1 reporting details.
              </p>

              <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13.5px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Warm regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d;">Human Resources Team</p>
                <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none;">info@tgstechinfo.com</a></p>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nAll your joining documents have been successfully verified by Taraj Global Solutions HR team!\nYour official Letter of Appointment is being prepared and will be issued shortly.\n\nWarm regards,\nHR Team\nTaraj Global Solutions`,
      };
    }
    case 'appointment_letter': {
      const jobRole = data.positionTitle || 'Associate';
      const deptName = data.departmentName || 'Operations';
      const safeCandName = data.candidateName.replace(/[^a-zA-Z0-9_-]/g, '_');

      return {
        subject: `Official Letter of Appointment: ${jobRole} - ${data.candidateName} - Taraj Global Solutions`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Taraj Global Header -->
              <div style="border-bottom: 3.5px solid; border-image: linear-gradient(to right, #ff7000 33%, #72d569 33% 66%, #03a6ff 66%) 1; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: #14213d; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Human Resources &bull; Appointment of Employment</p>
              </div>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Greetings from Taraj Global Solutions.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We are pleased to formally issue your <strong>Letter of Appointment</strong> for the post of <strong>${jobRole}</strong> in the <strong>${deptName}</strong> department at Taraj Global Solutions.
              </p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                Please find attached your official Appointment Letter in PDF format, detailing your employment terms, benefits, responsibilities, and company guidelines.
              </p>

              <!-- Prominent Official PDF Attachment Callout Box -->
              <div style="margin: 22px 0; padding: 18px 20px; background-color: #f0fdf4; border: 1.5px solid #86efac; border-left: 5px solid #16a34a; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; font-weight: 800; color: #166534;">
                  📎 Official Appointment Letter Attached
                </p>
                <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 700; color: #0f172a;">
                  File: Appointment_Letter_${safeCandName}.pdf
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569; line-height: 1.5;">
                  Your official Letter of Appointment has been attached as a PDF to this email. You can preview and download it directly from your email client's attachments bar or click the download link below.
                </p>
                ${
                  data.downloadUrl
                    ? `
                <div style="margin-top: 14px;">
                  <a href="${data.downloadUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; border-radius: 6px; box-shadow: 0 2px 4px rgba(22,163,74,0.25);">
                    📥 View / Download Appointment Letter (PDF)
                  </a>
                </div>
                `
                    : ''
                }
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Best regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d; font-size: 14.5px;">Human Resources Team</p>
                <p style="margin: 0; color: #475569; font-weight: 600;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a></p>
              </div>
            </div>
            
            <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin-top: 16px;">
              This email and its attachments are confidential and intended solely for the recipient. &bull; Taraj Global Solutions
            </p>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nGreetings from Taraj Global Solutions.\n\nWe are pleased to formally issue your Letter of Appointment for the post of ${jobRole} in the ${deptName} department at Taraj Global Solutions.\n\nPlease find attached your official Appointment Letter in PDF format, detailing your employment terms, benefits, responsibilities, and company guidelines.\n\nKindly sign and return a duplicate copy of the appointment letter at the time of reporting for duty or via reply to this email.\n\nBest regards,\nHuman Resources Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com\nAttachment: Appointment_Letter_${safeCandName}.pdf`,
      };
    }
    case 'joining':
    case 'joining_mail':
    case 'joining_instructions': {
      const jobRole = data.positionTitle || 'Associate';
      const deptName = data.departmentName || 'Operations';
      const joiningDateStr = data.joiningDate || 'As confirmed by HR';

      return {
        subject: `Official Joining Confirmation & Welcome: ${data.candidateName} - Taraj Global Solutions`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #f1f5f9; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Taraj Global Header -->
              <div style="border-bottom: 3.5px solid; border-image: linear-gradient(to right, #ff7000 33%, #72d569 33% 66%, #03a6ff 66%) 1; padding-bottom: 16px; margin-bottom: 24px;">
                <h1 style="color: #14213d; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px;">TARAJ GLOBAL SOLUTIONS</h1>
                <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Human Resources &bull; Official Joining Confirmation &amp; Day 1 Instructions</p>
              </div>

              <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 0; font-weight: 800;">Welcome to Taraj Global Solutions!</h2>

              <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
              
              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We are thrilled to officially welcome you to the Taraj Global Solutions team as <strong>${jobRole}</strong> in the <strong>${deptName}</strong> department.
              </p>

              <!-- Day 1 Reporting Card -->
              <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #16a34a; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
                  📅 Day 1 Reporting &amp; Orientation Details
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #1e293b;">
                  <tbody>
                    <tr style="border-bottom: 1px solid #dcfce7;">
                      <td style="padding: 6px 0; font-weight: 600; color: #15803d; width: 35%;">Date of Joining:</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${joiningDateStr}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #dcfce7;">
                      <td style="padding: 6px 0; font-weight: 600; color: #15803d;">Reporting Time:</td>
                      <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">05:30 PM</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #dcfce7;">
                      <td style="padding: 6px 0; font-weight: 600; color: #15803d; vertical-align: top;">Office Location:</td>
                      <td style="padding: 6px 0; font-weight: 600; color: #0f172a; line-height: 1.5;">
                        The Space Business Complex, Office No 512 to 517, Grant Rd, Kharadi, Pune, Maharashtra 411014
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; color: #15803d;">Reporting Contact:</td>
                      <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">HR Onboarding &amp; Operations Desk</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              ${
                data.notes
                  ? `
              <div style="margin: 18px 0; padding: 14px; background-color: #f8fafc; border-left: 4px solid #03a6ff; border-radius: 6px;">
                <p style="margin: 0 0 4px 0; font-size: 12.5px; font-weight: 700; color: #0f172a;">Important Instructions:</p>
                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${data.notes}</p>
              </div>
              `
                  : ''
              }

              <div style="margin: 18px 0; padding: 14px; background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 6px;">
                <p style="margin: 0 0 4px 0; font-size: 12.5px; font-weight: 700; color: #854d0e;">Documents Required on Day 1:</p>
                <p style="margin: 0; font-size: 12.5px; color: #713f12; line-height: 1.6;">
                  Please bring your original identity cards (Aadhaar &amp; PAN), academic certificates, and 2 passport-size photographs for in-person HR audit and employee badge generation.
                </p>
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.65;">
                We look forward to having you on board and building a rewarding career together at Taraj Global Solutions!
              </p>

              <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #e2e8f0; font-size: 13.5px; color: #334155;">
                <p style="margin: 0 0 4px 0;">Warm regards,</p>
                <p style="margin: 0; font-weight: 700; color: #14213d;">HR Operations Team</p>
                <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
                <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #03a6ff; text-decoration: none;">info@tgstechinfo.com</a></p>
              </div>
            </div>
            
            <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin-top: 16px;">
              This email is confidential and intended solely for the recipient. &bull; Taraj Global Solutions
            </p>
          </div>
        `,
        text: `Dear ${data.candidateName},\n\nWelcome to Taraj Global Solutions!\nWe are excited to have you join as ${jobRole} in the ${deptName} department.\n\nDay 1 Reporting & Orientation Details:\n- Date of Joining: ${joiningDateStr}\n- Reporting Time: 05:30 PM\n- Office Location: The Space Business Complex, Office No 512 to 517, Grant Rd, Kharadi, Pune, Maharashtra 411014\n- Reporting Contact: HR Onboarding & Operations Desk\n\n${data.notes ? `Instructions: ${data.notes}\n\n` : ''}Please carry original copies of your credentials for verification on your first day.\n\nWarm regards,\nHR Operations Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`,
      };
    }
    default:
      return {
        subject: `Notification from Taraj Global Solutions`,
        html: `<p>Dear ${data.candidateName},</p><p>${data.notes || 'Please check your HRMS portal for updates.'}</p><p>Best regards,<br>HR Team<br>Taraj Global Solutions<br>Email: info@tgstechinfo.com</p>`,
        text: `Dear ${data.candidateName},\n\n${data.notes || 'Please check your HRMS portal for updates.'}\n\nBest regards,\nHR Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`,
      };
  }
}

export interface HrAlertData {
  candidateId: number;
  candidateName: string;
  candidateCode: string;
  candidateEmail: string;
  candidatePhone: string;
  departmentName?: string;
  positionTitle?: string;
  experienceYears?: number;
  qualification?: string;
  currentEmployer?: string;
  candidateType?: string;
}

/**
 * Generate email notification sent to HR team when a new candidate registers
 */
export function generateHrRegistrationAlertTemplate(data: HrAlertData): {
  subject: string;
  html: string;
  text: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const profileUrl = `${appUrl}/hr/candidates/${data.candidateId}`;

  return {
    subject: `New Candidate Registered: ${data.candidateName} (${data.candidateCode})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">HR Internal Alert &bull; Recruitment Portal</p>
              </div>
            </div>
          </div>

          <p style="font-size: 15px; margin-top: 0; color: #0f172a;">
            <strong>Dear HR Team,</strong>
          </p>
          <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
            A new candidate has successfully completed their registration on the careers portal. Here is the summary of the candidate's application:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b; width: 35%;">Candidate Name</td>
                <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">${data.candidateName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Candidate Code</td>
                <td style="padding: 10px 8px; font-family: monospace; font-weight: 700; color: #2563eb;">${data.candidateCode}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Email Address</td>
                <td style="padding: 10px 8px; color: #0f172a;"><a href="mailto:${data.candidateEmail}" style="color: #2563eb; text-decoration: none;">${data.candidateEmail}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Contact Phone</td>
                <td style="padding: 10px 8px; color: #0f172a;">${data.candidatePhone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Department</td>
                <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">${data.departmentName || 'General'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Position Applied</td>
                <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">${data.positionTitle || 'Applicant'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Experience &amp; Type</td>
                <td style="padding: 10px 8px; color: #0f172a;">${data.experienceYears !== undefined ? `${data.experienceYears} Years` : 'Fresher'} (${data.candidateType || 'Applicant'})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Qualification</td>
                <td style="padding: 10px 8px; color: #0f172a;">${data.qualification || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 8px; font-weight: 600; color: #64748b;">Current Employer</td>
                <td style="padding: 10px 8px; color: #0f172a;">${data.currentEmployer || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin: 28px 0 10px 0; text-align: center;">
            <a href="${profileUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
              View Candidate Profile in HR Dashboard &rarr;
            </a>
          </div>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            Taraj Global Solutions &bull; Internal HR Automation System
          </div>
        </div>
      </div>
    `,
    text: `Dear HR Team,\n\nA new candidate has registered on the recruitment portal:\n\n- Candidate Name: ${data.candidateName}\n- Candidate Code: ${data.candidateCode}\n- Email: ${data.candidateEmail}\n- Phone: ${data.candidatePhone}\n- Department: ${data.departmentName || 'General'}\n- Position: ${data.positionTitle || 'Applicant'}\n- Experience: ${data.experienceYears || 0} Years (${data.candidateType || 'Applicant'})\n- Qualification: ${data.qualification || 'N/A'}\n- Current Employer: ${data.currentEmployer || 'N/A'}\n\nView candidate profile: ${profileUrl}\n\nTaraj Global Solutions HRIMS System`,
  };
}

export interface InterviewInvitationData {
  candidateName: string;
  candidateCode?: string;
  candidateEmail: string;
  roundType: string;
  roundTitle: string;
  scheduledAt: string;
  mode: 'Online' | 'Offline' | string;
  departmentName?: string;
  positionTitle?: string;
  interviewerName?: string;
  notes?: string;
}

export function generateInterviewInvitationEmail(data: InterviewInvitationData): {
  subject: string;
  html: string;
  text: string;
} {
  const isOnline = String(data.mode).toLowerCase() === 'online';
  const modeBadgeColor = isOnline ? '#0284c7' : '#d97706';
  const modeBadgeBg = isOnline ? '#e0f2fe' : '#fef3c7';
  const modeLabel = isOnline ? 'Online (Virtual Interview)' : 'Offline (In-Person / Onsite)';

  const subject = `Interview Scheduled: ${data.roundTitle} - Taraj Global Solutions`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Talent Acquisition &amp; Recruitment Operations</p>
        </div>

        <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          We are pleased to invite you to the <strong>${data.roundTitle}</strong> round for the position of <strong>${data.positionTitle || 'Specialist'}</strong>${data.departmentName ? ` in the <strong>${data.departmentName}</strong> department` : ''}.
        </p>

        <!-- Interview Details Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Schedule Information</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 35%;">Interview Round:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${data.roundTitle}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Date &amp; Time:</td>
                <td style="padding: 8px 0; color: #2563eb; font-weight: 700;">${data.scheduledAt}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Interview Mode:</td>
                <td style="padding: 8px 0;">
                  <span style="display: inline-block; background-color: ${modeBadgeBg}; color: ${modeBadgeColor}; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 12px;">
                    ${modeLabel}
                  </span>
                </td>
              </tr>
              ${data.interviewerName ? `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Interviewer / Panel:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.interviewerName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Venue / Link:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 500;">
                  ${isOnline 
                    ? 'Online Video Conference (Meeting details / link will be activated in your candidate portal before the session).' 
                    : 'Taraj Global Solutions Corporate Office, HR Recruitment Center.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Instructions -->
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; border-radius: 4px; margin-bottom: 22px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #166534;">Important Instructions:</p>
          <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12px; color: #166534; line-height: 1.6;">
            ${isOnline ? `
              <li>Please join the meeting 5-10 minutes prior to the scheduled time.</li>
              <li>Ensure you have a stable high-speed internet connection, functional webcam, and microphone.</li>
              <li>Keep your photo ID proof and resume accessible during the session.</li>
            ` : `
              <li>Please arrive at the corporate office at least 15 minutes prior to the scheduled time.</li>
              <li>Carry a printed copy of your updated resume, 2 passport-size photographs, and a valid government photo ID.</li>
              <li>Please contact the front desk on arrival and mention your Candidate Code: <strong>${data.candidateCode || 'N/A'}</strong>.</li>
            `}
          </ul>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          If you need to reschedule or have any questions regarding this interview, please respond directly to this email or contact our talent acquisition team at <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a>.
        </p>

        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
          <p style="margin: 0 0 4px 0;">Best regards,</p>
          <p style="margin: 0; font-weight: 700; color: #0f172a;">HR Recruitment Team</p>
          <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
          <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none;">info@tgstechinfo.com</a></p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
        This is an automated communication from Taraj Global Solutions Recruitment Management System.
      </p>
    </div>
  `;

  const text = `Dear ${data.candidateName},\n\nYou have been scheduled for ${data.roundTitle} with Taraj Global Solutions.\n\nDate & Time: ${data.scheduledAt}\nMode: ${data.mode}\nCandidate Code: ${data.candidateCode || 'N/A'}\nPosition: ${data.positionTitle || 'Applicant'}\n\nInstructions:\n${isOnline ? 'Please ensure a reliable internet connection, working webcam, and microphone.' : 'Please report to the corporate office 15 minutes before the scheduled time with your resume and ID proof.'}\n\nFor any assistance, contact us at info@tgstechinfo.com.\n\nBest regards,\nHR Team\nTaraj Global Solutions`;

  return { subject, html, text };
}

export interface ThreeRoundsMarksEmailData {
  candidateName: string;
  candidateCode: string;
  candidateEmail: string;
  departmentName?: string;
  positionTitle?: string;
  round1Score: number | string;
  round1MaxScore?: number | string;
  round2Score: number | string;
  round2MaxScore?: number | string;
  round3Score: number | string;
  round3MaxScore?: number | string;
  overallPercentage?: number | string;
  totalEarnedScore?: number | string;
  totalPossibleScore?: number | string;
}

/**
 * Generate email containing exclusively round-wise evaluation marks
 * after all 3 interview rounds (HR, Technical, Practical) are completed.
 */
export function generateThreeRoundsMarksEmailTemplate(data: ThreeRoundsMarksEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Interview Evaluation Results: 3 Rounds Marks Summary - ${data.candidateName} (${data.candidateCode})`;

  const r1 = Number(data.round1Score).toFixed(2);
  const r1Max = Number(data.round1MaxScore || 100).toFixed(2);
  const r2 = Number(data.round2Score).toFixed(2);
  const r2Max = Number(data.round2MaxScore || 10).toFixed(2);
  const r3 = Number(data.round3Score).toFixed(2);
  const r3Max = Number(data.round3MaxScore || 10).toFixed(2);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">HR &amp; Recruitment Management System</p>
        </div>

        <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Thank you for completing the interview evaluation process for the <strong>${data.positionTitle || 'Applied Role'}</strong> position in the <strong>${data.departmentName || 'Operations'}</strong> department at Taraj Global Solutions.
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          As all <strong>three interview rounds</strong> have now concluded, please find your official round-wise marks summary below:
        </p>

        <!-- Candidate Info Box -->
        <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #2563eb;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding: 2px 0; width: 140px;">Candidate Code:</td>
              <td style="color: #0f172a; font-weight: 700; font-family: monospace;">${data.candidateCode}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 2px 0;">Candidate Name:</td>
              <td style="color: #0f172a; font-weight: 600;">${data.candidateName}</td>
            </tr>
            ${data.positionTitle ? `
            <tr>
              <td style="color: #64748b; padding: 2px 0;">Applied Role:</td>
              <td style="color: #0f172a; font-weight: 600;">${data.positionTitle}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- 3 Rounds Marks Table (ONLY MARKS) -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Round-Wise Performance Marks
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #1e3a8a; color: #ffffff; text-align: left;">
                <th style="padding: 10px 14px; font-size: 13px; font-weight: 600;">Interview Round</th>
                <th style="padding: 10px 14px; font-size: 13px; font-weight: 600; text-align: right;">Marks Obtained</th>
                <th style="padding: 10px 14px; font-size: 13px; font-weight: 600; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              <!-- Round 1: HR Screening -->
              <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-weight: 600; color: #1e293b;">
                  Round 1: HR Screening
                </td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #2563eb; font-size: 15px;">
                  ${r1} <span style="font-size: 12px; color: #64748b; font-weight: normal;">/ ${r1Max}</span>
                </td>
                <td style="padding: 12px 14px; text-align: right; color: #16a34a; font-weight: 600; font-size: 12px;">
                  ✓ Completed
                </td>
              </tr>

              <!-- Round 2: Technical Round -->
              <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-weight: 600; color: #1e293b;">
                  Round 2: Technical Round
                </td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #2563eb; font-size: 15px;">
                  ${r2} <span style="font-size: 12px; color: #64748b; font-weight: normal;">/ ${r2Max}</span>
                </td>
                <td style="padding: 12px 14px; text-align: right; color: #16a34a; font-weight: 600; font-size: 12px;">
                  ✓ Completed
                </td>
              </tr>

              <!-- Round 3: Practical / Final Round -->
              <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 14px; font-weight: 600; color: #1e293b;">
                  Round 3: Practical / Final Round
                </td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #2563eb; font-size: 15px;">
                  ${r3} <span style="font-size: 12px; color: #64748b; font-weight: normal;">/ ${r3Max}</span>
                </td>
                <td style="padding: 12px 14px; text-align: right; color: #16a34a; font-weight: 600; font-size: 12px;">
                  ✓ Completed
                </td>
              </tr>

              ${data.overallPercentage !== undefined ? `
              <!-- Overall Total -->
              <tr style="background-color: #eff6ff; font-weight: 700;">
                <td style="padding: 12px 14px; color: #1e3a8a; font-size: 14px;">
                  Overall Aggregate Score
                </td>
                <td colspan="2" style="padding: 12px 14px; text-align: right; color: #1e3a8a; font-size: 16px;">
                  ${Number(data.overallPercentage).toFixed(1)}%
                </td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <!-- Strict Scope Note -->
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px 16px; border-radius: 6px; margin-bottom: 22px;">
          <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
            <strong>Note:</strong> This report reflects only your recorded marks across each individual interview round. The Talent Acquisition / HR Department will contact you regarding the formal outcome of your application.
          </p>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          For any questions regarding your interview results, please feel free to reach out to our talent acquisition desk at <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@tgstechinfo.com</a>.
        </p>

        <!-- Footer -->
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
          <p style="margin: 0 0 4px 0;">Best regards,</p>
          <p style="margin: 0; font-weight: 700; color: #0f172a;">HR &amp; Recruitment Team</p>
          <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
          <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none;">info@tgstechinfo.com</a></p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
        This is an official automated notification from Taraj Global Solutions Recruitment Management System.
      </p>
    </div>
  `;

  const text = `Dear ${data.candidateName},\n\nThank you for completing the interview evaluation process at Taraj Global Solutions.\n\nHere is your round-wise performance marks summary:\n\nCandidate Code: ${data.candidateCode}\nCandidate Name: ${data.candidateName}\n\n1. Round 1: HR Screening: ${r1} / ${r1Max}\n2. Round 2: Technical Round: ${r2} / ${r2Max}\n3. Round 3: Practical / Final Round: ${r3} / ${r3Max}\n${data.overallPercentage !== undefined ? `Overall Aggregate Score: ${Number(data.overallPercentage).toFixed(1)}%\n` : ''}\nThis email contains exclusively your round-wise marks summary. Our HR team will reach out to you separately with the final status of your application.\n\nBest regards,\nHR & Recruitment Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`;

  return { subject, html, text };
}

export interface HiringDecisionEmailData {
  candidateName: string;
  candidateCode: string;
  candidateEmail: string;
  jobRole: string;
  department: string;
  hrFeedback?: string;
  technicalFeedback?: string;
  practicalFeedback?: string;
  overallPerformance?: string;
  areasForImprovement?: string;
}

/**
 * Generate official Selection Email with round-wise feedback when candidate is selected
 */
export function generateCandidateSelectionEmailTemplate(data: HiringDecisionEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Selection for ${data.jobRole} - Taraj Global Solutions`;

  const hrFeedback = data.hrFeedback || 'Demonstrated excellent communication clarity, confidence, and strong professional demeanor.';
  const technicalFeedback = data.technicalFeedback || 'Exhibited sound core technical knowledge, analytical reasoning, and structured problem-solving skills.';
  const practicalFeedback = data.practicalFeedback || 'Successfully delivered practical evaluation tasks with accuracy, adherence to requirements, and high autonomy.';
  const overallPerformance = data.overallPerformance || 'Consistently showed strong competencies, positive learning mindset, and high role readiness.';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">HR &amp; Recruitment Management</p>
        </div>

        <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Greetings from Taraj Global Solutions!
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          We are pleased to inform you that you have successfully completed our interview process and have been selected for the position of <strong>${data.jobRole}</strong> in the <strong>${data.department}</strong> department.
        </p>

        <!-- Interview Feedback Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Feedback</h3>
          <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Based on your performance throughout the interview process, please find the feedback below:</p>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.8;">
            <p style="margin: 6px 0;"><strong>HR Round:</strong> ${hrFeedback}</p>
            <p style="margin: 6px 0;"><strong>Technical Round:</strong> ${technicalFeedback}</p>
            <p style="margin: 6px 0;"><strong>Practical Round:</strong> ${practicalFeedback}</p>
            <p style="margin: 6px 0;"><strong>Overall Performance:</strong> ${overallPerformance}</p>
          </div>
        </div>

        <!-- Decision Summary Table -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 18px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; width: 140px; padding: 3px 0;">Final Decision:</td>
              <td style="font-weight: 700; color: #16a34a; font-size: 14px;">Selected</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Candidate ID:</td>
              <td style="font-weight: 700; font-family: monospace; color: #0f172a;">${data.candidateCode}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Job Role:</td>
              <td style="font-weight: 600; color: #0f172a;">${data.jobRole}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 3px 0;">Department:</td>
              <td style="font-weight: 600; color: #0f172a;">${data.department}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 24px; margin-bottom: 8px;">Next Steps</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 12px;">
          Our HR team will share the offer letter with you, including the employment terms and proposed joining date. After you accept the offer, we will send you the required joining-document checklist and guide you through the remaining onboarding formalities.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 14px;">
          Please reply to this email to acknowledge receipt of this selection notification.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Congratulations once again! We appreciate your time and effort throughout the recruitment process and look forward to welcoming you to our team.
        </p>

        <!-- Footer -->
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
          <p style="margin: 0 0 4px 0;">Best regards,</p>
          <p style="margin: 0; font-weight: 700; color: #0f172a;">HR Team</p>
          <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
          <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none;">info@tgstechinfo.com</a></p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
        This is an official automated notification from Taraj Global Solutions Recruitment Management System.
      </p>
    </div>
  `;

  const text = `Dear ${data.candidateName},\n\nGreetings from Taraj Global Solutions!\n\nWe are pleased to inform you that you have successfully completed our interview process and have been selected for the position of ${data.jobRole} in the ${data.department} department.\n\nInterview Feedback\nBased on your performance throughout the interview process, please find the feedback below:\nHR Round: ${hrFeedback}\nTechnical Round: ${technicalFeedback}\nPractical Round: ${practicalFeedback}\nOverall Performance: ${overallPerformance}\n\nFinal Decision: Selected\nCandidate ID: ${data.candidateCode}\nJob Role: ${data.jobRole}\nDepartment: ${data.department}\n\nNext Steps\nOur HR team will share the offer letter with you, including the employment terms and proposed joining date. After you accept the offer, we will send you the required joining-document checklist and guide you through the remaining onboarding formalities.\n\nPlease reply to this email to acknowledge receipt of this selection notification.\n\nCongratulations once again! We appreciate your time and effort throughout the recruitment process and look forward to welcoming you to our team.\n\nBest regards,\nHR Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`;

  return { subject, html, text };
}

/**
 * Generate official Rejection Email with round-wise feedback when candidate is not selected
 */
export function generateCandidateRejectionEmailTemplate(data: HiringDecisionEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Update regarding your application for ${data.jobRole} - Taraj Global Solutions`;

  const hrFeedback = data.hrFeedback || 'Good communication and professional introduction; suggested strengthening structured articulation.';
  const technicalFeedback = data.technicalFeedback || 'Basic technical concepts demonstrated; recommended deepening core architecture and complex problem-solving patterns.';
  const practicalFeedback = data.practicalFeedback || 'Completed evaluation tasks; suggested further practice with production-grade efficiency, speed, and edge cases.';
  const areasForImprovement = data.areasForImprovement || 'Core domain architecture, hands-on implementation speed, and advanced scenario-based problem solving.';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #1e3a8a; font-size: 20px; font-weight: 700; margin: 0;">Taraj Global Solutions</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">HR &amp; Recruitment Management</p>
        </div>

        <p style="font-size: 15px; margin-top: 0; color: #0f172a;">Dear <strong>${data.candidateName}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Greetings from Taraj Global Solutions.
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Thank you for your interest in the position of <strong>${data.jobRole}</strong> at Taraj Global Solutions and for taking the time to participate in our recruitment process.
        </p>

        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          After careful consideration of your interview performance and overall assessment, we regret to inform you that we will not be proceeding with your application for this position at this time.
        </p>

        <!-- Interview Feedback Box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Interview Feedback</h3>
          <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Based on your assessment, we encourage you to focus on the following areas for further development:</p>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.8;">
            <p style="margin: 6px 0;"><strong>HR Interview:</strong> ${hrFeedback}</p>
            <p style="margin: 6px 0;"><strong>Technical Interview:</strong> ${technicalFeedback}</p>
            <p style="margin: 6px 0;"><strong>Practical Assessment:</strong> ${practicalFeedback}</p>
            <p style="margin: 6px 0;"><strong>Areas for Improvement:</strong> ${areasForImprovement}</p>
          </div>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 12px;">
          We hope this feedback helps you in your professional development. Please note that our decision applies to the current position only.
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Thank you once again for considering Taraj Global Solutions. We wish you the very best in your future career endeavors.
        </p>

        <!-- Footer -->
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #334155;">
          <p style="margin: 0 0 4px 0;">Best regards,</p>
          <p style="margin: 0; font-weight: 700; color: #0f172a;">Human Resources Team</p>
          <p style="margin: 0; color: #475569;">Taraj Global Solutions</p>
          <p style="margin: 4px 0 0 0;">Email: <a href="mailto:info@tgstechinfo.com" style="color: #2563eb; text-decoration: none;">info@tgstechinfo.com</a></p>
        </div>
      </div>
      
      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
        This is an official automated notification from Taraj Global Solutions Recruitment Management System.
      </p>
    </div>
  `;

  const text = `Dear ${data.candidateName},\n\nGreetings from Taraj Global Solutions.\n\nThank you for your interest in the position of ${data.jobRole} at Taraj Global Solutions and for taking the time to participate in our recruitment process.\n\nAfter careful consideration of your interview performance and overall assessment, we regret to inform you that we will not be proceeding with your application for this position at this time.\n\nInterview Feedback\nBased on your assessment, we encourage you to focus on the following areas for further development:\nHR Interview: ${hrFeedback}\nTechnical Interview: ${technicalFeedback}\nPractical Assessment: ${practicalFeedback}\nAreas for Improvement: ${areasForImprovement}\n\nWe hope this feedback helps you in your professional development. Please note that our decision applies to the current position only.\n\nThank you once again for considering Taraj Global Solutions. We wish you the very best in your future career endeavors.\n\nBest regards,\nHuman Resources Team\nTaraj Global Solutions\nEmail: info@tgstechinfo.com`;

  return { subject, html, text };
}
