import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizzes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quizId, studentName, registerNumber, department, year, section } = body;

    if (!quizId || !studentName || !registerNumber || !department || !year || !section) {
      return NextResponse.json({ error: 'All student verification details are required to begin.' }, { status: 400 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (!quiz.isActive) {
      return NextResponse.json({ error: 'This quiz is no longer active.' }, { status: 403 });
    }

    const now = new Date();
    const startTime = new Date(quiz.startTime);
    const endTime = new Date(quiz.endTime);

    // Give a small 5 minute grace window
    if (now < new Date(startTime.getTime() - 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: `Quiz has not started yet. Scheduled start: ${startTime.toLocaleString()}` },
        { status: 403 }
      );
    }

    if (now > endTime) {
      return NextResponse.json(
        { error: `Quiz has ended. Scheduled end: ${endTime.toLocaleString()}` },
        { status: 403 }
      );
    }

    // Initialize attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        quizId,
        studentName,
        registerNumber,
        department,
        year,
        section,
        startTime: now,
        isSubmitted: false,
        answers: {},
        status: 'in_progress',
      })
      .returning();

    // Securely strip correctOptionId before sending to client
    const secureQuestions = quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    }));

    return NextResponse.json({
      message: 'Quiz attempt started successfully.',
      attemptId: attempt.id,
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
    console.error('Error starting attempt:', err);
    return NextResponse.json({ error: 'Internal server error while starting quiz.' }, { status: 500 });
  }
}
