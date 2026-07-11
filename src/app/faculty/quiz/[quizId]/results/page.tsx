'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  Download,
  FileSpreadsheet,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ShieldAlert,
  ArrowLeft,
  Filter,
  RefreshCw,
  Printer,
  Sparkles,
  Building,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ViolationEntry {
  timestamp: string;
  type: string;
  description: string;
}

interface AttemptRecord {
  id: string;
  studentName: string;
  registerNumber: string;
  department: string;
  year: string;
  section: string;
  startTime: string;
  completedAt: string | null;
  isSubmitted: boolean;
  answers: Record<string, string>;
  marks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  timeTakenSeconds: number;
  status: string;
  violationCount: number;
  violationsLog: ViolationEntry[];
  autoSubmitReason?: string | null;
  createdAt: string;
}

interface QuizData {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  maxViolations: number;
  questions: { id: string; question: string; options: { id: string; text: string }[]; correctOptionId: string }[];
}

export default function ResultsPortalPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [results, setResults] = useState<AttemptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Detailed view modal state
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptRecord | null>(null);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizId}/results`);
      const data = await res.json();
      if (res.ok && data) {
        if (data.quiz) setQuiz(data.quiz);
        if (data.results) setResults(data.results);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchResults();
    }
  }, [quizId]);

  // Derived filter options
  const departments = ['ALL', ...Array.from(new Set(results.map((r) => r.department)))];
  const years = ['ALL', ...Array.from(new Set(results.map((r) => r.year)))];

  const filteredResults = results.filter((record) => {
    // Search by name, register number
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || record.department === selectedDept;
    const matchesYear = selectedYear === 'ALL' || record.year === selectedYear;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' && record.isSubmitted) ||
      (selectedStatus === 'IN_PROGRESS' && !record.isSubmitted) ||
      (selectedStatus === 'TERMINATED' && record.status === 'terminated');

    return matchesSearch && matchesDept && matchesYear && matchesStatus;
  });

  // Analytics Metrics
  const completedAttempts = results.filter((r) => r.isSubmitted);
  const avgMarks =
    completedAttempts.length > 0 ? Math.round(completedAttempts.reduce((acc, r) => acc + r.marks, 0) / completedAttempts.length) : 0;
  const avgPercentage =
    completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((acc, r) => acc + r.percentage, 0) / completedAttempts.length)
      : 0;
  const totalViolations = results.reduce((acc, r) => acc + r.violationCount, 0);

  // Helper formats
  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Export to Excel (.xlsx) using ExcelJS / XLSX
  const exportToExcel = () => {
    if (!quiz) return;

    const dataRows = filteredResults.map((r, i) => ({
      'S.No': i + 1,
      'Student Name': r.studentName,
      'Register Number': r.registerNumber,
      Department: r.department,
      Year: r.year,
      Section: r.section,
      Marks: r.marks,
      Percentage: `${r.percentage}%`,
      'Correct Answers': r.correctCount,
      'Wrong Answers': r.wrongCount,
      'Time Taken': formatSeconds(r.timeTakenSeconds),
      'Submission Time': r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress',
      'Security Violations': r.violationCount,
      'Evaluation Status': r.status.toUpperCase(),
      'Termination Reason': r.autoSubmitReason || 'None',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collegiate Exam Results');

    XLSX.writeFile(workbook, `${quiz.title.replace(/\s+/g, '_')}_Results.xlsx`);
  };

  // Export CSV
  const exportToCSV = () => {
    if (!quiz) return;

    const headers = [
      'Student Name',
      'Register Number',
      'Department',
      'Year',
      'Section',
      'Marks',
      'Percentage',
      'Correct Answers',
      'Wrong Answers',
      'Time Taken',
      'Submission Time',
      'Security Violations',
      'Status',
    ];

    const rows = filteredResults.map((r) => [
      `"${r.studentName}"`,
      `"${r.registerNumber}"`,
      `"${r.department}"`,
      `"${r.year}"`,
      `"${r.section}"`,
      r.marks,
      `${r.percentage}%`,
      r.correctCount,
      r.wrongCount,
      `"${formatSeconds(r.timeTakenSeconds)}"`,
      `"${r.completedAt ? new Date(r.completedAt).toLocaleString() : 'In Progress'}"`,
      r.violationCount,
      `"${r.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${quiz.title.replace(/\s+/g, '_')}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/faculty" className="text-xs font-extrabold text-indigo-600 hover:underline flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Faculty Dashboard</span>
        </Link>
        <button
          onClick={fetchResults}
          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          title="Refresh validation records"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Refresh Results</span>
        </button>
      </div>

      {/* Quiz Header summary */}
      {quiz && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-100">
              {quiz.subject}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{quiz.title}</h1>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-4 font-medium">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Duration: {quiz.durationMinutes} Minutes</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>End Date: {new Date(quiz.endTime).toLocaleString()}</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Max Breaches: {quiz.maxViolations} Allowed</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportToExcel}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export All to Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs transition-colors flex items-center space-x-2 shadow-sm"
              title="Print Collegiate Summary Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Submissions</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{results.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            🎓
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average College Marks</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {avgMarks} <span className="text-xs font-bold text-slate-400">/ {quiz?.questions.length || 0}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            📊
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">College Pass Percentage</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">{avgPercentage}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg">
            ✨
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Trapped Breaches</span>
            <p className="text-3xl font-black text-rose-600 mt-1">{totalViolations}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or reg no..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-500 uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Year: {y}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="ALL">Status: ALL</option>
            <option value="COMPLETED">Status: COMPLETED</option>
            <option value="IN_PROGRESS">Status: IN PROGRESS</option>
            <option value="TERMINATED">Status: TERMINATED (VIOLATIONS)</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 font-semibold flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Evaluating student answer papers...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-16 text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold text-xl">
              📂
            </div>
            <h3 className="text-lg font-bold text-slate-900">No matching student attempts found</h3>
            <p className="text-xs text-slate-500">Try modifying your search or filter options above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Student Info</th>
                  <th className="py-4 px-6">Dept & Class</th>
                  <th className="py-4 px-6 text-center">Marks</th>
                  <th className="py-4 px-6 text-center">Percentage</th>
                  <th className="py-4 px-6 text-center">Security Traps</th>
                  <th className="py-4 px-6">Evaluation Time</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResults.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center flex-shrink-0 text-sm">
                          {record.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{record.studentName}</p>
                          <p className="font-mono text-[11px] text-slate-500 font-bold">Reg: {record.registerNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 flex items-center space-x-1">
                        <Building className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{record.department}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {record.year} • Sec {record.section}
                      </p>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-900 text-sm">
                        {record.marks} <span className="text-xs text-slate-400 font-medium">/ {quiz?.questions.length || 0}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl font-extrabold ${
                          record.percentage >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.percentage >= 50
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.percentage}%
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {record.violationCount === 0 ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>0 Traps</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 font-bold rounded-full cursor-pointer ${
                            record.status === 'terminated'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                          onClick={() => setSelectedAttempt(record)}
                          title="Click to view full Security Violations audit log"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>{record.violationCount} Violations</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono text-[11px]">
                      <p className="text-slate-800 font-semibold">{formatSeconds(record.timeTakenSeconds)}</p>
                      <p className="text-slate-400">{record.completedAt ? new Date(record.completedAt).toLocaleTimeString() : 'Active'}</p>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-xl font-bold uppercase text-[10px] tracking-wider ${
                          record.status === 'terminated'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-black'
                            : record.isSubmitted
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {record.status === 'terminated' ? 'Terminated' : record.isSubmitted ? 'Evaluated' : 'In Progress'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedAttempt(record)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-extrabold rounded-xl transition-colors inline-flex items-center space-x-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Student Results & Security Audit Report Modal View */}
      {selectedAttempt && quiz && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 p-8 sm:p-10 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setSelectedAttempt(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 w-10 h-10 rounded-full hover:bg-slate-100 font-extrabold flex items-center justify-center text-lg z-10"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-md shadow-indigo-200">
                  {selectedAttempt.studentName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black text-slate-900">{selectedAttempt.studentName}</h2>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded-md">
                      Reg: {selectedAttempt.registerNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {selectedAttempt.department} • {selectedAttempt.year} ({selectedAttempt.section})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
                <div className="text-center pr-4 border-r border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Score</span>
                  <span className="text-xl font-black text-slate-900">
                    {selectedAttempt.marks} <span className="text-xs text-slate-400">/ {quiz.questions.length}</span>
                  </span>
                </div>
                <div className="text-center pr-4 border-r border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Percentage</span>
                  <span className="text-xl font-black text-indigo-600">{selectedAttempt.percentage}%</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Security</span>
                  <span className={`text-xl font-black ${selectedAttempt.violationCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedAttempt.violationCount} Traps
                  </span>
                </div>
              </div>
            </div>

            {/* Security Breach Audit Panel */}
            <div className="mb-10">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Timestamped Browser Security Traps Log</h3>
              </div>

              {selectedAttempt.violationsLog.length === 0 ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-extrabold flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Impeccable Exam Code. Zero unauthorized tab switches, devtools, or focus losses recorded.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAttempt.autoSubmitReason && (
                    <div className="p-4 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-md">
                      ⚠️ EXAM TERMINATION REASON: {selectedAttempt.autoSubmitReason}
                    </div>
                  )}

                  <div className="border border-rose-200 bg-rose-50/50 rounded-2xl overflow-hidden divide-y divide-rose-100 text-xs">
                    {selectedAttempt.violationsLog.map((v, idx) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start space-x-3">
                          <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold uppercase tracking-wider text-rose-950 block">
                              Trap Action: {v.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-700 font-medium">{v.description}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                          {new Date(v.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed MCQ Responses Paper Evaluation */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Evaluated Answer Paper</h3>
                <span className="text-xs text-slate-400 font-semibold">(Extracted vs Studied responses)</span>
              </div>

              <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
                {quiz.questions.map((q, idx) => {
                  const studentAnswerId = selectedAttempt.answers[q.id];
                  const isCorrect = studentAnswerId === q.correctOptionId;

                  const correctOption = q.options.find((o) => o.id === q.correctOptionId);
                  const studentOption = q.options.find((o) => o.id === studentAnswerId);

                  return (
                    <div
                      key={q.id}
                      className={`p-6 rounded-3xl border ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                          : 'bg-rose-50/40 border-rose-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 pt-1 tracking-tight">{q.question}</h4>
                        </div>
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>1 / 1 Mark</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-xs font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-xl">
                              <XCircle className="w-4 h-4" />
                              <span>0 / 1 Mark</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10 text-xs">
                        {q.options.map((opt) => {
                          const isThisCorrect = opt.id === q.correctOptionId;
                          const isThisStudent = opt.id === studentAnswerId;

                          let badgeStyle = 'bg-white border-slate-200 text-slate-700';
                          if (isThisCorrect && isThisStudent) {
                            badgeStyle = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black ring-2 ring-emerald-400/40';
                          } else if (isThisCorrect) {
                            badgeStyle = 'bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold';
                          } else if (isThisStudent) {
                            badgeStyle = 'bg-rose-100 border-rose-400 text-rose-950 font-black ring-2 ring-rose-400/40';
                          }

                          return (
                            <div key={opt.id} className={`p-3 rounded-2xl border flex items-center justify-between ${badgeStyle}`}>
                              <span className="font-bold truncate">{opt.text}</span>
                              <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2 text-[10px] uppercase font-black">
                                {isThisCorrect && <span className="text-emerald-700">✓ Key</span>}
                                {isThisStudent && <span className={isThisCorrect ? 'text-emerald-800' : 'text-rose-700'}>• Student</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explicit comparison footer if wrong */}
                      {!isCorrect && (
                        <div className="mt-4 pl-10 text-xs font-medium text-slate-600 bg-white/60 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                          <div>
                            <span className="font-black text-slate-900 block">Student Selected:</span>
                            <span className="text-rose-700 font-bold">{studentOption?.text || 'Skipped / Unanswered'}</span>
                          </div>
                          <div>
                            <span className="font-black text-slate-900 block">Correct Answer Key (Red DOCX):</span>
                            <span className="text-emerald-700 font-bold">{correctOption?.text || 'None'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-6 py-3.5 bg-slate-900 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-colors"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
