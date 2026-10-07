import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Settings2, 
  Loader2, 
  CheckCircle2, 
  Trash2, 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sliders,
  Users,
  Target,
  TrendingUp,
  Clock,
  RotateCcw
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface UseCaseBaseline {
  id?: number;
  name: string;
  accuracy: number;
  macro_f1: number;
  training_time: number;
  time_comparison: string;
  student_quota: number;
  description?: string;
}

const DEFAULT_7_BASELINES: UseCaseBaseline[] = [
  {
    name: "Traffic Sign Recognition",
    accuracy: 88.0,
    macro_f1: 85.0,
    training_time: 45.0,
    time_comparison: "lower",
    student_quota: 15,
    description: "Autonomous vision classification of road signs and regulatory symbols."
  },
  {
    name: "Crop Leaf Disease Classification",
    accuracy: 86.0,
    macro_f1: 82.0,
    training_time: 88.0,
    time_comparison: "higher",
    student_quota: 15,
    description: "Agricultural AI diagnostic pipeline for early foliar pathology identification."
  },
  {
    name: "Face Mask Detection",
    accuracy: 88.5,
    macro_f1: 89.0,
    training_time: 91.5,
    time_comparison: "higher",
    student_quota: 15,
    description: "Real-time facial occlusion audit for public health compliance verification."
  },
  {
    name: "Pet Image Segmentation",
    accuracy: 82.0,
    macro_f1: 78.5,
    training_time: 91.0,
    time_comparison: "higher",
    student_quota: 15,
    description: "Pixel-level semantic contour mask extraction for animal morphology."
  },
  {
    name: "Image Generation with GANs",
    accuracy: 32.0,
    macro_f1: 85.0,
    training_time: 85.0,
    time_comparison: "lower",
    student_quota: 15,
    description: "Generative adversarial distribution synthesis with fidelity metrics."
  },
  {
    name: "Image Captioning",
    accuracy: 64.5,
    macro_f1: 28.0,
    training_time: 1.14,
    time_comparison: "higher",
    student_quota: 15,
    description: "Multimodal vision-language synthesis bridging visual features with natural language."
  },
  {
    name: "Pneumonia Detection from Chest X-Rays",
    accuracy: 94.0,
    macro_f1: 0.93,
    training_time: 90.0,
    time_comparison: "higher",
    student_quota: 15,
    description: "High-stakes clinical radiographic screening with stringent false-negative penalties."
  }
];

