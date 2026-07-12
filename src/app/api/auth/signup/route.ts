import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { setSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password, department } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: password,
        role: 'faculty',
        department: department || 'Computer Science & Engineering',
      })
      .returning();

    await setSessionUser(user.id);

    return NextResponse.json({ user, message: 'Account created successfully' });
  } catch (err: unknown) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
