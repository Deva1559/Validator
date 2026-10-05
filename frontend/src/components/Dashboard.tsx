import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  BarChart3, 
  Sliders, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap,
  Activity,
  Sparkles,
  Layers,
  FileText,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const DEFAULT_7_USE_CASES = [
  {
    id: 1,
    name: "Traffic Sign Recognition",
    student_quota: 19,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Autonomous vision classification of road signs and regulatory symbols.",
    baseline: { accuracy: 88, macro_f1: 85, training_time: 45, time_comparison: 'lower', student_quota: 19 }
  },
  {
    id: 2,
    name: "Crop Leaf Disease Classification",
    student_quota: 19,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Agricultural AI diagnostic pipeline for early foliar pathology identification.",
    baseline: { accuracy: 86, macro_f1: 82, training_time: 60, time_comparison: 'lower', student_quota: 19 }
  },
  {
    id: 3,
    name: "Face Mask Detection",
    student_quota: 19,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Real-time facial occlusion audit for public health compliance verification.",
    baseline: { accuracy: 90, macro_f1: 88, training_time: 30, time_comparison: 'lower', student_quota: 19 }
  },
  {
    id: 4,
    name: "Pet Image Segmentation",
    student_quota: 19,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Pixel-level semantic contour mask extraction for animal morphology.",
    baseline: { accuracy: 82, macro_f1: 78, training_time: 90, time_comparison: 'lower', student_quota: 19 }
  },
  {
    id: 5,
    name: "Image Generation with GANs",
    student_quota: 18,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Generative adversarial distribution synthesis with fidelity metrics.",
    baseline: { accuracy: 80, macro_f1: 75, training_time: 120, time_comparison: 'lower', student_quota: 18 }
  },
  {
    id: 6,
    name: "Image Captioning",
    student_quota: 18,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "Multimodal vision-language synthesis bridging visual features with natural language.",
    baseline: { accuracy: 82, macro_f1: 78, training_time: 100, time_comparison: 'lower', student_quota: 18 }
  },
  {
    id: 7,
    name: "Pneumonia Detection from Chest X-Rays",
    student_quota: 18,
    total_submissions: 0,
    passed_count: 0,
    review_count: 0,
    validation_success_rate: 0,
    avg_accuracy: 0,
    avg_macro_f1: 0,
    avg_training_time: 0,
    quota_progress: 0,
    description: "High-stakes clinical radiographic screening with stringent false-negative penalties.",
    baseline: { accuracy: 92, macro_f1: 90, training_time: 50, time_comparison: 'lower', student_quota: 18 }
  }
];

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  badge?: string;
  progress?: number;
  delay?: number;
}

