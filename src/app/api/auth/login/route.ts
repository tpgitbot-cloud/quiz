import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { setSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      // For demo/college setup, if the user doesn't exist, create it automatically
      // so reviewers and faculty can start creating quizzes immediately.
      const [newUser] = await db
        .insert(users)
        .values({
          name: email.split('@')[0].replace('.', ' ').replace(/^./, (c: string) => c.toUpperCase()),
          email: email,
          passwordHash: password, // In production, hash with bcrypt/argon2
          role: 'faculty',
          department: 'Computer Science & Engineering',
        })
        .returning();
      user = newUser;
    } else {
      // Validate password (simple match or demo override)
      if (user.passwordHash !== password && password !== 'password123' && password !== 'demo') {
        return NextResponse.json({ error: 'Invalid password. Try "password123"' }, { status: 401 });
      }
    }

    await setSessionUser(user.id);

    return NextResponse.json({ user, message: 'Logged in successfully' });
  } catch (err: unknown) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
