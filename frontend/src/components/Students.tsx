import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, AlertTriangle, FileCode, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'REVIEW REQUIRED'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/leaderboard`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(search.toLowerCase()) ||
                          s.filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Student Directory
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Student Submissions</h1>
          <p className="text-slate-500 text-base font-medium">Interactive portfolio of student ML pipelines, extracted metrics & status</p>
        </div>

        {/* 3D Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm text-sm"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner text-xs font-bold">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-white text-blue-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All ({students.length})
            </button>
            <button 
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'VERIFIED' ? 'bg-white text-emerald-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Passed
            </button>
            <button 
              onClick={() => setStatusFilter('REVIEW REQUIRED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'REVIEW REQUIRED' ? 'bg-white text-amber-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Review
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="text-center text-slate-400 py-16 card-3d">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <div className="font-semibold text-slate-600">Loading student directory...</div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center text-slate-400 py-16 card-3d font-medium">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((s, i) => (
              <motion.div 
                key={s.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedStudent(s)}
                className="card-3d p-6 cursor-pointer flex flex-col justify-between group hover:border-blue-400"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-[0_4px_12px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform">
                        {s.student_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-extrabold text-base group-hover:text-blue-600 transition-colors">{s.student_name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[170px] font-mono mt-0.5">
                          <FileCode className="w-3.5 h-3.5 text-slate-400" /> {s.filename}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full font-mono font-bold shadow-xs">
                      Rank #{s.rank}
                    </span>
                  </div>

                  {/* 3D Metrics Wells */}
                  <div className="grid grid-cols-3 gap-2.5 my-4">
                    <div className="well-3d p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Accuracy</p>
                      <p className={`text-xs font-extrabold ${s.passed_baselines?.accuracy ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {s.accuracy !== 'N/A' ? `${s.accuracy}%` : 'N/A'}
                      </p>
                    </div>

                    <div className="well-3d p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Macro F1</p>
                      <p className={`text-xs font-extrabold ${s.passed_baselines?.macro_f1 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {s.macro_f1 !== 'N/A' ? `${s.macro_f1}%` : 'N/A'}
                      </p>
                    </div>

                    <div className="well-3d p-2.5 text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Time</p>
                      <p className={`text-xs font-extrabold ${s.passed_baselines?.training_time ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {s.training_time !== 'N/A' ? `${s.training_time}s` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-semibold">AI Score:</span>
                    <span className="font-black text-slate-900 text-base">{s.final_score}</span>
                    <span className="text-[11px] text-slate-400">/ 100</span>
                  </div>

                  {s.status === 'VERIFIED' ? (
                    <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Review
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 3D Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden z-10"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                    #{selectedStudent.rank}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{selectedStudent.student_name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedStudent.filename}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 shadow-sm">
                  <div>
                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Deterministic AI Score</p>
                    <p className="text-3xl font-black text-slate-900">{selectedStudent.final_score} <span className="text-sm font-semibold text-slate-400">/ 100</span></p>
                  </div>
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase shadow-xs ${
                    selectedStudent.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedStudent.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Accuracy</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">{selectedStudent.accuracy !== 'N/A' ? `${selectedStudent.accuracy}%` : 'N/A'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{selectedStudent.passed_baselines?.accuracy ? '✓ Baseline Met' : '✗ Unmet'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Macro F1</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">{selectedStudent.macro_f1 !== 'N/A' ? `${selectedStudent.macro_f1}%` : 'N/A'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{selectedStudent.passed_baselines?.macro_f1 ? '✓ Baseline Met' : '✗ Unmet'}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Time</p>
                    <p className="text-base font-extrabold text-slate-900 mt-1">{selectedStudent.training_time !== 'N/A' ? `${selectedStudent.training_time}s` : 'N/A'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">{selectedStudent.passed_baselines?.training_time ? '✓ Baseline Met' : '✗ Unmet'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Automated Audit Findings</p>
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-200 shadow-inner">
                    {selectedStudent.ai_feedback || "No findings recorded."}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="btn-3d-secondary px-5 py-2 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