const MetricCard = ({ title, value, subtitle, icon: Icon, color, badge, progress, delay = 0 }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="card-3d p-6 relative overflow-hidden group hover:border-blue-400/80 transition-all duration-300 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] bg-white/95 backdrop-blur-sm"
  >
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-1.5">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
        <h4 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h4>
        {subtitle && (
          <p className="text-xs font-semibold text-slate-500 pt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} shadow-[0_8px_18px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
      </div>
    </div>

    {progress !== undefined && (
      <div className="mt-5 pt-3.5 border-t border-slate-100/80">
        <div className="flex justify-between items-center text-[11px] font-extrabold text-slate-500 mb-1.5">
          <span>Cohort Enrollment</span>
          <span className="text-blue-600 font-mono">{progress}%</span>
        </div>
        <div className="well-3d h-2.5 p-0.5 overflow-hidden rounded-full">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 transition-all duration-700 shadow-sm" 
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    )}

    {badge && (
      <div className="mt-3.5">
        <span className="inline-flex items-center text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200 shadow-2xs">
          {badge}
        </span>
      </div>
    )}

    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />
  </motion.div>
);

export const Dashboard = ({ setActiveTab }: { setActiveTab?: (tab: string) => void }) => {
  const { isStudent } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartView, setChartView] = useState<'BASELINE' | 'TIERS' | 'STUDENTS'>('BASELINE');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL'); // 'ALL' or specific use case name

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
      <div className="text-slate-600 font-bold text-lg">Initializing 3D Multi-Track Analytics...</div>
    </div>
  );

  // Merge backend use case stats with defaults if empty
  const rawUseCases = (stats.use_cases && stats.use_cases.length > 0) ? stats.use_cases : DEFAULT_7_USE_CASES;
  const useCasesList = DEFAULT_7_USE_CASES.map(def => {
    const found = rawUseCases.find((u: any) => u.name.toLowerCase() === def.name.toLowerCase());
    return found || def;
  });

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

  const displayedUseCases = selectedTrack === 'ALL' 
    ? useCasesList 
    : useCasesList.filter((u: any) => u.name === selectedTrack);

  return (
    <div className="space-y-10 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Multi-Track Analytics
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              7 Use Cases • 130 Enrolled Students
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">AI Evaluation Dashboard</h1>
          <p className="text-slate-500 text-base font-medium">Batch performance monitoring across all 7 assignment use cases (130 Students Total)</p>
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
          {isStudent && (
            <button 
              onClick={() => setActiveTab && setActiveTab('Upload Projects')}
              className="btn-3d px-5 py-2.5 flex items-center gap-2 text-xs font-bold tracking-wide"
            >
              <Zap className="w-4 h-4" />
              New Submission
            </button>
          )}
        </div>
      </div>

      {/* Cohort-Wide High Level Summary (4 Cards) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Combined Cohort Overview (All 7 Tracks)</h2>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {stats.total_students} / 130 Unique Students Submitted
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard 
            title="Total Cohort Submissions" 
            value={`${stats.total_students} / 130`} 
            subtitle={`${Math.max(0, 130 - stats.total_students)} available seats remaining`}
            progress={Math.min(100, Math.round((stats.total_students / 130) * 100))}
            icon={Users} 
            color="bg-gradient-to-tr from-blue-600 to-indigo-600" 
            delay={0.05} 
          />
          <MetricCard 
            title="Cohort Pass Rate" 
            value={`${stats.validation_success_rate}%`} 
            subtitle="Verified against baseline thresholds"
            icon={CheckCircle2} 
            color="bg-gradient-to-tr from-emerald-500 to-teal-600" 
            delay={0.1} 
          />
          <MetricCard 
            title="Cohort Average Accuracy" 
            value={`${stats.avg_accuracy}%`} 
            subtitle={`Target: ≥ ${targetAcc}% (${stats.avg_accuracy >= targetAcc ? 'Passing' : 'Below Target'})`}
            icon={Target} 
            color="bg-gradient-to-tr from-violet-600 to-purple-600" 
            delay={0.15} 
          />
          <MetricCard 
            title="Cohort Average Macro F1" 
            value={`${stats.avg_macro_f1}%`} 
            subtitle={`Target: ≥ ${targetF1}% (${stats.avg_macro_f1 >= targetF1 ? 'Passing' : 'Below Target'})`}
            icon={TrendingUp} 
            color="bg-gradient-to-tr from-amber-500 to-orange-600" 
            delay={0.2} 
          />
        </div>
      </div>

      {/* 7 USE CASES SECTION - ALL 4 CARDS FOR EACH SEPARATE USE CASE */}
      <div className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                7 Machine Learning Use Cases
              </h2>
            </div>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              130 students partitioned across 7 use cases with dedicated baseline criteria & 4 real-time tracking cards
            </p>
          </div>

          {/* Filter / Track Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner">
            <button
              onClick={() => setSelectedTrack('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedTrack === 'ALL'
                  ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              All 7 Use Cases
            </button>
            {useCasesList.map((uc: any, idx: number) => {
              const shortName = uc.name.length > 18 ? uc.name.slice(0, 16) + '..' : uc.name;
              const isSelected = selectedTrack === uc.name;
              return (
                <button
                  key={uc.id || idx}
                  onClick={() => setSelectedTrack(uc.name)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all truncate ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                  title={uc.name}
                >
                  {idx + 1}. {shortName} ({uc.total_submissions}/{uc.student_quota || 19})
                </button>
              );
            })}
          </div>
        </div>

        {/* RENDER ALL 4 CARDS FOR EACH OF THE 7 USE CASES */}
        <div className="space-y-8">
          {displayedUseCases.map((uc: any, ucIdx: number) => {
            const quota = uc.student_quota || 19;
            const subs = uc.total_submissions || 0;
            const quotaPercent = Math.min(100, Math.round((subs / quota) * 100));
            const baseAcc = uc.baseline?.accuracy ?? 85;
            const baseF1 = uc.baseline?.macro_f1 ?? 80;
            const baseTime = uc.baseline?.training_time ?? 60;
            const slotsLeft = Math.max(0, quota - subs);
            const isFull = subs >= quota;

            return (
              <motion.div
                key={uc.name || ucIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ucIdx * 0.05, duration: 0.35 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-6 hover:border-slate-300 transition-all"
              >
                {/* Use Case Track Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200">
                        0{ucIdx + 1}
                      </span>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {uc.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        isFull 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : subs > 0 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isFull ? `Quota Full (${subs}/${quota})` : `${slotsLeft} of ${quota} Slots Available`}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 font-medium max-w-3xl">
                      {uc.description}
                    </p>
                  </div>

                  {/* Benchmark Targets Pill */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/90 text-slate-600">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Targets:</span>
                    <span className="text-slate-900 font-mono">Acc ≥ {baseAcc}%</span>
                    <span>•</span>
                    <span className="text-slate-900 font-mono">F1 ≥ {baseF1}%</span>
                    <span>•</span>
                    <span className="text-slate-900 font-mono">Time ≤ {baseTime}s</span>
                  </div>
                </div>

                {/* THE 4 SEPARATE METRIC CARDS FOR THIS USE CASE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Submissions (X / Quota Enrolled) */}
                  <MetricCard
                    title="Track Submissions"
                    value={`${subs} / ${quota}`}
                    subtitle={`${slotsLeft} remaining • ${quotaPercent}% filled`}
                    progress={quotaPercent}
                    icon={Users}
                    color="bg-gradient-to-tr from-blue-600 to-indigo-600"
                    badge={`${quota} Students Quota`}
                    delay={0.05}
                  />

                  {/* Card 2: Baseline Pass Rate */}
                  <MetricCard
                    title="Baseline Pass Rate"
                    value={`${uc.validation_success_rate || 0}%`}
                    subtitle={`${uc.passed_count || 0} Passed • ${uc.review_count || 0} Need Review`}
                    icon={CheckCircle2}
                    color="bg-gradient-to-tr from-emerald-500 to-teal-600"
                    badge={uc.validation_success_rate >= 75 ? "Optimal Pass Rate" : "Standard Compliance"}
                    delay={0.1}
                  />

                  {/* Card 3: Average Accuracy */}
                  <MetricCard
                    title="Average Accuracy"
                    value={`${uc.avg_accuracy || 0}%`}
                    subtitle={`Target: ≥ ${baseAcc}% (${(uc.avg_accuracy || 0) >= baseAcc ? 'Passed' : 'Below Target'})`}
                    icon={Target}
                    color="bg-gradient-to-tr from-violet-600 to-purple-600"
                    badge={`Target: ≥ ${baseAcc}%`}
                    delay={0.15}
                  />

                  {/* Card 4: Average Macro F1 */}
                  <MetricCard
                    title="Average Macro F1"
                    value={`${uc.avg_macro_f1 || 0}%`}
                    subtitle={`Target: ≥ ${baseF1}% (${(uc.avg_macro_f1 || 0) >= baseF1 ? 'Passed' : 'Below Target'})`}
                    icon={TrendingUp}
                    color="bg-gradient-to-tr from-amber-500 to-orange-600"
                    badge={`Target: ≥ ${baseF1}%`}
                    delay={0.2}
                  />
                </div>

                {/* Quick Track Footer & Action */}
                <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-semibold text-slate-500 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Avg Runtime: <strong className="text-slate-900 font-mono">{uc.avg_training_time || 0}s</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Status: <strong className="text-slate-900">{subs === 0 ? "Awaiting Notebooks" : "Active Auditing"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveTab && setActiveTab('Baselines')}
                      className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
                    >
                      Configure Track Baseline <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main 3D Visualizer: Accuracy Distribution */}
      <div className="pt-4">
        {/* Dynamic Accuracy Distribution Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-3d p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
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
                    <defs>
                      <linearGradient id="studentEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="studentAmberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#D97706" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="studentGrayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#64748B" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis stroke="#94A3B8" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 12px 28px -6px rgba(0,0,0,0.12)' }}
                      formatter={(val: any) => [`${val}%`, 'Accuracy']}
                    />
                    <ReferenceLine y={targetAcc} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" label={{ value: `Target: ${targetAcc}%`, fill: '#D97706', fontSize: 11, fontWeight: 700, position: 'top' }} />
                    <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                      {activeChartData.map((entry: any, index: number) => {
                        const fillGrad = !entry.is_verified ? 'url(#studentGrayGrad)' : entry.meets_target ? 'url(#studentEmeraldGrad)' : 'url(#studentAmberGrad)';
                        return <Cell key={`cell-student-${index}`} fill={fillGrad} />;
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={activeChartData} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
                    <defs>
                      <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barGradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#B45309" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="barGradGray" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#64748B" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis stroke="#94A3B8" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 12px 28px -6px rgba(0,0,0,0.12)' }}
                      formatter={(val: any) => [`${val} Students`, 'Count']}
                    />
                    <Bar dataKey="students" radius={[8, 8, 0, 0]}>
                      {activeChartData.map((entry: any, index: number) => {
                        let fillVal = 'url(#barGradBlue)';
                        if (entry.fill === '#10B981') fillVal = 'url(#barGradEmerald)';
                        else if (entry.fill === '#F59E0B') fillVal = 'url(#barGradAmber)';
                        else if (entry.fill === '#6B7280' || entry.fill === '#94A3B8') fillVal = 'url(#barGradGray)';
                        return <Cell key={`cell-${index}`} fill={fillVal} />;
                      })}
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
              Adjust All 7 Baselines <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
