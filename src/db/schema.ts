import { pgTable, text, timestamp, integer, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('faculty'), // 'faculty' or 'admin'
  department: text('department').notNull().default('Computer Science'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  correctOptionId: string;
}

export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  facultyId: uuid('faculty_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  maxViolations: integer('max_violations').notNull().default(5),
  questions: jsonb('questions').$type<QuizQuestion[]>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface ViolationEntry {
  timestamp: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'right_click' | 'devtools' | 'resize';
  description: string;
}

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id).notNull(),
  studentName: text('student_name').notNull(),
  registerNumber: text('register_number').notNull(),
  department: text('department').notNull(),
  year: text('year').notNull(),
  section: text('section').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  isSubmitted: boolean('is_submitted').default(false).notNull(),
  answers: jsonb('answers').$type<Record<string, string>>().default({}).notNull(),
  marks: integer('marks').default(0).notNull(),
  percentage: integer('percentage').default(0).notNull(),
  correctCount: integer('correct_count').default(0).notNull(),
  wrongCount: integer('wrong_count').default(0).notNull(),
  timeTakenSeconds: integer('time_taken_seconds').default(0).notNull(),
  status: text('status').notNull().default('in_progress'), // 'in_progress', 'submitted', 'auto_submitted', 'terminated'
  violationCount: integer('violation_count').default(0).notNull(),
  violationsLog: jsonb('violations_log').$type<ViolationEntry[]>().default([]).notNull(),
  autoSubmitReason: text('auto_submit_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
