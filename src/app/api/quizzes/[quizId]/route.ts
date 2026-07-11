import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (err: unknown) {
    console.error('Error fetching quiz:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await context.params;
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (err: unknown) {
    console.error('Error deleting quiz:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
