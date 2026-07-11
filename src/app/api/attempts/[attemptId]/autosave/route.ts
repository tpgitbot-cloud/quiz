import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params;
    const body = await request.json();
    const { answers, timeTakenSeconds } = body;

    if (!answers) {
      return NextResponse.json({ error: 'Answers are required for auto-save.' }, { status: 400 });
    }

    // Verify the attempt is still in progress
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    }

    if (attempt.isSubmitted) {
      return NextResponse.json({ error: 'Quiz already submitted.', isSubmitted: true }, { status: 400 });
    }

    await db
      .update(quizAttempts)
      .set({
        answers,
        timeTakenSeconds: timeTakenSeconds ?? attempt.timeTakenSeconds,
      })
      .where(eq(quizAttempts.id, attemptId));

    return NextResponse.json({ message: 'Auto-saved successfully.' });
  } catch (err: unknown) {
    console.error('Error auto-saving attempt:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
