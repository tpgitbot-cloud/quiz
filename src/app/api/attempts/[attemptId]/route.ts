import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizzes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params;

    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
    if (!attempt) {
      return NextResponse.json({ error: 'Quiz attempt not found.' }, { status: 404 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, attempt.quizId)).limit(1);
    if (!quiz) {
      return NextResponse.json({ error: 'Associated quiz not found.' }, { status: 404 });
    }

    // Securely strip correctOptionId before sending to client
    const secureQuestions = quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      attempt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        durationMinutes: quiz.durationMinutes,
        maxViolations: quiz.maxViolations,
        endTime: quiz.endTime,
        questions: secureQuestions,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching attempt:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
