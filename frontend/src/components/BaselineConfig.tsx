import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Settings2, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const BaselineConfig = () => {
  const [config, setConfig] = useState({
    accuracy: 85,
    macro_f1: 80,
    training_time: 60,
    time_comparison: 'lower'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState<string | null>(null);

  const handlePurgeData = async () => {
    if (!window.confirm("Are you sure you want to permanently delete ALL student test submissions, extracted evidence, and audit logs? This cannot be undone.")) {
      return;
    }
    setPurging(true);
    setPurgedMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/clear-all-data`, {
        method: 'POST'
      });
      const data = await res.json();
      setPurgedMessage(data.message || "All testing data has been wiped clean.");
      setTimeout(() => setPurgedMessage(null), 4000);
    } catch (err) {
      console.error("Error purging data:", err);
      alert("Failed to clear testing data. Please check backend connection.");
    } finally {
      setPurging(false);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/baselines`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig({
            accuracy: data.accuracy || 85,
            macro_f1: data.macro_f1 || 80,
            training_time: data.training_time || 60,
            time_comparison: data.time_comparison || 'lower'
          });
        }
      })
      .catch(err => console.error("Error fetching baselines:", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_BASE_URL}/baselines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving baselines:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
            Rule Engine
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Baseline Configuration</h1>
        <p className="text-slate-500 text-base font-medium">Configure evaluation thresholds to dynamically re-score all student projects</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-8 space-y-8"
      >
        <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Grading & Benchmarking Rules</h2>
            <p className="text-xs text-slate-400 font-medium">Modifications will trigger immediate re-evaluation across all active submissions</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Target Accuracy */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">Target Accuracy (%)</label>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 font-mono">Weight: 40%</span>
            </div>
            <input 
              type="number" 
              step="0.1"
              value={config.accuracy}
              onChange={(e) => setConfig({...config, accuracy: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner"
            />
            <p className="text-xs text-slate-400">Minimum expected classification accuracy required for full score contribution</p>
          </div>

          {/* Target Macro F1 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">Target Macro F1 (%)</label>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 font-mono">Weight: 40%</span>
            </div>
            <input 
              type="number" 
              step="0.1"
              value={config.macro_f1}
              onChange={(e) => setConfig({...config, macro_f1: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner"
            />
            <p className="text-xs text-slate-400">Minimum expected Macro F1 score to evaluate multi-class balance</p>
          </div>

          {/* Training Time */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-700">Training Time Requirements</label>
              <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200 font-mono">Weight: 20%</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <select 
                  value={config.time_comparison}
                  onChange={(e) => setConfig({...config, time_comparison: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-inner"
                >
                  <option value="lower">Lower duration is better (Faster)</option>
                  <option value="higher">Higher duration is expected</option>
                </select>
                <p className="text-xs text-slate-400">Direction of compliance</p>
              </div>

              <div className="space-y-2">
                <input 
                  type="number" 
                  step="1"
                  value={config.training_time}
                  onChange={(e) => setConfig({...config, training_time: Number(e.target.value)})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-inner"
                />
                <p className="text-xs text-slate-400">Execution time threshold in seconds</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
          {saved ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
              Baselines updated & cohort re-evaluated!
            </motion.div>
          ) : <div></div>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-3d px-8 py-3 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Re-evaluating Cohort...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Apply Baselines</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Database Maintenance & Data Purge Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-3d p-8 border-rose-200/70 bg-gradient-to-br from-white via-rose-50/20 to-white"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                Danger Zone
              </span>
              <h3 className="text-lg font-black text-slate-900">Database Purge & Testing Data Cleanup</h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Permanently wipe all student test submissions, extracted evidence, and audit logs. Use this to remove sample or test records and start fresh for live student cohorts.
            </p>
          </div>

          <button
            onClick={handlePurgeData}
            disabled={purging}
            className="btn-3d px-6 py-3 flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 border-none shadow-[0_4px_14px_rgba(225,29,72,0.3)] whitespace-nowrap self-start sm:self-center"
          >
            {purging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Purging Records...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Clear All Testing Data</span>
              </>
            )}
          </button>
        </div>

        {purgedMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {purgedMessage}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
