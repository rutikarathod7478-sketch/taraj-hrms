import { NextRequest, NextResponse } from 'next/server';
import { getCandidateById, updateCandidate } from '@/features/candidates/candidate.service';

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