// Per-use-case metric labels mapped to the 3 stored fields: accuracy, macro_f1, training_time
const UC_METRIC_CONFIG: Record<string, {
  field1: { label: string; desc: string; unit: string; color: string };
  field2: { label: string; desc: string; unit: string; color: string };
  field3: { label: string; desc: string; unit: string; color: string };
  dir1: string; dir2: string; dir3: string;
}> = {
  "Traffic Sign Recognition": {
    field1: { label: "Target Accuracy",    desc: "Min classification accuracy across all 43 road sign classes",        unit: "%", color: "blue" },
    field2: { label: "Target Macro-F1",    desc: "Unweighted F1 guarding rare sign classes from majority class bias",   unit: "%", color: "indigo" },
    field3: { label: "Max Training Time",  desc: "Maximum deterministic pipeline runtime / latency budget",             unit: "s", color: "purple" },
    dir1: "≥", dir2: "≥", dir3: "≤"
  },
  "Crop Leaf Disease Classification": {
    field1: { label: "Target Accuracy",    desc: "Min diagnostic accuracy across 38 crop foliar pathology classes",    unit: "%", color: "emerald" },
    field2: { label: "Target Macro-F1",    desc: "Guards rare fungal lesions from majority healthy-leaf class bias",    unit: "%", color: "teal" },
    field3: { label: "Confusion Matrix %", desc: "Minimum diagonal dominance threshold across 38×38 class matrix",     unit: "%", color: "cyan" },
    dir1: "≥", dir2: "≥", dir3: "≥"
  },
  "Face Mask Detection": {
    field1: { label: "Min mAP@0.5",        desc: "Mean Average Precision at IoU ≥ 0.50 bounding box threshold",       unit: "%", color: "cyan" },
    field2: { label: "Min Precision",      desc: "Low false-alarm rate: faces incorrectly flagged as unmasked",        unit: "%", color: "blue" },
    field3: { label: "Min Recall",         desc: "Strict sensitivity — no unmasked or incorrectly worn mask missed",   unit: "%", color: "indigo" },
    dir1: "≥", dir2: "≥", dir3: "≥"
  },
  "Pet Image Segmentation": {
    field1: { label: "Min Dice Coefficient", desc: "Sørensen–Dice contour overlap for pet foreground mask pixels",     unit: "%", color: "purple" },
    field2: { label: "Min IoU (Jaccard)",    desc: "Intersection-over-union across foreground, background & boundary", unit: "%", color: "indigo" },
    field3: { label: "Min Pixel Accuracy",   desc: "Total correctly labeled pixels across the full trimap mask",       unit: "%", color: "blue" },
    dir1: "≥", dir2: "≥", dir3: "≥"
  },
  "Image Generation with GANs": {
    field1: { label: "Max FID Score",      desc: "Fréchet Inception Distance ceiling — lower is better quality",      unit: "",  color: "pink" },
    field2: { label: "Generator Loss",     desc: "Target G loss indicating stable minimax convergence",               unit: "",  color: "rose" },
    field3: { label: "Discriminator Loss", desc: "Target D loss balanced without overpowering the generator",         unit: "",  color: "purple" },
    dir1: "≤", dir2: "≈", dir3: "≈"
  },
  "Image Captioning": {
    field1: { label: "Min BLEU-1",         desc: "Unigram lexical precision against human ground-truth captions",     unit: "%", color: "amber" },
    field2: { label: "Min BLEU-4",         desc: "4-gram phrase fluency verifying syntactic coherence & flow",        unit: "%", color: "orange" },
    field3: { label: "Min CIDEr Score",    desc: "Consensus-based image description evaluation (higher = better)",   unit: "",  color: "yellow" },
    dir1: "≥", dir2: "≥", dir3: "≥"
  },
  "Pneumonia Detection from Chest X-Rays": {
    field1: { label: "Min Recall (Sensitivity)", desc: "Clinical priority: strictly limits false-negative pneumonia omissions", unit: "%", color: "rose" },
    field2: { label: "Min ROC-AUC",              desc: "Area under ROC curve measuring separation across clinical thresholds",  unit: "",  color: "red" },
    field3: { label: "Min F1-Score",             desc: "Harmonic balance of high precision alongside maximum sensitivity",     unit: "%", color: "orange" },
    dir1: "≥", dir2: "≥", dir3: "≥"
  }
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-800 border-blue-200" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200",  badge: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200",  badge: "bg-purple-100 text-purple-800 border-purple-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200",    badge: "bg-teal-100 text-teal-800 border-teal-200" },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200",    badge: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  pink:    { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200",    badge: "bg-pink-100 text-pink-800 border-pink-200" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    badge: "bg-rose-100 text-rose-800 border-rose-200" },
  red:     { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     badge: "bg-red-100 text-red-800 border-red-200" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-800 border-amber-200" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  badge: "bg-orange-100 text-orange-800 border-orange-200" },
  yellow:  { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200",  badge: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

export const BaselineConfig = () => {
  const [useCases, setUseCases] = useState<UseCaseBaseline[]>(DEFAULT_7_BASELINES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTabTrack, setActiveTabTrack] = useState<string>('ALL');

  // Faculty Security Key States (for purge)
  const [purging, setPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUseCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/use-cases`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge with defaults to ensure all 7 exist with complete fields
          const merged = DEFAULT_7_BASELINES.map(def => {
            const found = data.find((d: any) => d.name.toLowerCase() === def.name.toLowerCase());
            return found ? {
              ...def,
              ...found,
              accuracy: Number(found.accuracy),
              macro_f1: Number(found.macro_f1),
              training_time: Number(found.training_time),
              student_quota: Number(found.student_quota || 15)
            } : def;
          });
          setUseCases(merged);
        }
      }
    } catch (err) {
      console.error("Error fetching use cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUseCases();
  }, []);

  const handleFieldChange = (index: number, field: keyof UseCaseBaseline, value: any) => {
    setUseCases(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/use-cases/baselines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_cases: useCases })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      console.error("Error saving use case baselines:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all 7 use cases to default recommended baseline criteria?")) {
      setUseCases(DEFAULT_7_BASELINES);
    }
  };

  const handleVerifyKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!securityKey.trim()) {
      setAuthError("Please enter the Faculty Security Key.");
      return;
    }
    setVerifyingKey(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/verify-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security_key: securityKey.trim() })
      });
      if (res.ok) {
        setIsAuthorized(true);
        setAuthError(null);
      } else {
        setIsAuthorized(false);
        setAuthError("Incorrect security key! Access denied. Only authorized faculty/staff can use this button.");
      }
    } catch (err) {
      if (securityKey.trim() === "karunakaran@aiml") {
        setIsAuthorized(true);
        setAuthError(null);
      } else {
        setIsAuthorized(false);
        setAuthError("Incorrect security key! Access denied. Only authorized faculty/staff can use this button.");
      }
    } finally {
      setVerifyingKey(false);
    }
  };

  const handlePurgeData = async () => {
    if (!isAuthorized) {
      setAuthError("Access restricted. Please enter the correct Faculty Security Key above to unlock this button.");
      return;
    }

    if (!window.confirm("CONFIRM DELETION: Are you sure you want to permanently delete ALL student test submissions, extracted evidence, and audit logs? This action cannot be undone.")) {
      return;
    }
    setPurging(true);
    setPurgedMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/clear-all-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security_key: securityKey.trim() })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Authentication failed. Unauthorized action.");
      }
      const data = await res.json();
      setPurgedMessage(data.message || "All testing data has been wiped clean.");
      setIsAuthorized(false);
      setSecurityKey('');
      setTimeout(() => setPurgedMessage(null), 5000);
    } catch (err: any) {
      console.error("Error purging data:", err);
      setAuthError(err.message || "Failed to clear testing data. Please check backend connection.");
    } finally {
      setPurging(false);
    }
  };

  const visibleUseCases = activeTabTrack === 'ALL'
    ? useCases
    : useCases.filter(u => u.name === activeTabTrack);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Rule Engine & Benchmarks
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
              7 Dedicated Tracks
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Baseline Configuration</h1>
          <p className="text-slate-500 text-base font-medium">
            Configure independent thresholds (Accuracy, Macro F1, Training Time, Quota) for all 7 use cases
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="btn-3d-secondary px-4 py-2.5 flex items-center gap-2 text-xs font-bold"
            title="Reset values to track recommended targets"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Reset Defaults
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-3d px-6 py-2.5 flex items-center gap-2 text-xs font-bold tracking-wide disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Re-scoring Cohort...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All 7 Baselines</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold">
                All 7 use case baselines have been updated and student submissions dynamically re-evaluated!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cohort Quota & Weight Distribution Summary */}
      <div className="card-3d p-6 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/40 border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">130 Students Cohort Distribution</h3>
            <p className="text-xs text-slate-500 font-medium">7 Use Cases • 130 Total Cohort Capacity (18–19 Students per Track)</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-blue-100/80 text-blue-800 border border-blue-200">
            Metric 1: Primary Score
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-indigo-100/80 text-indigo-800 border border-indigo-200">
            Metric 2: Secondary Score
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-purple-100/80 text-purple-800 border border-purple-200">
            Metric 3: Auxiliary / Quality
          </span>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTabTrack('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTabTrack === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          View All 7 Fields
        </button>
        {useCases.map((uc, i) => {
          const shortName = uc.name.length > 20 ? uc.name.slice(0, 18) + '..' : uc.name;
          const isSelected = activeTabTrack === uc.name;
          return (
            <button
              key={uc.name || i}
              onClick={() => setActiveTabTrack(uc.name)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {i + 1}. {shortName}
            </button>
          );
        })}
      </div>

      {/* 7 INDIVIDUAL FIELDS FOR THE 7 USE CASES */}
      <div className="space-y-8">
        {visibleUseCases.map((uc, index) => {
          // Find the actual index in the state array
          const actualIndex = useCases.findIndex(u => u.name === uc.name);

          return (
            <motion.div
              key={uc.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className="card-3d p-6 md:p-8 space-y-6 relative overflow-hidden group hover:border-blue-300"
            >
              {/* Field Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-sm flex items-center justify-center border border-blue-200 shadow-xs">
                    0{actualIndex + 1}
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{uc.name}</h2>
                    <p className="text-xs text-slate-400 font-medium max-w-2xl">{uc.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    3 Evaluation Metrics
                  </span>
                </div>
              </div>

              {/* Per-Use-Case Metric Input Fields (3 columns, no quota) */}
              {(() => {
                const cfg = UC_METRIC_CONFIG[uc.name] || UC_METRIC_CONFIG["Traffic Sign Recognition"];
                const c1 = COLOR_MAP[cfg.field1.color] || COLOR_MAP['blue'];
                const c2 = COLOR_MAP[cfg.field2.color] || COLOR_MAP['indigo'];
                const c3 = COLOR_MAP[cfg.field3.color] || COLOR_MAP['purple'];
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Metric Field 1 */}
                    <div className={`space-y-2 p-5 rounded-2xl border ${c1.border} bg-gradient-to-br from-white to-slate-50/60 shadow-xs`}>
                      <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold flex items-center gap-1.5 ${c1.text}`}>
                          <Target className="w-3.5 h-3.5" /> {cfg.field1.label}{cfg.field1.unit ? ` (${cfg.field1.unit})` : ''}
                        </label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border ${c1.badge}`}>
                          {cfg.dir1}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={cfg.field1.unit === 's' ? 9999 : 100}
                        value={uc.accuracy}
                        onChange={(e) => handleFieldChange(actualIndex, 'accuracy', Number(e.target.value))}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none shadow-inner ${c1.border} focus:border-blue-500`}
                      />
                      <p className="text-[11px] text-slate-400 leading-snug">{cfg.field1.desc}</p>
                    </div>

                    {/* Metric Field 2 */}
                    <div className={`space-y-2 p-5 rounded-2xl border ${c2.border} bg-gradient-to-br from-white to-slate-50/60 shadow-xs`}>
                      <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold flex items-center gap-1.5 ${c2.text}`}>
                          <TrendingUp className="w-3.5 h-3.5" /> {cfg.field2.label}{cfg.field2.unit ? ` (${cfg.field2.unit})` : ''}
                        </label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border ${c2.badge}`}>
                          {cfg.dir2}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={cfg.field2.unit === 's' ? 9999 : 100}
                        value={uc.macro_f1}
                        onChange={(e) => handleFieldChange(actualIndex, 'macro_f1', Number(e.target.value))}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none shadow-inner ${c2.border} focus:border-blue-500`}
                      />
                      <p className="text-[11px] text-slate-400 leading-snug">{cfg.field2.desc}</p>
                    </div>

                    {/* Metric Field 3 */}
                    <div className={`space-y-2 p-5 rounded-2xl border ${c3.border} bg-gradient-to-br from-white to-slate-50/60 shadow-xs`}>
                      <div className="flex justify-between items-center">
                        <label className={`text-xs font-bold flex items-center gap-1.5 ${c3.text}`}>
                          <Clock className="w-3.5 h-3.5" /> {cfg.field3.label}{cfg.field3.unit ? ` (${cfg.field3.unit})` : ''}
                        </label>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border ${c3.badge}`}>
                          {cfg.dir3}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={cfg.field3.unit === 's' ? 9999 : 100}
                        value={uc.training_time}
                        onChange={(e) => handleFieldChange(actualIndex, 'training_time', Number(e.target.value))}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none shadow-inner ${c3.border} focus:border-blue-500`}
                      />
                      <p className="text-[11px] text-slate-400 leading-snug">{cfg.field3.desc}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          );
        })}
      </div>

      {/* Floating Save Actions Banner */}
      <div className="card-3d p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-base font-extrabold tracking-tight">Save & Dynamic Re-scoring</h4>
          <p className="text-xs text-slate-400">
            Clicking save will instantly re-calculate all student notebook submissions against their specific track baselines.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-3d px-8 py-3 flex items-center gap-2 text-sm font-bold w-full sm:w-auto justify-center"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Re-scoring Active Runs...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All 7 Baselines</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Faculty Administration & Wipe Testing Data */}
      <div className="border border-rose-200/80 bg-rose-50/40 rounded-3xl p-8 space-y-6">
        <div className="flex items-center space-x-3.5 pb-4 border-b border-rose-100">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              Faculty Data Management
              <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                Security Key Protected
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Administrative tool to wipe all student testing runs and start fresh validation cohorts.
            </p>
          </div>
        </div>

        {purgedMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {purgedMessage}
          </div>
        )}

        {authError && (
          <div className="p-4 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            {authError}
          </div>
        )}

        {!isAuthorized ? (
          <form onSubmit={handleVerifyKey} className="max-w-md space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Faculty Security Key to Unlock Deletion:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  placeholder="Enter security key..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-xs pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={verifyingKey}
                className="btn-3d-secondary px-4 py-2.5 text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                {verifyingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 text-rose-600" />}
                Unlock
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-rose-200">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Faculty Access Verified. Data Purge Authorized.</span>
            </div>
            <button
              onClick={handlePurgeData}
              disabled={purging}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Permanently Clear All Test Data</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
