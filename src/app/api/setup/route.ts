import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role text NOT NULL DEFAULT 'faculty',
        department text NOT NULL DEFAULT 'Computer Science & Engineering',
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quizzes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        faculty_id uuid NOT NULL REFERENCES users(id),
        title text NOT NULL,
        subject text NOT NULL,
        duration_minutes integer NOT NULL DEFAULT 30,
        start_time timestamp NOT NULL,
        end_time timestamp NOT NULL,
        max_violations integer NOT NULL DEFAULT 5,
        questions jsonb NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id uuid NOT NULL REFERENCES quizzes(id),
        student_name text NOT NULL,
        register_number text NOT NULL,
        department text NOT NULL,
        year text NOT NULL,
        section text NOT NULL,
        start_time timestamp DEFAULT now() NOT NULL,
        completed_at timestamp,
        is_submitted boolean DEFAULT false NOT NULL,
        answers jsonb DEFAULT '{}' NOT NULL,
        marks integer DEFAULT 0 NOT NULL,
        percentage integer DEFAULT 0 NOT NULL,
        correct_count integer DEFAULT 0 NOT NULL,
        wrong_count integer DEFAULT 0 NOT NULL,
        time_taken_seconds integer DEFAULT 0 NOT NULL,
        status text NOT NULL DEFAULT 'in_progress',
        violation_count integer DEFAULT 0 NOT NULL,
        violations_log jsonb DEFAULT '[]' NOT NULL,
        auto_submit_reason text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    return NextResponse.json({ ok: true, message: 'Tables created successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
