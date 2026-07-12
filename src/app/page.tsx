'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  GraduationCap,
  FileText,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Key,
  Clock,
  Sparkles,
  Maximize2,
  Download,
} from 'lucide-react';
import { QuizQuestion } from '@/db/schema';

interface QuizInfo {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
}

export default function LandingPage() {
  const router = useRouter();
  const [activeQuizzes, setActiveQuizzes] = useState<QuizInfo[]>([]);
  const [studentQuizIdInput, setStudentQuizIdInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [facultyEmail, setFacultyEmail] = useState('faculty@college.edu');
  const [facultyPassword, setFacultyPassword] = useState('password123');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Computer Science & Engineering');
  const [authError, setAuthError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    fetch('/api/quizzes')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.quizzes) {
          setActiveQuizzes(data.quizzes);
        }
      })
      .catch((err) => console.error('Failed to load active quizzes:', err));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          department: signupDepartment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/faculty');
      } else {
        setAuthError(data.error || 'Signup failed');
        setIsLoggingIn(false);
      }
    } catch {
      setAuthError('An unexpected network error occurred');
      setIsLoggingIn(false);
    }
  };

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {}
  }, []);

  const handleInstall = useCallback(async () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      const result = await (installPrompt as any).userChoice;
      if (result.outcome === 'accepted') setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleFacultyLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: facultyEmail, password: facultyPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/faculty');
      } else {
        setAuthError(data.error || 'Login failed.');
        setIsLoggingIn(false);
      }
    } catch {
      setAuthError('An unexpected network error occurred.');
      setIsLoggingIn(false);
    }
  };

  const handleStudentJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentQuizIdInput.trim();
    if (!cleanId) return;

    // Check if user pasted full URL or just the ID
    if (cleanId.includes('/attempt/')) {
      const match = cleanId.split('/attempt/')[1];
      if (match) {
        router.push(`/attempt/${match.replace(/\/.*/, '')}`);
        return;
      }
    }
    router.push(`/attempt/${cleanId}`);
  };

  const handleSampleDownload = () => {
    window.open('/api/quizzes/sample-docx', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">EduGuard</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Collegiate Security Suite
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="p-2 text-slate-500 hover:text-emerald-600 transition-colors rounded-lg hover:bg-slate-100"
                title="Install App"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors flex items-center space-x-1.5"
            >
              <Key className="w-4 h-4" />
              <span>Faculty Portal</span>
            </button>
            <button
              onClick={() => {
                setShowLoginModal(true);
                handleFacultyLogin();
              }}
              className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Instant Demo Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Portals */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Banner Announcement */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Revolutionary Auto-Converter: Upload Word (.docx) & Publish MCQs</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Secure Web-Based Examination Platform for <span className="text-indigo-600">Colleges & Universities</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 font-normal leading-relaxed">
            Empower college faculty to instantly transform Word documents into highly secure, cheat-proof automated MCQ quizzes
            with rigorous real-time violation monitoring.
          </p>
        </div>

        {/* Evaluation Utility Quick Test Panel (Very helpful for Reviewer) */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-16 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Reviewer & Evaluator Dashboard Setup</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Fast-Track Setup & Testing</h3>
              <p className="text-indigo-200 mt-1 text-sm max-w-2xl">
                Test the secure application immediately without manual config. Access pre-built faculty accounts, test documents,
                or try live published student exams right now.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleSampleDownload}
                className="flex-1 sm:flex-none px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4 text-indigo-300" />
                <span>Download Sample .docx</span>
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  handleFacultyLogin();
                }}
                className="flex-1 sm:flex-none px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>🚀 Enter Faculty Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Two Main User Pathways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Faculty Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Faculty Portal</h2>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                Log in securely to upload Word documents (.docx) with red-colored correct answers. System automatically converts
                questions, generates secure student QR codes & links, and automates mark evaluation.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Word (.docx) Red-Text Correct Answer Auto-Detection</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Interactive Question Preview & Option Editor</span>
                </div>
                <div className="flex items-center space-x-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>Student Violation Reports & Excel (.xlsx) Results Download</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Module</span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center space-x-2"
              >
                <span>Faculty Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Entrance Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full transition-transform group-hover:scale-110 pointer-events-none"></div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Student Exam Arena</h2>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                Take timed, highly secure collegiate examinations. Enter your Register Number & Department, enter full screen mode,
                and experience live anti-cheat browser locking.
              </p>

              {/* Enter Quiz ID Form */}
              <form onSubmit={handleStudentJoin} className="mt-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Enter Exam Link / Quiz ID to Join:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentQuizIdInput}
                    onChange={(e) => setStudentQuizIdInput(e.target.value)}
                    placeholder="e.g. paste exam link or select below"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!studentQuizIdInput.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition-all flex items-center space-x-1"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Available Quizzes quick selector for convenience */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Or Join an Active College Exam:
                </label>
                {activeQuizzes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active exams published yet. Login as Faculty to publish.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {activeQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        onClick={() => router.push(`/attempt/${quiz.id}`)}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl cursor-pointer transition-colors group/item"
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 truncate">{quiz.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{quiz.subject}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                          {quiz.durationMinutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rigorous Collegiate Security Overview */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl mb-12">
          <div className="max-w-3xl mb-10">
            <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest block mb-2">
              Impenetrable Testing Environment
            </span>
            <h2 className="text-3xl font-black">Built with Maximum Browser Security</h2>
            <p className="text-slate-400 text-sm mt-2">
              Our Secure Exam Arena guarantees collegiate academic integrity through strict, rigorous browser security restrictions
              and real-time tracking of every unauthorized action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-lg mb-4">
                  🚫
                </div>
                <h4 className="font-bold text-base text-white">No Copy-Paste / Select</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Completely blocks text selection, keyboard copy/cut/paste commands, and context-menu right-clicks.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
                  🔒
                </div>
                <h4 className="font-bold text-base text-white">Tab Switching & Blur Detect</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Monitors browser window focus. Minimizing the browser or switching tabs instantly logs a security violation.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
                  📺
                </div>
                <h4 className="font-bold text-base text-white">Forced Fullscreen & Lock</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Enforces HTML5 Fullscreen mode throughout the exam. Exiting fullscreen mode triggers immediate warning alerts.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
                  ⚙️
                </div>
                <h4 className="font-bold text-base text-white">DevTools & Print Blocking</h4>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Traps keyboard shortcuts F12, Ctrl+Shift+I, Ctrl+U, Print commands. Configurable auto-submit upon X breaches.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Word Upload instructions visual preview */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 sm:p-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 text-center mb-8">
              How the Microsoft Word (.docx) Auto-Converter Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-700 font-black rounded-xl flex items-center justify-center mb-4">
                  1
                </div>
                <h5 className="font-bold text-slate-900">Upload Your .docx</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Prepare your quiz in Word. Type questions (1. Question) and options (A. Option). No special syntax needed.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 bg-rose-100 text-rose-700 font-black rounded-xl flex items-center justify-center mb-4">
                  2
                </div>
                <h5 className="font-bold text-slate-900">Color Answer in Red</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Highlight or format the correct answer option in RED text color. Our AI parser detects it instantly.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 font-black rounded-xl flex items-center justify-center mb-4">
                  3
                </div>
                <h5 className="font-bold text-slate-900">Preview & Publish</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Review the auto-generated interactive quiz, get student links and printable QR codes instantly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-white text-sm">EduGuard Quiz Application</span>
            <span className="text-xs text-slate-500">| Standardized Collegiate Testing</span>
          </div>
          <div className="text-xs flex items-center space-x-6">
            <span>© 2026 EduGuard Inc. All rights reserved.</span>
            <button onClick={() => setShowLoginModal(true)} className="hover:text-white transition-colors">
              Faculty Login
            </button>
          </div>
        </div>
      </footer>

      {/* Faculty Secure Authentication Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {authMode === 'login' ? 'Faculty Login' : 'Create Account'}
                </h3>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Login / Signup Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleFacultyLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    required
                    placeholder="name@college.edu"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={facultyPassword}
                    onChange={(e) => setFacultyPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                    ⚠️ {authError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300"
                  >
                    {isLoggingIn ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFacultyEmail('admin@college.edu');
                      setFacultyPassword('password123');
                    }}
                    className="text-xs text-indigo-600 hover:underline font-bold"
                  >
                    Demo: Switch to Admin Account
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    placeholder="Dr. Jane Smith"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    placeholder="name@college.edu"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={4}
                    placeholder="Choose a password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    placeholder="Computer Science & Engineering"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                    ⚠️ {authError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 disabled:bg-slate-300"
                  >
                    {isLoggingIn ? (
                      <span>Creating account...</span>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    );
  }