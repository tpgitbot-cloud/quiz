import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizzes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.quizId, quizId))
      .orderBy(desc(quizAttempts.createdAt));

    return NextResponse.json({ quiz, results: attempts });
  } catch (err: unknown) {
    console.error('Error fetching quiz results:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
