import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  AlertCircle 
} from 'lucide-react';
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

  // Faculty Security Key States
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
      if (securityKey.trim() === "FACULTY@2025") {
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
        className={`card-3d p-8 transition-all duration-300 ${
          isAuthorized 
            ? 'border-rose-400 bg-gradient-to-br from-white via-rose-50/40 to-white shadow-[0_8px_30px_rgba(225,29,72,0.12)]' 
            : 'border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-white'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${
                  isAuthorized 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isAuthorized ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Faculty Authorized
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-600" />
                      Staff Security Key Required
                    </>
                  )}
                </span>
                <h3 className="text-lg font-black text-slate-900">Database Purge & Testing Data Cleanup</h3>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">
                Restricted operation: Permanently wipe all student test submissions, extracted evidence, and audit logs. Only authorized faculty and staff members can unlock and execute this action.
              </p>
            </div>

            {isAuthorized && (
              <button
                type="button"
                onClick={() => {
                  setIsAuthorized(false);
                  setSecurityKey('');
                  setAuthError(null);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all self-start sm:self-center"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Re-lock Security</span>
              </button>
            )}
          </div>

          {/* Key Verification Form (when not yet authorized) */}
          {!isAuthorized ? (
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>Enter Faculty Security Key to Unlock Purge Button:</span>
              </div>

              <form onSubmit={handleVerifyKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={securityKey}
                    onChange={(e) => {
                      setSecurityKey(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder="Enter Faculty Security Key (e.g. FACULTY@2025)"
                    className={`w-full px-4 py-2.5 pr-10 text-xs font-mono rounded-xl border bg-white shadow-inner focus:outline-none transition-all ${
                      authError ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={verifyingKey || !securityKey.trim()}
                  className="btn-3d px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 border-none shadow-md flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                  {verifyingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Option</span>
                    </>
                  )}
                </button>
              </form>

              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <p className="text-[11px] text-slate-400 italic">
                * Security Notice: Testing data cleanup is strictly restricted to department faculty. Default authorization key: <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono font-bold">FACULTY@2025</code>
              </p>
            </div>
          ) : (
            /* Authorized Action Section */
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Faculty Security Key Verified — Purge Option Active</span>
                </div>
                <p className="text-xs text-rose-700/80">
                  You may now proceed to clear all test records. This will permanently wipe all test submissions from the database, leaderboard, and analytics.
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
          )}

          {/* Purged Notification */}
          {purgedMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {purgedMessage}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
