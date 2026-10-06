import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, Eye, Search, Sliders, RefreshCw, X, Check, 
  ShieldCheck, FileText, Award, Sparkles, Filter, ChevronRight, BarChart3, 
  Info, HelpCircle, Layers, Activity, Brain, Flame, Lock, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { API_BASE_URL } from '../config';

// Tab configuration for Two-Level Leaderboard
const USE_CASE_TABS = [
  { id: 'OVERALL', name: '🏆 Overall Leaderboard', shortName: 'Overall', icon: '🏆', domain: 'All 7 Use Cases' },
  { id: 'Traffic Sign Recognition', name: '🚦 Traffic Signs', shortName: 'GTSRB', icon: '🚦', domain: 'Multi-Class Vision', taskType: 'IMAGE_CLASSIFICATION' },
  { id: 'Crop Leaf Disease Classification', name: '🌱 Plant Disease', shortName: 'PlantVillage', icon: '🌱', domain: 'Botanical Pathology', taskType: 'IMAGE_CLASSIFICATION' },
  { id: 'Face Mask Detection', name: '😷 Face Mask', shortName: 'Face Mask', icon: '😷', domain: 'Object Detection', taskType: 'OBJECT_DETECTION' },
  { id: 'Pet Image Segmentation', name: '🐕 Pet Segmentation', shortName: 'Oxford Pet', icon: '🐕', domain: 'Semantic Segmentation', taskType: 'IMAGE_SEGMENTATION' },
  { id: 'Image Generation with GANs', name: '🎨 GAN Synthesis', shortName: 'GAN', icon: '🎨', domain: 'Generative AI', taskType: 'IMAGE_GENERATION' },
  { id: 'Image Captioning', name: '🖼️ Image Captioning', shortName: 'Flickr8k', icon: '🖼️', domain: 'Multimodal Vision-Language', taskType: 'IMAGE_CAPTIONING' },
  { id: 'Pneumonia Detection from Chest X-Rays', name: '🫁 Pneumonia X-Ray', shortName: 'Pneumonia', icon: '🫁', domain: 'Clinical Diagnostics', taskType: 'BINARY_CLASSIFICATION' },
];

