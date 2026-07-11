import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes, users } from '@/db/schema';
import { getSessionUser } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';

async function getOrFallbackFaculty() {
  let user = await getSessionUser();
  if (!user) {
    const [existing] = await db.select().from(users).where(eq(users.role, 'faculty')).limit(1);
    if (existing) {
      user = existing;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          name: 'Dr. Arthur Pendelton',
          email: 'faculty@college.edu',
          passwordHash: 'password123',
          role: 'faculty',
          department: 'Computer Science & Engineering',
        })
        .returning();
      user = created;
    }
  }
  return user;
}

export async function GET() {
  try {
    const user = await getOrFallbackFaculty();

    const facultyQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.facultyId, user.id))
      .orderBy(desc(quizzes.createdAt));

    return NextResponse.json({ quizzes: facultyQuizzes });
  } catch (err: unknown) {
    console.error('Error fetching quizzes:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrFallbackFaculty();
    const body = await request.json();

    const { title, subject, durationMinutes, startTime, endTime, maxViolations, questions } = body;

    if (!title || !subject || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Invalid quiz data provided.' }, { status: 400 });
    }

    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        facultyId: user.id,
        title,
        subject,
        durationMinutes: Number(durationMinutes) || 30,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxViolations: Number(maxViolations) || 5,
        questions,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ message: 'Quiz created successfully!', quiz: newQuiz });
  } catch (err: unknown) {
    console.error('Error creating quiz:', err);
    return NextResponse.json({ error: 'Failed to publish quiz' }, { status: 500 });
  }
}
