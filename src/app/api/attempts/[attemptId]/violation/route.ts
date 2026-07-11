import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizzes, ViolationEntry } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await context.params;
    const body = await request.json();
    const { type, description } = body;

    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    }

    if (attempt.isSubmitted) {
      return NextResponse.json({ error: 'Quiz already submitted.', isSubmitted: true }, { status: 400 });
    }

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, attempt.quizId)).limit(1);
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    const newViolation: ViolationEntry = {
      timestamp: new Date().toISOString(),
      type: type || 'tab_switch',
      description: description || 'Unauthorized browser action detected.',
    };

    const newViolationCount = attempt.violationCount + 1;
    const newViolationsLog = [...attempt.violationsLog, newViolation];

    // Check if violations breach the maximum threshold configured by faculty
    const isTerminated = newViolationCount >= quiz.maxViolations;

    if (isTerminated) {
      // Evaluate student marks immediately
      let marks = 0;
      let correctCount = 0;
      let wrongCount = 0;
      const totalQuestions = quiz.questions.length;

      for (const q of quiz.questions) {
        const studentAns = attempt.answers[q.id];
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

      await db
        .update(quizAttempts)
        .set({
          violationCount: newViolationCount,
          violationsLog: newViolationsLog,
          isSubmitted: true,
          status: 'terminated',
          autoSubmitReason: `Exceeded maximum allowed security violations (${quiz.maxViolations}). Exam terminated automatically.`,
          completedAt: new Date(),
          marks,
          percentage,
          correctCount,
          wrongCount,
        })
        .where(eq(quizAttempts.id, attemptId));

      return NextResponse.json({
        terminated: true,
        violationCount: newViolationCount,
        maxViolations: quiz.maxViolations,
        message: 'Security breach threshold exceeded. Exam terminated and auto-submitted.',
      });
    } else {
      await db
        .update(quizAttempts)
        .set({
          violationCount: newViolationCount,
          violationsLog: newViolationsLog,
        })
        .where(eq(quizAttempts.id, attemptId));

      return NextResponse.json({
        terminated: false,
        violationCount: newViolationCount,
        maxViolations: quiz.maxViolations,
        message: 'Violation recorded successfully.',
      });
    }
  } catch (err: unknown) {
    console.error('Error logging violation:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