const THEME_COLORS: Record<string, { badge: string; text: string; bg: string; border: string }> = {
  'Traffic Sign Recognition': { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200' },
  'Crop Leaf Disease Classification': { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', bg: 'bg-emerald-500', border: 'border-emerald-200' },
  'Face Mask Detection': { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-200' },
  'Pet Image Segmentation': { badge: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-600', bg: 'bg-purple-500', border: 'border-purple-200' },
  'Image Generation with GANs': { badge: 'bg-pink-50 text-pink-700 border-pink-200', text: 'text-pink-600', bg: 'bg-pink-500', border: 'border-pink-200' },
  'Image Captioning': { badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', text: 'text-cyan-600', bg: 'bg-cyan-500', border: 'border-cyan-200' },
  'Pneumonia Detection from Chest X-Rays': { badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-600', bg: 'bg-rose-500', border: 'border-rose-200' },
  'OVERALL': { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-600', bg: 'bg-indigo-500', border: 'border-indigo-200' }
};

export const Leaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('OVERALL');
  const [data, setData] = useState<any[]>([]);
  const [useCaseSummaries, setUseCaseSummaries] = useState<any[]>([]);
  const [scoringConfig, setScoringConfig] = useState<any>({
    baseline_weight: 60,
    relative_weight: 25,
    validation_weight: 15,
    missing_metric_policy: 'RENORMALIZE',
    min_cohort_normal: 15,
    min_cohort_limited: 8
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('overall_score');
  
  // Modals
  const [selectedStudentRoll, setSelectedStudentRoll] = useState<string | null>(null);
  const [studentBreakdown, setStudentBreakdown] = useState<any | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  
  // Faculty Config Form State
  const [configForm, setConfigForm] = useState<any>({
    baseline_weight: 60,
    relative_weight: 25,
    validation_weight: 15,
    missing_metric_policy: 'RENORMALIZE'
  });
  const [configError, setConfigError] = useState<string | null>(null);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [boardRes, ucRes, cfgRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/leaderboard/overall`),
        fetch(`${API_BASE_URL}/api/leaderboard/use-cases`),
        fetch(`${API_BASE_URL}/api/scoring/config`)
      ]);
      
      const boardJson = await boardRes.json();
      const ucJson = await ucRes.json();
      const cfgJson = await cfgRes.json();
      
      setData(Array.isArray(boardJson) ? boardJson : []);
      setUseCaseSummaries(Array.isArray(ucJson) ? ucJson : []);
      if (cfgJson && cfgJson.baseline_weight) {
        setScoringConfig(cfgJson);
        setConfigForm({
          baseline_weight: cfgJson.baseline_weight,
          relative_weight: cfgJson.relative_weight,
          validation_weight: cfgJson.validation_weight,
          missing_metric_policy: cfgJson.missing_metric_policy || 'RENORMALIZE'
        });
      }
    } catch (error) {
      console.error("Failed to load leaderboard data:", error);
    } finally {
      setLoading(false);
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetch(`${API_BASE_URL}/api/leaderboard/recalculate`, { method: 'POST' });
      await fetchAllData();
    } catch (e) {
      console.error("Recalculation error:", e);
      setRecalculating(false);
    }
  };

  const openStudentBreakdown = async (rollNo: string) => {
    setSelectedStudentRoll(rollNo);
    setLoadingBreakdown(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/students/${encodeURIComponent(rollNo)}/score-breakdown`);
      if (res.ok) {
        const json = await res.json();
        setStudentBreakdown(json);
      } else {
        setStudentBreakdown(null);
      }
    } catch (e) {
      console.error("Failed to fetch breakdown:", e);
      setStudentBreakdown(null);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const sum = Number(configForm.baseline_weight) + Number(configForm.relative_weight) + Number(configForm.validation_weight);
    if (Math.abs(sum - 100) > 0.01) {
      setConfigError(`Weights must sum to exactly 100%. Current sum: ${sum}%`);
      return;
    }
    setConfigError(null);
    setSavingConfig(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/scoring/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      if (res.ok) {
        setShowConfigModal(false);
        await fetchAllData();
      } else {
        const errJson = await res.json();
        setConfigError(errJson.detail || "Failed to update configuration");
      }
    } catch (e: any) {
      setConfigError(e.message || "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  // Ensure strictly one record per student (latest upload) on the leaderboard
  const dedupedData = useMemo(() => {
    const studentMap = new Map<string, any>();
    data.forEach(item => {
      const key = (item.roll_no || item.student_name || `id_${item.id}`).trim().toUpperCase();
      const existing = studentMap.get(key);
      if (!existing || (item.run_id || item.id || 0) > (existing.run_id || existing.id || 0)) {
        studentMap.set(key, item);
      }
    });
    return Array.from(studentMap.values());
  }, [data]);

  // Filter and sort items based on activeTab, search, statusFilter, sortBy
  const displayedStudents = useMemo(() => {
    return dedupedData.filter(s => {
      // Tab filter
      const matchesTab = activeTab === 'OVERALL' || s.use_case === activeTab;
      
      // Search filter
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        (s.student_name && s.student_name.toLowerCase().includes(q)) ||
        (s.roll_no && s.roll_no.toLowerCase().includes(q)) ||
        (s.filename && s.filename.toLowerCase().includes(q));
        
      // Status filter
      const matchesStatus = statusFilter === 'ALL' || s.validation_status === statusFilter;
      
      return matchesTab && matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (activeTab !== 'OVERALL') {
        // Within task tab, primary sort by rank_in_cohort
        return (a.rank_in_cohort || 999) - (b.rank_in_cohort || 999);
      }
      if (sortBy === 'overall_score') return (b.overall_score || 0) - (a.overall_score || 0);
      if (sortBy === 'task_score') return (b.task_score || 0) - (a.task_score || 0);
      if (sortBy === 'baseline_score') return (b.baseline_score || 0) - (a.baseline_score || 0);
      if (sortBy === 'validation_score') return (b.validation_score || 0) - (a.validation_score || 0);
      if (sortBy === 'rank') return (a.overall_rank || 999) - (b.overall_rank || 999);
      return (b.overall_score || 0) - (a.overall_score || 0);
    });
  }, [dedupedData, activeTab, search, statusFilter, sortBy]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const total = dedupedData.length;
    const avgScore = total ? (dedupedData.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / total).toFixed(1) : '0';
    const topScore = total ? Math.max(...dedupedData.map(d => d.overall_score || 0)).toFixed(1) : '0';
    const verifiedCount = dedupedData.filter(d => d.validation_status === 'VERIFIED').length;
    const reviewRequiredCount = dedupedData.filter(d => d.validation_status === 'REVIEW REQUIRED' || d.validation_status === 'PARTIALLY VERIFIED').length;
    return { total, avgScore, topScore, verifiedCount, reviewRequiredCount };
  }, [dedupedData]);

  // Current active tab object
  const currentTabObj = USE_CASE_TABS.find(t => t.id === activeTab) || USE_CASE_TABS[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              Task-Aware Deterministic Evaluation
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              130 Students Cohort
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">ML Leaderboard & Audit</h1>
          <p className="text-slate-500 text-base font-medium">
            Fair cross-task normalized rankings across 7 distinct machine learning domains
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="btn-3d-secondary px-4 py-2.5 flex items-center gap-2 text-xs font-bold whitespace-nowrap shadow-sm"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Scoring Policy ({scoringConfig.baseline_weight}/{scoringConfig.relative_weight}/{scoringConfig.validation_weight})
          </button>
          
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="btn-3d px-4 py-2.5 flex items-center gap-2 text-xs font-bold whitespace-nowrap bg-indigo-600 text-white shadow-sm"
            title="Recalculate deterministically for all 130 students"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Recalculating...' : 'Recalculate Ranks'}
          </button>
        </div>
      </div>

      {/* Methodology Mandatory Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-700/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide text-white">
                  Mathematical Fairness & Normalization Policy
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  DETERMINISTIC
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                Students are evaluated strictly using <strong className="text-white">task-specific metrics</strong> and normalized scoring. Raw metrics from different ML tasks (e.g. 99% Accuracy vs 15.2 FID vs 0.35 BLEU) are <strong className="text-white underline decoration-rose-400">never directly compared</strong>. All rankings are deterministically converted onto a common 0–100 Overall Performance Score.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm">
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Baseline Score</div>
              <div className="font-extrabold font-mono text-emerald-400 text-sm">{scoringConfig.baseline_weight}%</div>
            </div>
            <div className="text-slate-500">+</div>
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Relative Rank</div>
              <div className="font-extrabold font-mono text-blue-400 text-sm">{scoringConfig.relative_weight}%</div>
            </div>
            <div className="text-slate-500">+</div>
            <div className="text-center px-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Validation Quality</div>
              <div className="font-extrabold font-mono text-amber-400 text-sm">{scoringConfig.validation_weight}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">130 seeded roster</div>
        </div>

        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Use Cases</div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-1">7</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Distinct ML Domains</div>
        </div>

        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">{stats.avgScore}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Normalized (0–100)</div>
        </div>

        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Score</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{stats.topScore}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Class Rank #1</div>
        </div>

        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Runs</div>
          <div className="text-2xl font-black text-teal-600 font-mono mt-1">{stats.verifiedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Evidence Audited</div>
        </div>

        <div className="card-3d p-4 bg-white">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Required</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{stats.reviewRequiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Audit flags raised</div>
        </div>
      </div>

      {/* 2-Level Architecture Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Leaderboard Level: {activeTab === 'OVERALL' ? 'Level 2 (Overall 130 Students)' : 'Level 1 (Task-Specific Cohort)'}
          </h2>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {USE_CASE_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'OVERALL' 
              ? dedupedData.length 
              : dedupedData.filter(d => d.use_case === tab.id).length;
              
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border shadow-xs ${
                  isActive 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.shortName}</span>
                <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                  isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card-3d p-4 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, roll number, or notebook file..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="REVIEW REQUIRED">Review Required</option>
            <option value="PARTIALLY VERIFIED">Partially Verified</option>
          </select>

          {/* Sort By (Active on Overall view) */}
          {activeTab === 'OVERALL' && (
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="overall_score">Sort: Overall Score</option>
              <option value="task_score">Sort: Task Score</option>
              <option value="baseline_score">Sort: Baseline Perf</option>
              <option value="relative_score">Sort: Relative Rank</option>
              <option value="validation_score">Sort: Validation Quality</option>
              <option value="rank">Sort: Rank #</option>
            </select>
          )}

          <div className="text-xs text-slate-400 font-mono shrink-0 pl-1">
            Showing <strong className="text-slate-800">{displayedStudents.length}</strong> students
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d overflow-hidden p-0 bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="p-3.5 pl-6">Rank</th>
                <th className="p-3.5">Student & Details</th>
                <th className="p-3.5">ML Use Case</th>
                
                {/* Dynamic columns based on Level 1 vs Level 2 */}
                {activeTab === 'OVERALL' ? (
                  <>
                    <th className="p-3.5 text-center">
                      Task Score
                      <span className="block text-[9px] text-slate-400 font-normal">Domain Specific</span>
                    </th>
                    <th className="p-3.5 text-center">
                      Baseline ({scoringConfig.baseline_weight}%)
                      <span className="block text-[9px] text-slate-400 font-normal">Target Attainment</span>
                    </th>
                    <th className="p-3.5 text-center">
                      Relative ({scoringConfig.relative_weight}%)
                      <span className="block text-[9px] text-slate-400 font-normal">Cohort Percentile</span>
                    </th>
                    <th className="p-3.5 text-center">
                      Validation ({scoringConfig.validation_weight}%)
                      <span className="block text-[9px] text-slate-400 font-normal">AST & Evidence</span>
                    </th>
                    <th className="p-3.5 text-center font-black text-indigo-700">
                      Overall Score
                      <span className="block text-[9px] text-indigo-500 font-normal">Normalized (0-100)</span>
                    </th>
                  </>
                ) : (
                  <>
                    <th className="p-3.5">Domain Raw Metrics</th>
                    <th className="p-3.5 text-center">Task Score</th>
                    <th className="p-3.5 text-center">Relative Rank</th>
                    <th className="p-3.5 text-center">Validation Quality</th>
                    <th className="p-3.5 text-center font-black text-indigo-700">Final Score</th>
                  </>
                )}

                <th className="p-3.5 text-center">Audit Status</th>
                <th className="p-3.5 pr-6 text-right">Breakdown</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-3"></div>
                    <div className="font-semibold text-slate-700 text-sm">Calculating Task-Aware Deterministic Scores...</div>
                    <div className="text-xs text-slate-400 mt-1">Evaluating 130 student notebooks across 7 domains</div>
                  </td>
                </tr>
              ) : displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-slate-400 font-medium">
                    No student submissions found matching the active filters.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((row, idx) => {
                  const theme = THEME_COLORS[row.use_case] || THEME_COLORS['Traffic Sign Recognition'];
                  const rankNum = activeTab === 'OVERALL' ? row.overall_rank : row.rank_in_cohort;

                  return (
                    <motion.tr
                      key={row.id || row.roll_no || idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Rank Badge */}
                      <td className="p-3.5 pl-6">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono text-xs ${
                          rankNum === 1 ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300' :
                          rankNum === 2 ? 'bg-slate-300 text-slate-800 shadow-xs' :
                          rankNum === 3 ? 'bg-amber-700 text-amber-100 shadow-xs' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {rankNum}
                        </div>
                      </td>

                      {/* Student Details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{row.student_name}</span>
                          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono">
                            {row.roll_no}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px] font-mono mt-0.5">
                          {row.dept} Sec {row.sec} • {row.filename}
                        </div>
                      </td>

                      {/* Use Case Tag */}
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
                          {row.use_case}
                        </span>
                      </td>

                      {/* Columns for Level 2 (Overall View) */}
                      {activeTab === 'OVERALL' ? (
                        <>
                          {/* Task Score */}
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                            {row.task_score.toFixed(1)}
                          </td>

                          {/* Baseline Score */}
                          <td className="p-3.5 text-center">
                            <span className="font-mono font-bold text-emerald-700">
                              {row.baseline_score.toFixed(1)}
                            </span>
                          </td>

                          {/* Relative Score with Cohort Reliability Badge */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-mono font-bold text-blue-700">
                                {row.relative_score.toFixed(1)}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                row.cohort_status === 'NORMAL' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                row.cohort_status === 'LIMITED' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                'bg-purple-50 text-purple-600 border border-purple-200'
                              }`}>
                                {row.cohort_status} (N={row.cohort_size})
                              </span>
                            </div>
                          </td>

                          {/* Validation Quality Score */}
                          <td className="p-3.5 text-center">
                            <span className="font-mono font-bold text-slate-700">
                              {row.validation_score.toFixed(1)}
                            </span>
                          </td>

                          {/* Overall Normalized 0-100 Score */}
                          <td className="p-3.5 text-center">
                            <div className="inline-block px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs">
                              <span className="text-sm font-black text-indigo-700 font-mono">
                                {row.overall_score.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* Columns for Level 1 (Task-Specific View) */
                        <>
                          {/* Domain Specific Raw Metrics */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {row.raw_metrics && row.raw_metrics.length > 0 ? (
                                row.raw_metrics.map((m: any, mIdx: number) => (
                                  <div key={mIdx} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono">
                                    <span className="text-slate-400 font-medium text-[10px] mr-1">{m.display_name}:</span>
                                    <span className="font-bold text-slate-800">
                                      {m.raw_value !== null ? `${m.raw_value}${m.unit !== 'score' ? m.unit : ''}` : 'N/A'}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-400 font-mono">No raw metrics</span>
                              )}
                            </div>
                          </td>

                          {/* Task Score */}
                          <td className="p-3.5 text-center font-mono font-bold text-slate-800">
                            {row.task_score.toFixed(1)}
                          </td>

                          {/* Relative Rank in Cohort */}
                          <td className="p-3.5 text-center font-mono font-bold text-blue-700">
                            #{row.rank_in_cohort} of {row.cohort_size}
                          </td>

                          {/* Validation Score */}
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                            {row.validation_score.toFixed(1)}
                          </td>

                          {/* Final Score */}
                          <td className="p-3.5 text-center">
                            <div className="inline-block px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs">
                              <span className="text-sm font-black text-indigo-700 font-mono">
                                {row.overall_score.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        </>
                      )}

                      {/* Audit Status Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          row.validation_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.validation_status === 'REVIEW REQUIRED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {row.validation_status === 'VERIFIED' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {row.validation_status}
                        </span>
                      </td>

                      {/* Action: Open Score Breakdown */}
                      <td className="p-3.5 pr-6 text-right">
                        <button
                          onClick={() => openStudentBreakdown(row.roll_no)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Audit
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* SCORE BREAKDOWN & EXPLAINABILITY AUDIT MODAL                              */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedStudentRoll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 p-6 space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Explainable Deterministic Audit
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Roll: {selectedStudentRoll}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {studentBreakdown ? studentBreakdown.student_name : 'Loading Breakdown...'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {studentBreakdown && `${studentBreakdown.use_case_name} • Task: ${studentBreakdown.task_type}`}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedStudentRoll(null); setStudentBreakdown(null); }}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingBreakdown ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-3"></div>
                  <div className="text-sm font-semibold text-slate-600">Gathering mathematical evidence and cell traces...</div>
                </div>
              ) : studentBreakdown ? (
                <div className="space-y-6">
                  {/* Final Composite Score Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        Overall Performance Score
                      </div>
                      <div className="text-4xl font-black font-mono text-white mt-1">
                        {studentBreakdown.overall_score.toFixed(2)} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">
                        Rank #{studentBreakdown.overall_rank} overall • #{studentBreakdown.rank_in_cohort} in {studentBreakdown.cohort_size}-student cohort
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                        Status: {studentBreakdown.validation_status}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Formula: 60% Base + 25% Rel + 15% Val
                      </div>
                    </div>
                  </div>

                  {/* 3 Component Contributions Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      Deterministic Component Weights & Contributions
                    </h4>

                    {/* Component 1: Baseline */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">1. Baseline Performance Score</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {studentBreakdown.baseline_score.toFixed(2)} / 100 (60% weight → +{(studentBreakdown.baseline_score * 0.60).toFixed(2)} pts)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, studentBreakdown.baseline_score)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Measured directly against faculty targets. Bounded 0–100 to prevent extreme score distortions.
                      </p>
                    </div>

                    {/* Component 2: Relative */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">2. Relative Cohort Performance</span>
                        <span className="font-mono font-bold text-blue-700">
                          {studentBreakdown.relative_score.toFixed(2)} / 100 (25% weight → +{(studentBreakdown.relative_score * 0.25).toFixed(2)} pts)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, studentBreakdown.relative_score)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Percentile rank within the {studentBreakdown.use_case_name} cohort ({studentBreakdown.cohort_status} reliability status, N={studentBreakdown.cohort_size}).
                      </p>
                    </div>

                    {/* Component 3: Validation Quality */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">3. Validation Quality Score</span>
                        <span className="font-mono font-bold text-amber-700">
                          {studentBreakdown.validation_score.toFixed(2)} / 100 (15% weight → +{(studentBreakdown.validation_score * 0.15).toFixed(2)} pts)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, studentBreakdown.validation_score)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Evaluates metric traceability, code execution integrity, AST verification, and absence of data leakage.
                      </p>
                    </div>
                  </div>

                  {/* "Why did I get this score?" Evidence Drawer */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Why did I get this score? (Traceable Notebook Evidence)
                    </h4>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {studentBreakdown.evidence && studentBreakdown.evidence.length > 0 ? (
                        studentBreakdown.evidence.map((ev: any, evIdx: number) => (
                          <div key={evIdx} className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800 text-xs">
                                {ev.metric_name}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                                ev.verification_status === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {ev.verification_status} ({ev.confidence_score}% conf)
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>Extracted Value: <strong className="text-slate-900">{ev.extracted_value || 'None'}</strong></div>
                              <div>Target Baseline: <strong className="text-slate-900">{ev.baseline_value || 'N/A'}</strong></div>
                              <div>Detection: <strong className="text-slate-900">{ev.detection_method || 'AST Parser'}</strong></div>
                              <div>Source Cell: <strong className="text-slate-900">Cell #{ev.source_cell ?? 'N/A'}</strong></div>
                            </div>
                            {ev.relevant_code && (
                              <pre className="text-[10px] bg-slate-900 text-slate-200 p-2 rounded-md overflow-x-auto font-mono">
                                {ev.relevant_code}
                              </pre>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 p-4 text-center">
                          No evidence records detected for this run.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* FACULTY SCORING CONFIGURATION MODAL                                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-6"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Faculty Scoring Policy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjust deterministic scoring weights across all 7 ML tasks
                  </p>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                {configError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {configError}
                  </div>
                )}

                {/* Baseline Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Baseline Attainment Weight:</span>
                    <span className="font-mono text-indigo-600">{configForm.baseline_weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={configForm.baseline_weight}
                    onChange={e => setConfigForm({ ...configForm, baseline_weight: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400">Default: 60%. Performance compared directly to faculty targets.</p>
                </div>

                {/* Relative Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Relative Cohort Percentile Weight:</span>
                    <span className="font-mono text-indigo-600">{configForm.relative_weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={configForm.relative_weight}
                    onChange={e => setConfigForm({ ...configForm, relative_weight: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400">Default: 25%. Ranks students strictly within same ML use case.</p>
                </div>

                {/* Validation Quality Weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Validation Quality & Traceability Weight:</span>
                    <span className="font-mono text-indigo-600">{configForm.validation_weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={configForm.validation_weight}
                    onChange={e => setConfigForm({ ...configForm, validation_weight: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-400">Default: 15%. AST compliance and no data leakage audit.</p>
                </div>

                {/* Missing Metric Policy */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-700">Missing Metric Policy:</label>
                  <select
                    value={configForm.missing_metric_policy}
                    onChange={e => setConfigForm({ ...configForm, missing_metric_policy: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="RENORMALIZE">Renormalize Weights (Verified metrics scaled to 100%)</option>
                    <option value="REVIEW_REQUIRED">Cap Score & Flag REVIEW REQUIRED</option>
                    <option value="EXCLUDE">Exclude from Leaderboard until verified</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-bold">
                  <span className="text-slate-500">Total Sum:</span>
                  <span className={`font-mono text-sm ${
                    Number(configForm.baseline_weight) + Number(configForm.relative_weight) + Number(configForm.validation_weight) === 100
                      ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {Number(configForm.baseline_weight) + Number(configForm.relative_weight) + Number(configForm.validation_weight)}%
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="btn-3d px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-sm"
                  >
                    {savingConfig ? 'Applying & Recalculating...' : 'Save & Recalculate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
