import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizzes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params;
    const body = await request.json();
    const { answers, timeTakenSeconds, autoSubmitReason } = body;

    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    }

    if (attempt.isSubmitted) {
      return NextResponse.json({ message: 'Quiz was already submitted.', attempt }, { status: 200 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, attempt.quizId)).limit(1);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    const finalAnswers = answers || attempt.answers || {};

    // Compare student answers with correct answers extracted from Word document
    let marks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const totalQuestions = quiz.questions.length;

    for (const q of quiz.questions) {
      const studentAns = finalAnswers[q.id];
      if (studentAns) {
        if (studentAns === q.correctOptionId) {
          marks += 1;
          correctCount += 1;
        } else {
          wrongCount += 1;
        }
      }
    }

    const percentage = totalQuestions > 0 ? Math.round((marks / totalQuestions) * 100) : 0;
    const isAutoSubmit = Boolean(autoSubmitReason);

    const [updatedAttempt] = await db
      .update(quizAttempts)
      .set({
        answers: finalAnswers,
        isSubmitted: true,
        completedAt: new Date(),
        status: isAutoSubmit ? 'auto_submitted' : 'submitted',
        autoSubmitReason: autoSubmitReason || null,
        timeTakenSeconds: timeTakenSeconds ?? attempt.timeTakenSeconds,
        marks,
        percentage,
        correctCount,
        wrongCount,
      })
      .where(eq(quizAttempts.id, attemptId))
      .returning();

    return NextResponse.json({
      message: 'Quiz evaluated and submitted successfully.',
      summary: {
        studentName: updatedAttempt.studentName,
        registerNumber: updatedAttempt.registerNumber,
        marks: updatedAttempt.marks,
        totalQuestions,
        percentage: updatedAttempt.percentage,
        correctCount: updatedAttempt.correctCount,
        wrongCount: updatedAttempt.wrongCount,
        timeTakenSeconds: updatedAttempt.timeTakenSeconds,
        violationCount: updatedAttempt.violationCount,
      },
    });
  } catch (err: unknown) {
    console.error('Error submitting attempt:', err);
    return NextResponse.json({ error: 'Internal server error while evaluating quiz.' }, { status: 500 });
  }
}
