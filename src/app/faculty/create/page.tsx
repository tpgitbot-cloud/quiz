'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  Clock,
  Calendar,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Copy,
  QrCode,
  Download,
} from 'lucide-react';
import { QuizQuestion } from '@/db/schema';
import { QRCodeSVG } from 'qrcode.react';

export default function CreateQuizPage() {
  const router = useRouter();

  // Upload & Parsing states
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parseSuccessMessage, setParseSuccessMessage] = useState('');

  // Interactive Live Preview Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Publish Config states
  const [title, setTitle] = useState('Standardized Internal Assessment Test 1');
  const [subject, setSubject] = useState('Computer Science - Data Structures');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Default start: now, End: now + 3 days for generous college testing windows
  const now = new Date();
  const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(nowStr);
  const [endTime, setEndTime] = useState(endStr);
  const [maxViolations, setMaxViolations] = useState(5);

  // Publishing states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedQuiz, setPublishedQuiz] = useState<{ id: string; title: string; subject: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError('');
    setParseSuccessMessage('');
    setIsParsing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/quizzes/parse-docx', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.questions) {
        setQuestions(data.questions);
        setParseSuccessMessage(data.message || `Successfully loaded ${data.questions.length} questions!`);
        // If the filename looks like a quiz title, use it
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        if (baseName && baseName !== 'Sample College Quiz') {
          setTitle(baseName);
        }
      } else {
        setParseError(data.error || 'Failed to detect questions in the uploaded document.');
      }
    } catch {
      setParseError('An unexpected network error occurred while analyzing the Word document.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSampleDownload = () => {
    window.open('/api/quizzes/sample-docx', '_blank');
  };

  const updateQuestionText = (index: number, newQuestionText: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[index]) copy[index].question = newQuestionText;
      return copy;
    });
  };

  const updateOptionText = (qIndex: number, oIndex: number, newOptionText: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = copy[qIndex];
      if (q && q.options[oIndex]) {
        q.options[oIndex].text = newOptionText;
      }
      return copy;
    });
  };

  const updateCorrectOption = (qIndex: number, optionId: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIndex]) copy[qIndex].correctOptionId = optionId;
      return copy;
    });
  };

  const removeQuestion = (qIndex: number) => {
    if (confirm('Remove this question from the exam preview?')) {
      setQuestions((prev) => prev.filter((_, i) => i !== qIndex));
    }
  };

  const addNewQuestion = () => {
    const letterOpts = ['A', 'B', 'C', 'D'];
    const newOptions = letterOpts.map((l) => ({
      id: `opt_${l}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: `${l}. New Option text`,
    }));

    const newQ: QuizQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question: 'Type your new examination question here...',
      options: newOptions,
      correctOptionId: newOptions[0].id,
    };

    setQuestions((prev) => [...prev, newQ]);
  };

  const loadDemoQuestions = () => {
    const demoQ: QuizQuestion[] = [
      {
        id: 'q_d1',
        question: 'Which of the following sorting algorithms has a best-case time complexity of O(n log n)?',
        options: [
          { id: 'o_1a', text: 'A. Bubble Sort' },
          { id: 'o_1b', text: 'B. Merge Sort' },
          { id: 'o_1c', text: 'C. Insertion Sort' },
          { id: 'o_1d', text: 'D. Selection Sort' },
        ],
        correctOptionId: 'o_1b',
      },
      {
        id: 'q_d2',
        question: 'What is the primary role of an Operating System kernel?',
        options: [
          { id: 'o_2a', text: 'A. Compiling source code into machine code' },
          { id: 'o_2b', text: 'B. Rendering graphical user interfaces' },
          { id: 'o_2c', text: 'C. Managing hardware resources and system memory' },
          { id: 'o_2d', text: 'D. Encrypting website network communications' },
        ],
        correctOptionId: 'o_2c',
      },
      {
        id: 'q_d3',
        question: 'In computer networking, which transport layer protocol guarantees reliable, ordered delivery of packets?',
        options: [
          { id: 'o_3a', text: 'A. UDP (User Datagram Protocol)' },
          { id: 'o_3b', text: 'B. TCP (Transmission Control Protocol)' },
          { id: 'o_3c', text: 'C. ICMP (Internet Control Message Protocol)' },
          { id: 'o_3d', text: 'D. IP (Internet Protocol)' },
        ],
        correctOptionId: 'o_3b',
      },
      {
        id: 'q_d4',
        question: 'What does the term "Polymorphism" signify in Object-Oriented Programming?',
        options: [
          { id: 'o_4a', text: 'A. Hiding internal implementation details from external classes' },
          { id: 'o_4b', text: 'B. Bundling data fields and methods together into a single unit' },
          { id: 'o_4c', text: 'C. Deriving a new subclass from an existing parent class' },
          { id: 'o_4d', text: 'D. The ability of different classes to respond to the same message/method identically' },
        ],
        correctOptionId: 'o_4d',
      },
    ];
    setQuestions(demoQ);
    setTitle('Computer Science Proficiency Test - Core Modules');
    setSubject('CSE 301 - Core Computer Science');
    setParseSuccessMessage('Loaded premium collegiate question bank instantly.');
  };

  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      alert('Please upload a Word document (.docx) or load demo questions before publishing the examination.');
      return;
    }

    // Verify all questions have a correct answer marked
    const unmarked = questions.find((q) => !q.correctOptionId);
    if (unmarked) {
      alert(`Question "${unmarked.question.substring(0, 30)}..." does not have a correct answer selected. Please choose one.`);
      return;
    }

    setIsPublishing(true);

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject,
          durationMinutes,
          startTime,
          endTime,
          maxViolations,
          questions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.quiz) {
        setPublishedQuiz(data.quiz);
      } else {
        alert(data.error || 'Failed to publish quiz.');
      }
    } catch {
      alert('Network error while publishing.');
    } finally {
      setIsPublishing(false);
    }
  };

  const examLink = publishedQuiz ? `${window.location.origin}/attempt/${publishedQuiz.id}` : '';

  const copyPublishedLink = () => {
    if (!examLink) return;
    navigator.clipboard.writeText(examLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Navigation Notice */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/faculty" className="text-xs font-extrabold text-indigo-600 hover:underline mb-1 inline-block">
            ← Back to Faculty Dashboard
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upload & Publish Word (.docx) Exam</h1>
        </div>

        <button
          onClick={handleSampleDownload}
          className="px-4 py-2.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center space-x-1.5"
        >
          <FileText className="w-4 h-4" />
          <span>Download Sample Format (.docx)</span>
        </button>
      </div>

      {/* Upload Callout Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Config MCQ Engine</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Simply Upload Your Microsoft Word Document
          </h2>
          <p className="mt-2 text-indigo-100 text-sm leading-relaxed">
            Write your college questions (1. Question) and options (A. Option). <span className="font-extrabold underline text-amber-300">Format or color your correct answer option in RED text color.</span> Our automatic parser extracts everything instantly.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* Native file input */}
            <label className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 font-black text-white text-sm rounded-2xl cursor-pointer transition-all shadow-lg shadow-indigo-500/30 flex items-center space-x-2 border border-indigo-400/30 active:scale-95">
              {isParsing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Word XML...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Choose Word (.docx) File</span>
                </>
              )}
              <input type="file" accept=".docx" onChange={handleFileChange} disabled={isParsing} className="hidden" />
            </label>

            <button
              type="button"
              onClick={loadDemoQuestions}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm rounded-2xl transition-all"
            >
              Or Load 4 Premium Sample Questions Instant Test
            </button>
          </div>

          {file && (
            <div className="mt-4 flex items-center space-x-2 text-xs text-indigo-200">
              <span className="font-bold">Selected uploaded file:</span>
              <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-md text-amber-300">{file.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Parse Feedback Banner */}
      {parseError && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 text-rose-800 flex items-center space-x-3 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-black">Error processing document:</p>
            <p className="mt-0.5">{parseError}</p>
          </div>
        </div>
      )}

      {parseSuccessMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-black text-sm">Success!</p>
              <p className="text-xs mt-0.5 font-medium">{parseSuccessMessage} Review and make any final edits below.</p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm">
            {questions.length} Questions Ready
          </span>
        </div>
      )}

      {/* Main Form: Publishing Settings + Live Preview Editor */}
      <form onSubmit={handlePublishQuiz} className="space-y-12">
        {/* Step 1: Exam Publishing Configuration Cards */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              ⚙️
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Examination Meta & Security Parameters</h3>
              <p className="text-xs text-slate-500">Set the official collegiate exam header, timing, and security thresholds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                Official Exam Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Midterm Computer Science Assessment - Data Structures"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                Course Subject / Department Module
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. CSE 201 - Data Structures"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exam Duration (in Minutes)</span>
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                required
                min={1}
                max={360}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exam Active Start Time</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Exam Hard Submission Deadline</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2 p-5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 max-w-xl">
                <ShieldAlert className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-black text-amber-900 tracking-tight">Security Violation Auto-Disqualification Threshold</h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Specifies how many times a student can switch tabs, minimize the window, or breach security before their exam is
                    automatically locked and terminated.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-900">Allowed Breaches:</span>
                <input
                  type="number"
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={20}
                  className="w-20 px-3 py-2 bg-white border border-amber-300 rounded-xl font-black text-center text-sm text-slate-900 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Live Question Bank Live Editor Preview */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                📝
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Interactive Exam Preview & Answer Editor</h3>
                <p className="text-xs text-slate-500">
                  {questions.length === 0
                    ? 'Upload a .docx file or click Load Sample Questions above to populate.'
                    : `Showing ${questions.length} questions. You can fully customize questions, options, and select correct answers below.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addNewQuestion}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Question Manually</span>
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-semibold space-y-4">
              <p className="text-sm">No questions in your current preview bank.</p>
              <button
                type="button"
                onClick={loadDemoQuestions}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Populate with 4 Demo Computer Science MCQs
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id}
                  className="p-6 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-5 relative group"
                >
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      Question {qIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Remove this question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-600 mb-1">
                      Question {qIndex + 1} Heading
                    </label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                      required
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase text-slate-600">
                        Answer Options <span className="text-[10px] text-indigo-500 font-normal">(Select radio button for correct answer)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oIndex) => {
                        const isCorrect = q.correctOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${
                              isCorrect
                                ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-400/50 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_ans_${q.id}`}
                              id={`radio_${opt.id}`}
                              checked={isCorrect}
                              onChange={() => updateCorrectOption(qIndex, opt.id)}
                              className="w-4 h-4 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                            />
                            <div className="flex-1 flex items-center justify-between overflow-hidden">
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => updateOptionText(qIndex, oIndex, e.target.value)}
                                required
                                className={`w-full bg-transparent text-xs sm:text-sm font-bold focus:outline-none truncate ${
                                  isCorrect ? 'text-rose-950 font-black' : 'text-slate-800'
                                }`}
                              />
                              {isCorrect && (
                                <span className="ml-2 text-[10px] font-black uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md flex-shrink-0">
                                  Correct (Red)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Big Celebratory Publish Button */}
        <div className="pt-4 flex items-center justify-end space-x-4">
          <Link
            href="/faculty"
            className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold rounded-2xl text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPublishing || questions.length === 0}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black rounded-2xl text-base shadow-xl shadow-indigo-500/25 transition-all flex items-center space-x-3 cursor-pointer"
          >
            {isPublishing ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Publishing College Examination...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Publish Secure Examination</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Published Success Celebratory Modal */}
      {publishedQuiz && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 sm:p-10 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-xs rounded-full uppercase tracking-widest inline-block mb-2">
              Exam Published Successfully
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {publishedQuiz.title}
            </h2>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              Your highly secure collegiate examination is now live and waiting for student enrollments. You can share the link or
              QR code below.
            </p>

            {/* QR Code Projector box */}
            <div className="my-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Official Exam QR Code</span>
              </span>
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100 mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/attempt/${publishedQuiz.id}`}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <button
                onClick={() => {
                  const canvas = document.createElement('canvas');
                  const svg = document.querySelector('.bg-slate-50 svg') as SVGElement | null;
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
                      downloadLink.download = `${publishedQuiz.title.replace(/\s+/g, '_')}_QR.png`;
                      downloadLink.href = `${pngFile}`;
                      downloadLink.click();
                    }
                  };
                  img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable QR PNG</span>
              </button>
            </div>

            {/* Link Sharing Box */}
            <div className="mb-8">
              <label className="block text-left text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                Direct Student Entrance URL:
              </label>
              <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between gap-3 text-left border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-800 truncate select-all">
                  {examLink}
                </span>
                <button
                  onClick={copyPublishedLink}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center space-x-1 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/faculty"
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  setPublishedQuiz(null);
                  setQuestions([]);
                  setFile(null);
                  setParseSuccessMessage('');
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-2xl text-xs transition-colors"
              >
                Upload Another .docx Exam
              </button>
              <Link
                href={`/faculty/quiz/${publishedQuiz.id}/results`}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>View Live Evaluation Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
