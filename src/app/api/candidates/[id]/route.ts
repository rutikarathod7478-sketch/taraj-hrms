import { NextRequest, NextResponse } from 'next/server';
import { getCandidateById, updateCandidate } from '@/features/candidates/candidate.service';
import { getSessionUser } from '@/lib/auth/session';
import { sendEmail, generateCandidateEmailTemplate } from '@/lib/email/mailer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidateId = Number(id);

    if (isNaN(candidateId) || candidateId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid candidate ID.' }, { status: 400 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: candidate });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to edit candidate details.' },
        { status: 401 }
      );
    }

    if (user.role !== 'super_admin' && user.role !== 'hr_manager') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. HR Manager or Administrator permissions required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const candidateId = Number(id);
    const body = await request.json();

    const updated = await updateCandidate(candidateId, body);
    return NextResponse.json({ success: true, data: updated, message: 'Candidate updated.' });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const candidateId = Number(id);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'resend_confirmation') {
      const candidate = await getCandidateById(candidateId);
      if (!candidate) {
        return NextResponse.json({ success: false, error: 'Candidate not found.' }, { status: 404 });
      }

      if (!candidate.email) {
        return NextResponse.json({ success: false, error: 'Candidate has no email address.' }, { status: 400 });
      }

      const emailTemplate = generateCandidateEmailTemplate('registration_confirmation', {
        candidateName: candidate.full_name,
        positionTitle: candidate.position_title,
        departmentName: candidate.department_name,
        candidateCode: candidate.candidate_code,
      });

      const sendResult = await sendEmail({
        to: candidate.email,
        subject: emailTemplate.subject,
        templateType: 'registration_confirmation',
        contentHtml: emailTemplate.html,
        contentText: emailTemplate.text,
      });

      if (!sendResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: sendResult.error || 'Failed to dispatch email. Check SMTP server rate limits or logs.',
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Registration confirmation email sent successfully to ${candidate.email}.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
