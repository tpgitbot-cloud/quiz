'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  GraduationCap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Building,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
}

interface SecureQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
}

interface SecureQuiz {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  maxViolations: number;
  endTime: string;
  questions: SecureQuestion[];
}

interface AttemptState {
  id: string;
  studentName: string;
  registerNumber: string;
  department: string;
  year: string;
  section: string;
  violationCount: number;
  answers: Record<string, string>;
  isSubmitted: boolean;
  status: string;
}

export default function StudentSecureQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  // Arena Steps: 'VERIFICATION' -> 'EXAM_ARENA' -> 'SUMMARY'
  const [arenaStep, setArenaStep] = useState<'VERIFICATION' | 'EXAM_ARENA' | 'SUMMARY'>('VERIFICATION');

  // Load state
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState('');

  // Quiz Meta
  const [quiz, setQuiz] = useState<SecureQuiz | null>(null);

  // Student Form Registration
  const [studentName, setStudentName] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [section, setSection] = useState('A');

  // Active Attempt Object
  const [attempt, setAttempt] = useState<AttemptState | null>(null);

  // Exam Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(1800); // 30 min default
  const [timeTakenSeconds, setTimeTakenSeconds] = useState<number>(0);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Not saved yet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Security & Warnings State
  const [violationWarningModal, setViolationWarningModal] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: '',
  });
  const [showFullscreenRestore, setShowFullscreenRestore] = useState(false);
  const [splitScreenWarning, setSplitScreenWarning] = useState(false);

  // Evaluation Final Summary
  const [summary, setSummary] = useState<{
    studentName: string;
    registerNumber: string;
    marks: number;
    totalQuestions: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    timeTakenSeconds: number;
    violationCount: number;
  } | null>(null);

  // References to keep event handlers fresh
  const examActiveRef = useRef(false);
  const attemptIdRef = useRef<string | null>(null);

  useEffect(() => {
    examActiveRef.current = arenaStep === 'EXAM_ARENA';
  }, [arenaStep]);

  useEffect(() => {
    if (attempt?.id) {
      attemptIdRef.current = attempt.id;
    }
  }, [attempt]);

  // Initial fetch quiz details to populate Entrance Screen
  useEffect(() => {
    if (!quizId) return;
    setIsLoading(true);

    fetch(`/api/quizzes/${quizId}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data && data.quiz) {
          setQuiz({
            id: data.quiz.id,
            title: data.quiz.title,
            subject: data.quiz.subject,
            durationMinutes: data.quiz.durationMinutes,
            maxViolations: data.quiz.maxViolations,
            endTime: data.quiz.endTime,
            questions: data.quiz.questions,
          });
          setTimeLeftSeconds(data.quiz.durationMinutes * 60);
        } else {
          setInitError(data?.error || 'Examination link invalid or not found.');
        }
      })
      .catch(() => setInitError('Network error connecting to college database.'))
      .finally(() => setIsLoading(false));
  }, [quizId]);

  // Auto Quick Fill Demo Credentials Helper for Evaluator/Student user
  const fillDemoStudent = () => {
    setStudentName('Julian Vance');
    setRegisterNumber(`REG${Math.floor(100000 + Math.random() * 900000)}`);
    setDepartment('Information Technology');
    setYear('2nd Year');
    setSection('B');
  };

  // Begin Start Attempt logic
  const handleStartAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    if (!studentName.trim() || !registerNumber.trim()) {
      alert('Please fill in your complete Full Name and Register Number.');
      return;
    }

    setIsLoading(true);
    setInitError('');

    try {
      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId,
          studentName: studentName.trim(),
          registerNumber: registerNumber.trim().toUpperCase(),
          department,
          year,
          section,
        }),
      });

      const data = await res.json();
      if (res.ok && data.attempt && data.quiz) {
        setAttempt(data.attempt);
        setQuiz(data.quiz);
        setAnswers({});
        setTimeLeftSeconds(data.quiz.durationMinutes * 60);
        setTimeTakenSeconds(0);

        // Request Fullscreen Mode
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (fsErr) {
          console.warn('Browser prevented automatic fullscreen:', fsErr);
        }

        setArenaStep('EXAM_ARENA');
      } else {
        setInitError(data.error || 'Failed to start the examination.');
      }
    } catch {
      setInitError('Network error while starting attempt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Automated Final Submit function
  const submitExam = useCallback(
    async (reason?: string) => {
      if (!attemptIdRef.current || isSubmitting) return;
      setIsSubmitting(true);

      // Clean up fullscreen if needed
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn('Exit fullscreen error:', err);
      }

      try {
        const res = await fetch(`/api/attempts/${attemptIdRef.current}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            timeTakenSeconds,
            autoSubmitReason: reason || null,
          }),
        });

        const data = await res.json();
        if (res.ok && data.summary) {
          setSummary(data.summary);
          setArenaStep('SUMMARY');
        } else {
          alert('Failed to evaluate exam summary.');
          setArenaStep('SUMMARY');
        }
      } catch {
        alert('Network error submitting exam paper.');
        setArenaStep('SUMMARY');
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, timeTakenSeconds, isSubmitting]
  );

  // Security Violation Backend Logger
  const recordViolation = useCallback(
    async (violationType: string, description: string) => {
      if (!attemptIdRef.current) return;

      try {
        const res = await fetch(`/api/attempts/${attemptIdRef.current}/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: violationType,
            description,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setAttempt((prev) => (prev ? { ...prev, violationCount: data.violationCount } : null));

          if (data.terminated) {
            // Exam automatically killed due to exceeding threshold
            await submitExam(`Exceeded maximum allowed security breaches (${data.maxViolations}). Examination terminated.`);
          } else {
            // Show prominent visual warning
            setViolationWarningModal({
              show: true,
              title: `⚠️ ${violationType === 'tab_switch' ? 'Tab Switch' : 'Window Focus Lost'} Detected!`,
              message: `You have breached the examination security protocol. Violation ${data.violationCount} of ${data.maxViolations} allowed breaches before automatic disqualification.`,
            });
          }
        }
      } catch (err) {
        console.error('Failed to record violation:', err);
      }
    },
    [submitExam]
  );

  // ==========================================
  // RIGOROUS BROWSER ANTI-CHEAT EVENT LISTENERS
  // ==========================================

  useEffect(() => {
    if (!examActiveRef.current) return;

    // 1. Right Click Blocker
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('🔒 Context Menu right-clicking is disabled during secure examination.');
    };

    // 2. Keyboard shortcuts block (F12, Ctrl+Shift+I, Ctrl+U, Print, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('devtools', 'Attempted to open Browser Developer Tools using F12 key.');
        alert('🚫 Unauthorized action: F12 Inspector blocked.');
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'i' || e.key === 'j')) {
        e.preventDefault();
        recordViolation('devtools', 'Attempted to open DevTools console.');
        alert('🚫 Unauthorized action: Developer Console shortcut blocked.');
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        recordViolation('devtools', 'Attempted to inspect page Source Code.');
        alert('🚫 Unauthorized action: View Source Code blocked.');
      }
      if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        recordViolation('right_click', 'Attempted to print exam paper.');
        alert('🚫 Unauthorized action: Examination paper printing strictly prohibited.');
      }
      if (e.ctrlKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
      }
      if (e.ctrlKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
      }
    };

    // 3. Tab switch & minimize detector
    const handleVisibilityChange = () => {
      if (document.hidden && examActiveRef.current) {
        recordViolation('tab_switch', 'Student switched tabs or minimized the active exam browser window.');
      }
    };

    // 4. Window focus loss (blur)
    const handleWindowBlur = () => {
      if (examActiveRef.current) {
        recordViolation('window_blur', 'Exam window lost system focus (opened another app or overlay).');
      }
    };

    // 5. Fullscreen exit detector
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examActiveRef.current) {
        setShowFullscreenRestore(true);
        recordViolation('fullscreen_exit', 'Student exited forced Fullscreen browser mode.');
      }
    };

    // 6. Split screen / Resize detector
    const handleResize = () => {
      if (examActiveRef.current && window.innerWidth < 700) {
        setSplitScreenWarning(true);
      } else {
        setSplitScreenWarning(false);
      }
    };

    // Attach all handlers
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);

    return () => {
      // Detach all handlers on cleanup
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [recordViolation]);

  // Exam Countdown Logic
  useEffect(() => {
    if (arenaStep !== 'EXAM_ARENA') return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time expired! Auto submit
          submitExam('Examination time limit expired. Auto-submitted successfully.');
          return 0;
        }
        return prev - 1;
      });
      setTimeTakenSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [arenaStep, submitExam]);

  // Answer selection & auto-save background dispatcher
  const handleSelectOption = async (questionId: string, optionId: string) => {
    const updatedAnswers = { ...answers, [questionId]: optionId };
    setAnswers(updatedAnswers);

    // Auto-save via background request
    if (attempt?.id) {
      try {
        await fetch(`/api/attempts/${attempt.id}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: updatedAnswers,
            timeTakenSeconds,
          }),
        });
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.warn('Auto-save network ping failed:', err);
      }
    }
  };

  const handleRestoreFullscreen = async () => {
    setShowFullscreenRestore(false);
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Restore fullscreen error:', err);
    }
  };

  const currentQ = quiz?.questions[currentQuestionIndex] || null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none no-select">
      {/* ------------------------------------------
          STEP 1: STUDENT VERIFICATION ENTRANCE GATE
          ------------------------------------------ */}
      {arenaStep === 'VERIFICATION' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 max-w-2xl mx-auto w-full">
          {/* Logo & Banner */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EduGuard Secure Arena</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mt-1">Collegiate Examination Verification</p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-200 text-center w-full space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-bold text-slate-800 text-sm">Loading Standardized Exam Portal...</p>
            </div>
          ) : initError ? (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 text-rose-800 text-center w-full space-y-4 shadow-xl">
              <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
              <h2 className="text-xl font-black">Examination Portal Unavailable</h2>
              <p className="text-xs font-semibold leading-relaxed">{initError}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Return to Homepage
              </button>
            </div>
          ) : quiz ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden w-full">
              {/* Exam Summary Box */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 text-white relative">
                <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 font-extrabold text-xs rounded-full uppercase tracking-wider block w-max mb-3">
                  Subject: {quiz.subject}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{quiz.title}</h2>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{quiz.durationMinutes} Minutes Allotted</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Strict Anti-Cheat Traps Lock</span>
                  </div>
                </div>
              </div>

              {/* Student Candidate Form */}
              <form onSubmit={handleStartAttempt} className="p-8 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Candidate Verification</span>
                  <button
                    type="button"
                    onClick={fillDemoStudent}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Quick Autofill Sample Candidate</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">Full Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      placeholder="e.g. Michael Scofield"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">Register Number</label>
                    <input
                      type="text"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      required
                      placeholder="e.g. REG202604"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">Department Module</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">Academic Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">Class Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                </div>

                {/* Secure Enforcement Warning Callout */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start space-x-3">
                  <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block mb-0.5">⚠️ Strong Collegiate Exam Surveillance Active:</span>
                    <span>
                      Upon starting, your browser will enter locked Fullscreen mode. Tab switching, minimizing, or opening other windows
                      is monitored. Exceeding <span className="font-black underline">{quiz.maxViolations} security violations</span> will automatically terminate your exam paper.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base shadow-xl shadow-emerald-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Begin Authenticated Exam Arena</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {/* ------------------------------------------
          STEP 2: THE SECURE EXAM ARENA (FULLSCREEN)
          ------------------------------------------ */}
      {arenaStep === 'EXAM_ARENA' && quiz && attempt && (
        <div className="flex-1 flex flex-col relative z-0 min-h-screen bg-slate-900 text-white overflow-x-hidden secure-exam-container">
          {/* High Security Background Faint Anti-Screenshot Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
            <div className="transform -rotate-30 text-white/[0.03] text-6xl sm:text-8xl font-black font-mono tracking-widest whitespace-nowrap flex flex-col space-y-16">
              <span>{attempt.studentName.toUpperCase()} • {attempt.registerNumber}</span>
              <span>{attempt.studentName.toUpperCase()} • {attempt.registerNumber}</span>
              <span>{attempt.studentName.toUpperCase()} • {attempt.registerNumber}</span>
            </div>
          </div>

          {/* Sticky Arena Header bar */}
          <header className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-30 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                🔒
              </div>
              <div>
                <span className="font-black text-sm block truncate max-w-sm sm:max-w-md">{quiz.title}</span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-2">
                  <span>Candidate: <span className="text-white font-bold">{attempt.studentName}</span> ({attempt.registerNumber})</span>
                  <span>• Section {attempt.section}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-extrabold">
              {/* Security Status Badge */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${attempt.violationCount > 0 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}>
                <ShieldCheck className="w-4 h-4" />
                <span>{attempt.violationCount === 0 ? 'Secure Mode Active' : `Breaches: ${attempt.violationCount} / ${quiz.maxViolations}`}</span>
              </div>

              {/* Real-time Count Down Clock */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-base font-black border ${timeLeftSeconds < 300 ? 'bg-rose-600 border-rose-400 text-white animate-bounce' : 'bg-slate-800 border-slate-700 text-amber-400'}`}>
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(timeLeftSeconds / 60)}:{String(timeLeftSeconds % 60).padStart(2, '0')}
                </span>
              </div>

              {/* Autosave status indicator */}
              <div className="hidden lg:flex items-center space-x-1 text-[10px] text-slate-400 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Saved: {lastSavedTime}</span>
              </div>

              <button
                onClick={() => {
                  if (confirm('Are you absolutely certain you are ready to submit your exam answer paper? You cannot return.')) {
                    submitExam('Student voluntarily submitted examination papers.');
                  }
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-xs uppercase tracking-wider"
              >
                Submit Paper
              </button>
            </div>
          </header>

          {/* Warning Advisory if split screen detected */}
          {splitScreenWarning && (
            <div className="bg-amber-500 text-slate-950 font-black p-3 text-center text-xs flex items-center justify-center space-x-2 shadow-md relative z-20">
              <AlertTriangle className="w-4 h-4" />
              <span>Advisory: You appear to have split-screen active. Ensure the exam is full window to prevent focus breach.</span>
            </div>
          )}

          {/* Main Question Body */}
          <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-8 w-full flex flex-col justify-between relative z-10">
            {/* Question Progress Tracker Navigation Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-black text-slate-400 mb-2">
                <span>QUESTION {currentQuestionIndex + 1} OF {quiz.questions.length}</span>
                <span>{Object.keys(answers).length} / {quiz.questions.length} Answered</span>
              </div>
              {/* Progress dots bar */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {quiz.questions.map((q, idx) => {
                  const isAns = Boolean(answers[q.id]);
                  const isCur = currentQuestionIndex === idx;

                  let dotStyle = 'bg-slate-800 border-slate-700 text-slate-400';
                  if (isCur) dotStyle = 'bg-indigo-600 border-indigo-400 text-white font-black ring-2 ring-indigo-500/50 scale-110';
                  else if (isAns) dotStyle = 'bg-emerald-600 border-emerald-500 text-white font-black';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs transition-all flex-shrink-0 cursor-pointer ${dotStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Paper Card */}
            {currentQ && (
              <div className="bg-slate-800/90 border border-slate-700/90 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-sm flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-700/80 rounded-xl text-xs font-black text-indigo-300 mb-4 uppercase tracking-widest">
                    <span>Multi-Choice Question</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-tight">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 gap-4 mt-8">
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.id;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQ.id, opt.id)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center space-x-4 ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30 shadow-lg'
                            : 'bg-slate-900/60 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-900/90'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black' : 'border-slate-500 text-transparent'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <span className="text-sm sm:text-base font-extrabold flex-1 leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Card Helper Step Controls */}
                <div className="pt-8 border-t border-slate-700/80 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous MCQ</span>
                  </button>

                  {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>Save & Next MCQ</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm('You have reached the last question. Proceed to submit the examination?')) {
                          submitExam('Student voluntarily finished exam.');
                        }
                      }}
                      className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                    >
                      <span>Finish & Submit Exam</span>
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Interactive Violation Advisory Banner Modal */}
          {violationWarningModal.show && (
            <div className="fixed inset-0 bg-rose-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40 animate-pulse">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-rose-500">{violationWarningModal.title}</h3>
                  <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">{violationWarningModal.message}</p>
                </div>
                <button
                  onClick={() => setViolationWarningModal({ show: false, title: '', message: '' })}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  I Understand. Return to Secured Exam
                </button>
              </div>
            </div>
          )}

          {/* Fullscreen Restore Prompt Overlay */}
          {showFullscreenRestore && (
            <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/40 animate-pulse">
                  <Maximize2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Forced Fullscreen Required</h3>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    You have exited Fullscreen mode. To maintain exam security and continue your assessment, please return to Fullscreen mode immediately.
                  </p>
                </div>
                <button
                  onClick={handleRestoreFullscreen}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-base shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5" />
                  <span>Restore Secure Fullscreen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------
          STEP 3: AUTOMATIC EVALUATION SUMMARY REPORT
          ------------------------------------------ */}
      {arenaStep === 'SUMMARY' && summary && attempt && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 py-12 max-w-3xl mx-auto w-full">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-12 text-center w-full relative overflow-hidden animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600"></div>

            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full uppercase tracking-widest inline-block mb-3">
              Standardized Evaluation Completed
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Examination Successfully Submitted
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed font-medium">
              Your examination response paper has been automatically checked and securely saved to the collegiate verification portal.
            </p>

            {/* Candidate Identity Meta Header */}
            <div className="my-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-sm">
                  {summary.studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{summary.studentName}</h3>
                  <p className="font-mono text-xs font-bold text-slate-500">Reg: {summary.registerNumber}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-800 flex items-center justify-end space-x-1">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{attempt.department}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{attempt.year} • Sec {attempt.section}</span>
              </div>
            </div>

            {/* Evaluation Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Marks Obtained</span>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {summary.marks} <span className="text-xs text-slate-400 font-bold">/ {summary.totalQuestions}</span>
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Score Percentage</span>
                <p className="text-3xl font-black text-indigo-600 mt-1">{summary.percentage}%</p>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Time Consumed</span>
                <p className="text-2xl font-black text-slate-900 mt-1.5 font-mono">
                  {Math.floor(summary.timeTakenSeconds / 60)}m {summary.timeTakenSeconds % 60}s
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Security Traps</span>
                <p className={`text-2xl font-black mt-1.5 ${summary.violationCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {summary.violationCount} Fired
                </p>
              </div>
            </div>

            {/* Verification Helper For Evaluator */}
            <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-left text-xs text-indigo-900 flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block mb-0.5">Faculty Evaluation Verification Notice:</span>
                <span>
                  The full question paper breakdown, key responses comparison, and security breach timestamp audit logs are now
                  instantly viewable in the Faculty Results Portal.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>← Return to EduGuard Hub</span>
              </button>

              <button
                onClick={() => router.push(`/faculty/quiz/${quizId}/results`)}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Verify Faculty Results Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
