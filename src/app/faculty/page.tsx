'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Users,
  ShieldAlert,
  PlusCircle,
  Copy,
  QrCode,
  BarChart3,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QuizItem {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  maxViolations: number;
  isActive: boolean;
  questions: unknown[];
  createdAt: string;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQrQuiz, setSelectedQrQuiz] = useState<QuizItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/quizzes');
      const data = await res.json();
      if (data && data.quizzes) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCopyLink = (quiz: QuizItem) => {
    const link = `${window.location.origin}/attempt/${quiz.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (quizId: string, title: string) => {
    if (!confirm(`Are you absolutely sure you want to delete the exam "${title}"? This will also remove student attempt records.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      } else {
        alert('Failed to delete the quiz.');
      }
    } catch {
      alert('Network error while deleting.');
    }
  };

  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Collegiate Exam Suite</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faculty Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Manage your online standardized MCQ examinations. Upload Word (.docx) documents to automatically detect questions
            and correct answers instantly.
          </p>
        </div>

        <Link
          href="/faculty/create"
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2 flex-shrink-0 group"
        >
          <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Upload & Create Quiz (.docx)</span>
        </Link>
      </div>

      {/* Overview Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Published Exams</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{quizzes.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Questions Bank</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{totalQuestions}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Engine</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">100% Active</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Violation Traps</span>
            <p className="text-3xl font-black text-rose-600 mt-1">Configured</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quizzes List Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Your Published Quizzes</h2>
            <p className="text-xs text-slate-500 mt-0.5">Share student links or QR codes, or evaluate submitted automated marks.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-semibold flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching your college examinations...</span>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Quizzes Published Yet</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Start by clicking the button below to upload a Word document (.docx). EduGuard will convert it into a fully interactive
                exam with automated evaluation instantly.
              </p>
            </div>
            <Link
              href="/faculty/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-indigo-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Quiz</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-6 sm:p-8 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 flex-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-md border border-indigo-100">
                      {quiz.subject}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-md">
                      {quiz.questions?.length || 0} MCQs
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-md flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{quiz.durationMinutes} Mins</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-md flex items-center space-x-1" title="Disqualify student after this many security breaches">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Max {quiz.maxViolations} Breaches</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{quiz.title}</h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4 pt-1 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Start: {new Date(quiz.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>End: {new Date(quiz.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                  <button
                    onClick={() => handleCopyLink(quiz)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    {copiedId === quiz.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy Student Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedQrQuiz(quiz)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => router.push(`/faculty/quiz/${quiz.id}/results`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-sm shadow-indigo-200"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Results & Reports</span>
                  </button>

                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    title="Delete Exam"
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Projector Modal */}
      {selectedQrQuiz && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 text-center">
            <button
              onClick={() => setSelectedQrQuiz(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full hover:bg-slate-100 font-bold flex items-center justify-center"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full inline-block mb-2">
              {selectedQrQuiz.subject}
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{selectedQrQuiz.title}</h3>
            <p className="text-xs text-slate-500 mt-1">Scan this QR Code using any mobile phone or camera to start the secure exam.</p>

            <div className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center shadow-inner">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100">
                <QRCodeSVG
                  value={`${window.location.origin}/attempt/${selectedQrQuiz.id}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between gap-2 text-left">
                <span className="text-xs font-mono truncate text-slate-700 select-all">
                  {`${window.location.origin}/attempt/${selectedQrQuiz.id}`}
                </span>
                <button
                  onClick={() => handleCopyLink(selectedQrQuiz)}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-800 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === selectedQrQuiz.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const canvas = document.createElement('canvas');
                    const svg = document.querySelector('.bg-white svg') as SVGElement | null;
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL('image/png');
                        const downloadLink = document.createElement('a');
                        downloadLink.download = `${selectedQrQuiz.title.replace(/\s+/g, '_')}_QR.png`;
                        downloadLink.href = `${pngFile}`;
                        downloadLink.click();
                      }
                    };
                    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
                  }}
                  className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR PNG</span>
                </button>

                <button
                  onClick={() => window.open(`/attempt/${selectedQrQuiz.id}`, '_blank')}
                  className="flex-1 py-3 bg-slate-900 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Open Exam</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
