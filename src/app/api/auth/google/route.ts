import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { setSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();
    if (!credential) {
      return NextResponse.json({ error: 'Credential is required' }, { status: 400 });
    }

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const payload = await resp.json();
    const email: string = payload.email;
    const name: string = payload.name || email.split('@')[0];

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 });
    }

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          passwordHash: `google_${credential.slice(0, 20)}`,
          role: 'faculty',
          department: 'Computer Science & Engineering',
        })
        .returning();
      user = newUser;
    }

    await setSessionUser(user.id);

    return NextResponse.json({ user, message: 'Logged in with Google successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
