import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { CheckCircle2, Target, TrendingUp, Users, RefreshCw, BarChart3, Sliders, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card-3d p-6 relative overflow-hidden group hover:border-blue-300"
  >
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
      </div>
      <div className={`w-14 h-14 rounded-2xl ${color} shadow-[0_8px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
        <Icon className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
      </div>
    </div>
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
  </motion.div>
);

import { API_BASE_URL } from '../config';

export const Dashboard = ({ setActiveTab }: { setActiveTab?: (tab: string) => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartView, setChartView] = useState<'BASELINE' | 'TIERS' | 'STUDENTS'>('BASELINE');

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!stats) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 shadow-[0_8px_20px_rgba(37,99,235,0.35)] animate-bounce flex items-center justify-center text-white">
        <Zap className="w-6 h-6" />
      </div>
      <div className="text-slate-600 font-bold text-lg">Initializing 3D Analytics...</div>
    </div>
  );

  const targetAcc = stats.baselines?.accuracy || 85;
  const targetF1 = stats.baselines?.macro_f1 || 80;
  const targetTime = stats.baselines?.training_time || 60;
  
  const accProgress = Math.min(100, (stats.avg_accuracy / targetAcc) * 100);
  const f1Progress = Math.min(100, (stats.avg_macro_f1 / targetF1) * 100);
  const timeProgress = stats.avg_training_time > 0 ? Math.min(100, (targetTime / stats.avg_training_time) * 100) : 100;

  let activeChartData: any[] = [];
  if (chartView === 'BASELINE') {
    activeChartData = stats.accuracy_distribution || [];
  } else if (chartView === 'TIERS') {
    activeChartData = stats.range_distribution || [];
  } else {
    activeChartData = (stats.student_accuracies || []).map((s: any) => ({
      name: s.name.length > 12 ? s.name.slice(0, 10) + '..' : s.name,
      accuracy: s.accuracy,
      fill: !s.is_verified ? '#94A3B8' : s.meets_target ? '#10B981' : '#F59E0B'
    }));
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Live Overview
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Evaluation Dashboard</h1>
          <p className="text-slate-500 text-base font-medium">Holistic batch analytics and deterministic baseline auditing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStats}
            disabled={refreshing}
            className="btn-3d-secondary px-4 py-2.5 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Sync Metrics
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('Upload Projects')}
            className="btn-3d px-5 py-2.5 flex items-center gap-2 text-xs font-bold tracking-wide"
          >
            <Zap className="w-4 h-4" />
            New Validation Batch
          </button>
        </div>
      </div>

      {/* 3D Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Submissions" value={stats.total_students} icon={Users} color="bg-gradient-to-tr from-blue-600 to-indigo-600" delay={0.05} />
        <StatCard title="Baseline Pass Rate" value={`${stats.validation_success_rate}%`} icon={CheckCircle2} color="bg-gradient-to-tr from-emerald-500 to-teal-600" delay={0.1} />
        <StatCard title="Average Accuracy" value={`${stats.avg_accuracy}%`} icon={Target} color="bg-gradient-to-tr from-violet-600 to-purple-600" delay={0.15} />
        <StatCard title="Average Macro F1" value={`${stats.avg_macro_f1}%`} icon={TrendingUp} color="bg-gradient-to-tr from-amber-500 to-orange-600" delay={0.2} />
      </div>

      {/* Main 3D Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dynamic Accuracy Distribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-3d p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Accuracy Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Dynamic benchmark against Target: <span className="text-blue-600 font-bold">≥ {targetAcc}%</span>
                </p>
              </div>

              {/* View Switcher Pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner text-xs font-bold">
                <button
                  onClick={() => setChartView('BASELINE')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartView === 'BASELINE' ? 'bg-white text-blue-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Baseline
                </button>
                <button
                  onClick={() => setChartView('TIERS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartView === 'TIERS' ? 'bg-white text-blue-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Ranges
                </button>
                <button
                  onClick={() => setChartView('STUDENTS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${chartView === 'STUDENTS' ? 'bg-white text-blue-600 shadow-[0_2px_4px_rgba(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Students
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" key={`chart-white-${chartView}-${targetAcc}`}>
                {chartView === 'STUDENTS' ? (
                  <BarChart data={activeChartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                    <YAxis stroke="#94A3B8" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`${val}%`, 'Accuracy']}
                    />
                    <ReferenceLine y={targetAcc} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" label={{ value: `Target: ${targetAcc}%`, fill: '#D97706', fontSize: 11, fontWeight: 700, position: 'top' }} />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                      {activeChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-student-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={activeChartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                    <YAxis stroke="#94A3B8" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(val: any) => [`${val} Students`, 'Count']}
                    />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                      {activeChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#3B82F6'} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3D Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 mt-2 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Target Met</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span> Below Target</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm"></span> Unverified / 0%</span>
            </div>
            <button 
              onClick={() => setActiveTab && setActiveTab('Baselines')} 
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              Adjust Base Setting <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* 3D Baseline Comparison Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-3d p-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Cohort Baseline Comparison
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Progress of entire class relative to faculty criteria</p>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                Cohort Averages
              </span>
            </div>

            <div className="space-y-6">
              {/* Accuracy Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2 font-semibold">
                  <span className="text-slate-600">Accuracy (Target: ≥ {targetAcc}%)</span>
                  <span className={`font-mono ${stats.avg_accuracy >= targetAcc ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    {stats.avg_accuracy}%
                  </span>
                </div>
                <div className="well-3d h-3 p-0.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-md shadow-sm transition-all duration-700 ${stats.avg_accuracy >= targetAcc ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, accProgress))}%` }}
                  ></div>
                </div>
              </div>

              {/* Macro F1 Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2 font-semibold">
                  <span className="text-slate-600">Macro F1 (Target: ≥ {targetF1}%)</span>
                  <span className={`font-mono ${stats.avg_macro_f1 >= targetF1 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    {stats.avg_macro_f1}%
                  </span>
                </div>
                <div className="well-3d h-3 p-0.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-md shadow-sm transition-all duration-700 ${stats.avg_macro_f1 >= targetF1 ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, f1Progress))}%` }}
                  ></div>
                </div>
              </div>

              {/* Training Time Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2 font-semibold">
                  <span className="text-slate-600">Training Time (Target: ≤ {targetTime}s)</span>
                  <span className={`font-mono ${stats.avg_training_time <= targetTime ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    {stats.avg_training_time}s
                  </span>
                </div>
                <div className="well-3d h-3 p-0.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-md shadow-sm transition-all duration-700 ${stats.avg_training_time <= targetTime ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} 
                    style={{ width: `${Math.min(100, Math.max(0, timeProgress))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 mt-6 font-medium">
            <span>Cohort Passing Ratio: <strong className="text-slate-900 font-bold">{stats.validation_success_rate}%</strong></span>
            <button 
              onClick={() => setActiveTab && setActiveTab('Leaderboard')} 
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              Open Full Leaderboard <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
