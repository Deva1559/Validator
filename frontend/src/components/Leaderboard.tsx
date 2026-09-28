import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, AlertTriangle, XCircle, Eye, Search, Sliders, RefreshCw, X, Award, Check, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';

import { API_BASE_URL } from '../config';

export const Leaderboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [baselines, setBaselines] = useState<any>({
    accuracy: 85,
    macro_f1: 80,
    training_time: 60,
    time_comparison: 'lower'
  });
  const [loading, setLoading] = useState(true);
  const [reevaluating, setReevaluating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const [boardRes, baseRes] = await Promise.all([
        fetch(`${API_BASE_URL}/leaderboard`),
        fetch(`${API_BASE_URL}/baselines`)
      ]);
      const boardJson = await boardRes.json();
      const baseJson = await baseRes.json();
      setData(boardJson);
      if (baseJson) setBaselines(baseJson);
    } catch (error) {
      console.error("Failed to fetch leaderboard data:", error);
    } finally {
      setLoading(false);
      setReevaluating(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleReevaluate = async () => {
    setReevaluating(true);
    try {
      await fetch(`${API_BASE_URL}/baselines/re-evaluate`, { method: 'POST' });
      await fetchLeaderboard();
    } catch (e) {
      console.error("Re-evaluation error:", e);
      setReevaluating(false);
    }
  };

  const filteredData = data.filter(r => 
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Rankings & Audit
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Student Leaderboard</h1>
          <p className="text-slate-500 text-base font-medium">Deterministic class rankings evaluated strictly against baseline targets</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search student or notebook..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm text-sm"
            />
          </div>
          <button
            onClick={handleReevaluate}
            disabled={reevaluating}
            className="btn-3d-secondary px-4 py-2.5 flex items-center gap-2 text-xs font-bold whitespace-nowrap"
            title="Re-score and re-rank all projects against current baseline settings"
          >
            <RefreshCw className={`w-4 h-4 ${reevaluating ? 'animate-spin text-blue-600' : ''}`} />
            Re-evaluate
          </button>
        </div>
      </div>

      {/* Active Base Settings 3D Banner */}
      <div className="card-3d p-6 bg-gradient-to-r from-white via-blue-50/20 to-white">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 shadow-[0_6px_14px_rgba(37,99,235,0.3)] flex items-center justify-center text-white">
              <Sliders className="w-full h-full drop-shadow" />
            </div>
            <div>
              <h3 className="text-slate-900 font-extrabold text-base">Active Evaluation Thresholds</h3>
              <p className="text-slate-500 text-xs font-medium">All student metrics below are measured & scored relative to these faculty rules</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-700">
              <span className="text-slate-400 font-medium">Target Accuracy: </span>
              <span className="text-blue-600 font-bold font-mono">≥ {baselines.accuracy}%</span>
              <span className="text-slate-400 text-[11px] ml-1">(40% wt)</span>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-700">
              <span className="text-slate-400 font-medium">Target Macro F1: </span>
              <span className="text-blue-600 font-bold font-mono">≥ {baselines.macro_f1}%</span>
              <span className="text-slate-400 text-[11px] ml-1">(40% wt)</span>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm font-semibold text-slate-700">
              <span className="text-slate-400 font-medium">Target Time: </span>
              <span className="text-blue-600 font-bold font-mono">
                {baselines.time_comparison === 'lower' ? '≤' : '≥'} {baselines.training_time}s
              </span>
              <span className="text-slate-400 text-[11px] ml-1">(20% wt)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Elevated Leaderboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="p-4 pl-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student & Submission</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Accuracy <span className="text-blue-600 font-semibold">(Base: ≥{baselines.accuracy}%)</span>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Macro F1 <span className="text-blue-600 font-semibold">(Base: ≥{baselines.macro_f1}%)</span>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Time <span className="text-blue-600 font-semibold">(Base: ≤{baselines.training_time}s)</span>
                </th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Baseline Compliance</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deterministic Score</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                    <div className="font-semibold text-slate-600">Calculating Leaderboard Ranks...</div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400 font-medium">
                    No student submissions found matching your search.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    key={row.id || idx} 
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {/* 3D Rank Badges */}
                    <td className="p-4 pl-6">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                        row.rank === 1 ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-white shadow-[0_4px_12px_rgba(245,158,11,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]' : 
                        row.rank === 2 ? 'bg-gradient-to-tr from-slate-300 to-slate-400 text-white shadow-[0_4px_10px_rgba(148,163,184,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]' :
                        row.rank === 3 ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white shadow-[0_4px_10px_rgba(180,83,9,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]' : 
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {row.rank === 1 ? <Trophy className="w-4 h-4 text-white" /> : row.rank}
                      </div>
                    </td>

                    {/* Student Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{row.student_name}</p>
                        {row.roll_no && (
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono">
                            {row.roll_no}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate max-w-[210px] font-mono mt-0.5">
                        {row.dept && `${row.dept} - Sec ${row.sec || 'A'} • `}{row.filename}
                      </p>
                    </td>

                    {/* Accuracy vs Base */}
                    <td className="p-4">
                      {row.accuracy !== 'N/A' ? (
                        <div className="space-y-1">
                          <p className="text-sm font-extrabold text-slate-800">{row.accuracy}%</p>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                            row.passed_baselines?.accuracy 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {row.accuracy_delta >= 0 ? `+${row.accuracy_delta}%` : `${row.accuracy_delta}%`} vs base
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">NOT VERIFIED</span>
                      )}
                    </td>

                    {/* Macro F1 vs Base */}
                    <td className="p-4">
                      {row.macro_f1 !== 'N/A' ? (
                        <div className="space-y-1">
                          <p className="text-sm font-extrabold text-slate-800">{row.macro_f1}%</p>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                            row.passed_baselines?.macro_f1 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {row.macro_f1_delta >= 0 ? `+${row.macro_f1_delta}%` : `${row.macro_f1_delta}%`} vs base
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">NOT VERIFIED</span>
                      )}
                    </td>

                    {/* Training Time vs Base */}
                    <td className="p-4">
                      {row.training_time !== 'N/A' ? (
                        <div className="space-y-1">
                          <p className="text-sm font-extrabold text-slate-800">{row.training_time}s</p>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                            row.passed_baselines?.training_time 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {row.training_time_delta <= 0 ? `${Math.abs(row.training_time_delta)}s faster` : `+${row.training_time_delta}s slower`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">NOT VERIFIED</span>
                      )}
                    </td>

                    {/* Baseline Compliance (e.g. 3/3 Met) */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        row.baselines_passed_count === 3 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                          : row.baselines_passed_count > 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-xs'
                          : 'bg-rose-100 text-rose-800 border border-rose-200 shadow-xs'
                      }`}>
                        {row.baselines_passed_count === 3 ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {row.baselines_passed_count} / {row.total_baselines} Met
                      </span>
                    </td>

                    {/* Deterministic Score with Progress */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-2 well-3d overflow-hidden p-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${row.final_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : row.final_score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, row.final_score))}%` }}
                          />
                        </div>
                        <span className="text-sm font-extrabold text-slate-900">{row.final_score}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      {row.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Review
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => setSelectedEntry(row)} 
                        className="btn-3d-secondary px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Compare
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 3D Side-by-Side Comparison Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => setSelectedEntry(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/70">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_6px_14px_rgba(37,99,235,0.3)] flex items-center justify-center text-white font-extrabold text-xl">
                    #{selectedEntry.rank}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{selectedEntry.student_name}</h2>
                    <p className="text-sm text-slate-400 font-mono mt-0.5">{selectedEntry.filename}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEntry(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* 3D Score & Compliance Banner */}
                <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 shadow-sm">
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Deterministic AI Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{selectedEntry.final_score}</span>
                      <span className="text-slate-400 text-sm font-semibold">/ 100</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Baseline Compliance</p>
                    <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase shadow-xs ${
                      selectedEntry.baselines_passed_count === 3 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {selectedEntry.baselines_passed_count} of 3 Baselines Met ({selectedEntry.status})
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Comparison Table */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Metric Comparison Against Base Settings
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                        <tr>
                          <th className="p-3.5">Metric</th>
                          <th className="p-3.5">Base Setting</th>
                          <th className="p-3.5">Student Result</th>
                          <th className="p-3.5">Delta</th>
                          <th className="p-3.5 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Accuracy */}
                        <tr>
                          <td className="p-3.5 font-bold text-slate-900">Accuracy (40% wt)</td>
                          <td className="p-3.5 text-slate-600 font-mono">≥ {selectedEntry.accuracy_target}%</td>
                          <td className="p-3.5 font-mono text-slate-900 font-bold">{selectedEntry.accuracy !== 'N/A' ? `${selectedEntry.accuracy}%` : 'NOT VERIFIED'}</td>
                          <td className="p-3.5 font-mono text-xs">
                            {selectedEntry.accuracy_delta !== null ? (
                              <span className={`font-bold ${selectedEntry.passed_baselines?.accuracy ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedEntry.accuracy_delta >= 0 ? `+${selectedEntry.accuracy_delta}%` : `${selectedEntry.accuracy_delta}%`}
                              </span>
                            ) : <span className="text-slate-400">N/A</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            {selectedEntry.passed_baselines?.accuracy ? (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">Passed</span>
                            ) : (
                              <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-bold">Failed</span>
                            )}
                          </td>
                        </tr>

                        {/* Macro F1 */}
                        <tr>
                          <td className="p-3.5 font-bold text-slate-900">Macro F1 (40% wt)</td>
                          <td className="p-3.5 text-slate-600 font-mono">≥ {selectedEntry.macro_f1_target}%</td>
                          <td className="p-3.5 font-mono text-slate-900 font-bold">{selectedEntry.macro_f1 !== 'N/A' ? `${selectedEntry.macro_f1}%` : 'NOT VERIFIED'}</td>
                          <td className="p-3.5 font-mono text-xs">
                            {selectedEntry.macro_f1_delta !== null ? (
                              <span className={`font-bold ${selectedEntry.passed_baselines?.macro_f1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedEntry.macro_f1_delta >= 0 ? `+${selectedEntry.macro_f1_delta}%` : `${selectedEntry.macro_f1_delta}%`}
                              </span>
                            ) : <span className="text-slate-400">N/A</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            {selectedEntry.passed_baselines?.macro_f1 ? (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">Passed</span>
                            ) : (
                              <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-bold">Failed</span>
                            )}
                          </td>
                        </tr>

                        {/* Training Time */}
                        <tr>
                          <td className="p-3.5 font-bold text-slate-900">Training Time (20% wt)</td>
                          <td className="p-3.5 text-slate-600 font-mono">
                            {selectedEntry.time_comparison === 'lower' ? '≤' : '≥'} {selectedEntry.training_time_target}s
                          </td>
                          <td className="p-3.5 font-mono text-slate-900 font-bold">{selectedEntry.training_time !== 'N/A' ? `${selectedEntry.training_time}s` : 'NOT VERIFIED'}</td>
                          <td className="p-3.5 font-mono text-xs">
                            {selectedEntry.training_time_delta !== null ? (
                              <span className={`font-bold ${selectedEntry.passed_baselines?.training_time ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {selectedEntry.training_time_delta <= 0 ? `${Math.abs(selectedEntry.training_time_delta)}s faster` : `+${selectedEntry.training_time_delta}s slower`}
                              </span>
                            ) : <span className="text-slate-400">N/A</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            {selectedEntry.passed_baselines?.training_time ? (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-bold">Passed</span>
                            ) : (
                              <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 font-bold">Failed</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Findings */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" /> AI Findings & Baseline Notes
                  </h4>
                  <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-200 shadow-inner">
                    {selectedEntry.ai_feedback || "No findings recorded."}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedEntry(null)} 
                  className="btn-3d-secondary px-6 py-2 text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
