import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, CheckCircle2, AlertTriangle, ShieldCheck, 
  Activity, X, Search, 
  Layers, Copy, Check,
  ShieldAlert, CheckCheck, BarChart3
} from 'lucide-react';

import { API_BASE_URL } from '../config';

export const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [evidenceData, setEvidenceData] = useState<any[]>([]);
  const [findingsData, setFindingsData] = useState<any[]>([]);
  const [scoringData, setScoringData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'procedure' | 'metrics' | 'workflow' | 'scoring' | 'findings'>('procedure');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/leaderboard`)
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openEvidence = async (run: any) => {
    setSelectedRun(run);
    setActiveTab('procedure');
    try {
      const [evRes, findRes, scoreRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/validations/${run.id}/evidence`),
        fetch(`${API_BASE_URL}/api/validations/${run.id}/findings`),
        fetch(`${API_BASE_URL}/api/validations/${run.id}/scoring`)
      ]);
      setEvidenceData(await evRes.json());
      setFindingsData(await findRes.json());
      setScoringData(await scoreRes.json());
    } catch (e) {
      console.error("Failed to load audit evidence", e);
    }
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "validation_audit_reports.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportSingleRun = (run: any) => {
    const exportPayload = {
      run_summary: run,
      scoring: scoringData,
      evidence: evidenceData,
      findings: findingsData,
      exported_at: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${run.student_name.toLowerCase().replace(/\s+/g, '_')}_audit_dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredReports = reports.filter(r => 
    r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Workflow evidence mapping
  const cleaningEvidence = evidenceData.find(e => e.metric_name?.includes("ML-002"));
  const trainSplitEvidence = evidenceData.find(e => e.metric_name?.includes("ML-007"));
  const modelTrainingEvidence = evidenceData.find(e => e.metric_name?.includes("ML-010"));
  const modelEvalEvidence = evidenceData.find(e => e.metric_name?.includes("ML-012"));
  const metricEvidenceList = evidenceData.filter(e => e.evidence_type === "METRIC");
  const workflowEvidenceList = evidenceData.filter(e => e.evidence_type === "WORKFLOW");

  // Determine leakage & cleaning pass flags
  const leakageFindings = findingsData.filter(f => f.finding_type?.includes("LEAKAGE"));
  const hasLeakage = leakageFindings.length > 0;
  const cleaningPass = cleaningEvidence?.verification_status === "VERIFIED";

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Audit Transparency & Evidence Engine
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Validation Reports</h1>
          <p className="text-slate-500 text-base font-medium">Explainable evidence, dataset hygiene verification, and leak-free training audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportAll}
            className="btn-3d px-5 py-2.5 flex items-center gap-2 text-xs font-bold tracking-wide"
          >
            <Download className="w-4 h-4" />
            Export All Audits (.json)
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card-3d p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input 
          type="text"
          placeholder="Filter by student name or notebook filename..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1">
            Clear
          </button>
        )}
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 card-3d">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <div className="font-semibold text-slate-600">Loading student audit records...</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 card-3d font-medium">
            No matching validation reports found.
          </div>
        ) : (
          filteredReports.map((report, idx) => (
            <motion.div
              key={report.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="card-3d p-6 flex flex-col justify-between group hover:border-blue-400"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[190px]">
                        {report.student_name}
                      </h3>
                      {report.roll_no && (
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono">
                          {report.roll_no}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-[210px] font-mono mt-0.5">
                      {report.dept && `${report.dept} (${report.sec || 'A'}) • `}{report.filename}
                    </p>
                  </div>
                  {report.status === "VERIFIED" ? (
                    <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Pass
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Review
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 my-5">
                  <div className="well-3d p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Final Score</p>
                    <p className="text-2xl font-black text-slate-900">{report.final_score}<span className="text-xs font-bold text-slate-400"> / 100</span></p>
                  </div>
                  <div className="well-3d p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Baselines</p>
                    <p className="text-2xl font-black text-blue-600">{report.baselines_passed_count}<span className="text-xs font-bold text-slate-400"> / 3</span></p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className="font-bold text-slate-800">{report.accuracy !== 'N/A' ? `${report.accuracy}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Macro F1:</span>
                    <span className="font-bold text-slate-800">{report.macro_f1 !== 'N/A' ? `${report.macro_f1}%` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Training Time:</span>
                    <span className="font-bold text-slate-800">{report.training_time !== 'N/A' ? `${report.training_time}s` : 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => openEvidence(report)}
                className="btn-3d-secondary w-full py-2.5 flex justify-center items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <ShieldCheck className="w-4 h-4" /> View Evidence Audit
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* 3D Slide-Over Evidence Drawer */}
      <AnimatePresence>
        {selectedRun && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40"
              onClick={() => setSelectedRun(null)}
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed top-0 right-0 w-full sm:w-[820px] h-full bg-white border-l border-slate-200 z-50 overflow-y-auto custom-scrollbar shadow-[0_0_60px_rgba(0,0,0,0.25)] flex flex-col"
            >
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md p-6 border-b border-slate-200 z-10 shadow-xs">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Validation Evidence & Audit</h2>
                      {selectedRun.status === "VERIFIED" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                          REVIEW REQUIRED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Student: <span className="text-blue-600 font-bold">{selectedRun.student_name}</span>
                      {selectedRun.roll_no && <> | Roll: <span className="font-mono font-bold text-slate-800">{selectedRun.roll_no}</span></>}
                      {selectedRun.dept && <> | Dept: <span className="font-semibold text-slate-700">{selectedRun.dept} (Sec {selectedRun.sec || 'A'})</span></>}
                      | Notebook: <span className="font-mono text-slate-700 font-semibold">{selectedRun.filename}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportSingleRun(selectedRun)}
                      className="btn-3d-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 text-slate-700"
                      title="Download JSON dossier"
                    >
                      <Download className="w-3.5 h-3.5" /> Dossier
                    </button>
                    <button 
                      onClick={() => setSelectedRun(null)} 
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('procedure')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'procedure' 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Procedure & Leakage Audit
                  </button>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'metrics' 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Metric Evidence
                  </button>
                  <button
                    onClick={() => setActiveTab('workflow')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'workflow' 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> 7-Step Pipeline
                  </button>
                  <button
                    onClick={() => setActiveTab('scoring')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'scoring' 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> Scoring Math
                  </button>
                  <button
                    onClick={() => setActiveTab('findings')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'findings' 
                        ? 'bg-white text-blue-600 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Findings ({findingsData.length})
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-8 space-y-8 flex-1">
                {/* TAB 1: Procedure & Leakage Audit */}
                {activeTab === 'procedure' && (
                  <div className="space-y-6">
                    {/* Executive Procedure Summary Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Automated Verification Protocol</span>
                          <h3 className="text-lg font-black text-slate-900 mt-0.5">Dataset Hygiene & Model Training Audit</h3>
                          <p className="text-xs text-slate-600 mt-1 max-w-xl">
                            Evaluates data cleaning execution, train-test isolation, model fitting arguments, and guarantees zero data leakage from training into test evaluation.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 font-bold block">Status</span>
                          {!hasLeakage && cleaningPass ? (
                            <span className="inline-flex items-center text-emerald-700 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full text-xs font-extrabold mt-1">
                              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Clean Protocol
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-extrabold mt-1">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Review Advised
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1: Dataset Cleaning & Quality Procedure */}
                    <div className="card-3d p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">ML-002</span>
                            <h4 className="text-lg font-black text-slate-900">Dataset Cleaning & Quality Procedure</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Checks for missing values handling (dropna/fillna/imputer), sample deduplication, and data hygiene.
                          </p>
                        </div>
                        {cleaningPass ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-xs bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cleaning Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-xs bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Missing / Incomplete
                          </span>
                        )}
                      </div>

                      {cleaningEvidence && cleaningEvidence.source_cell !== null ? (
                        <>
                          <div className="well-3d p-4 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-extrabold text-blue-600 uppercase">Detection Evidence: Cell #{cleaningEvidence.source_cell}</span>
                              <span className="text-slate-400 font-mono">Method: {cleaningEvidence.detection_method}</span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium">
                              {cleaningEvidence.baseline_status}
                            </p>
                          </div>

                          {/* Code Block with Copy Button */}
                          <div className="relative group">
                            <div className="flex justify-between items-center bg-slate-800 px-4 py-2 rounded-t-xl text-[11px] font-mono text-slate-300">
                              <span>Notebook Cell #{cleaningEvidence.source_cell} Execution Code</span>
                              <button
                                onClick={() => copyCode(cleaningEvidence.relevant_code || '', `clean-${cleaningEvidence.id}`)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                              >
                                {copiedCell === `clean-${cleaningEvidence.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedCell === `clean-${cleaningEvidence.id}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-b-xl font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
                              <pre>{cleaningEvidence.relevant_code || "Code not available"}</pre>
                            </div>
                          </div>

                          {/* Output Block */}
                          {cleaningEvidence.relevant_output && (
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs font-mono text-emerald-900">
                              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Execution Standard Output</div>
                              <pre className="whitespace-pre-wrap">{cleaningEvidence.relevant_output}</pre>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                          <p className="font-bold">No explicit data cleaning operations detected.</p>
                          <p className="mt-1 text-slate-600">The notebook does not include standard missing value treatment (`dropna()`, `fillna()`, or `SimpleImputer`) or duplicate row purging.</p>
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: Model Training & Data Leakage Protection Audit */}
                    <div className="card-3d p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">ML-010</span>
                            <h4 className="text-lg font-black text-slate-900">Model Training Procedure & Leakage Check</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Enforces strict train-test separation: verifies model fits exclusively on `X_train` after partition.
                          </p>
                        </div>
                        {!hasLeakage ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-xs bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Leakage-Free Verified
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase shadow-xs bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Contamination Warning
                          </span>
                        )}
                      </div>

                      {/* Integrity Checklist Badges */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="well-3d p-3 flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Partition Precedence</p>
                            <p className="text-xs font-bold text-slate-800">
                              Split #{trainSplitEvidence?.source_cell ?? '?'} &lt; Fit #{modelTrainingEvidence?.source_cell ?? '?'}
                            </p>
                          </div>
                        </div>

                        <div className="well-3d p-3 flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Training Split</p>
                            <p className="text-xs font-bold text-slate-800">Fitted on X_train only</p>
                          </div>
                        </div>

                        <div className="well-3d p-3 flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Inference Split</p>
                            <p className="text-xs font-bold text-slate-800">Evaluated on X_test only</p>
                          </div>
                        </div>
                      </div>

                      {/* Model Training Code */}
                      {modelTrainingEvidence && (
                        <div className="relative group">
                          <div className="flex justify-between items-center bg-slate-800 px-4 py-2 rounded-t-xl text-[11px] font-mono text-slate-300">
                            <span>Training Procedure Code: Cell #{modelTrainingEvidence.source_cell}</span>
                            <button
                              onClick={() => copyCode(modelTrainingEvidence.relevant_code || '', `train-${modelTrainingEvidence.id}`)}
                              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedCell === `train-${modelTrainingEvidence.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedCell === `train-${modelTrainingEvidence.id}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <div className="bg-slate-900 p-4 rounded-b-xl font-mono text-xs text-sky-400 overflow-x-auto shadow-inner leading-relaxed">
                            <pre>{modelTrainingEvidence.relevant_code || "Code not available"}</pre>
                          </div>
                        </div>
                      )}

                      {/* Training Output */}
                      {modelTrainingEvidence?.relevant_output && (
                        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs font-mono text-blue-900">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Training Runtime Output</div>
                          <pre className="whitespace-pre-wrap">{modelTrainingEvidence.relevant_output}</pre>
                        </div>
                      )}

                      {/* Evaluation on Test Split Evidence */}
                      {modelEvalEvidence && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800">ML-012</span>
                            <h5 className="text-sm font-extrabold text-slate-900">Held-Out Test Set Evaluation</h5>
                          </div>
                          <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-purple-300 overflow-x-auto shadow-inner">
                            <pre>{modelEvalEvidence.relevant_code || "Code not available"}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Metric Evidence */}
                {activeTab === 'metrics' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">Explainable Metric Evidence</h4>
                      <p className="text-xs text-slate-600">
                        Every single score is backed by the exact source cell, execution code snippet, raw console output, baseline threshold, and deterministic difference.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {metricEvidenceList.map((e, i) => (
                        <div key={i} className="card-3d p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-black text-slate-900">{e.metric_name}</h4>
                                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  {e.confidence_score}% Confidence
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1">Detection Method: {e.detection_method}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-xs ${
                              e.verification_status === 'VERIFIED' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {e.verification_status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="well-3d p-4">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Extracted Result</p>
                              <p className="text-2xl font-mono font-black text-slate-900">{e.extracted_value || 'N/A'}</p>
                              <p className="text-[11px] text-slate-500 mt-1">Parsed from verified execution output</p>
                            </div>
                            <div className="well-3d p-4">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Baseline Comparison</p>
                              <p className="text-xs text-slate-700 font-medium">Faculty Target: <span className="font-mono font-bold text-slate-900">{e.baseline_value}</span></p>
                              {e.difference_from_baseline && (
                                <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">{e.difference_from_baseline}</p>
                              )}
                              <p className="text-[11px] text-slate-500 mt-1">{e.baseline_status}</p>
                            </div>
                          </div>
                          
                          {e.source_cell !== null && (
                            <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-blue-600 uppercase tracking-wider">Source Cell: #{e.source_cell}</span>
                                <button
                                  onClick={() => copyCode(e.relevant_code || '', `metric-${e.id}`)}
                                  className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium"
                                >
                                  {copiedCell === `metric-${e.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedCell === `metric-${e.id}` ? 'Copied' : 'Copy Code'}
                                </button>
                              </div>
                              <div className="bg-slate-900 p-4 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto shadow-inner leading-relaxed">
                                <pre>{e.relevant_code || "Code not extracted"}</pre>
                              </div>
                              {e.relevant_output && (
                                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3.5 text-xs font-mono text-emerald-900 rounded-r-xl">
                                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Direct Cell Output:</div>
                                  <pre className="whitespace-pre-wrap">{e.relevant_output}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: 7-Step Pipeline */}
                {activeTab === 'workflow' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">End-to-End ML Pipeline Verification</h4>
                      <p className="text-xs text-slate-600">
                        Tracks compliance across all standard machine learning engineering stages (ML-001 through ML-012).
                      </p>
                    </div>

                    <div className="space-y-4">
                      {workflowEvidenceList.map((e, i) => (
                        <div key={i} className="card-3d p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-extrabold text-slate-900">{e.metric_name}</h4>
                                {e.source_cell !== null ? (
                                  <span className="text-[11px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Cell #{e.source_cell}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                    Not Found
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">{e.baseline_status}</p>
                            </div>
                            <span>
                              {e.verification_status === 'VERIFIED' ? (
                                <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Detected
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                                  <X className="w-3.5 h-3.5 mr-1" /> Not Found
                                </span>
                              )}
                            </span>
                          </div>

                          {e.relevant_code && (
                            <div className="pt-2">
                              <div className="bg-slate-900 p-3 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto shadow-inner leading-relaxed">
                                <pre>{e.relevant_code}</pre>
                              </div>
                              {e.relevant_output && (
                                <div className="mt-2 bg-slate-100 border-l-3 border-blue-500 p-2.5 text-xs font-mono text-slate-800 rounded-r-lg">
                                  Output: {e.relevant_output}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Scoring Math */}
                {activeTab === 'scoring' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">Deterministic Scoring Audit</h4>
                      <p className="text-xs text-slate-600">
                        Weighted deterministic scoring model based on active baseline targets (Accuracy 40%, Macro F1 40%, Training Time 20%).
                      </p>
                    </div>

                    {scoringData ? (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase">
                            <tr>
                              <th className="p-4">Evaluated Metric</th>
                              <th className="p-4 text-right">Faculty Weight</th>
                              <th className="p-4 text-right">Target Baseline</th>
                              <th className="p-4 text-right">Calculated Contribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {scoringData.breakdown.map((s: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-900">{s.metric_name}</td>
                                <td className="p-4 text-slate-500 text-right font-mono font-medium">{s.weight}%</td>
                                <td className="p-4 text-slate-600 text-right font-mono text-xs font-semibold">
                                  {s.metric_name === 'Accuracy' && '>= 85.0%'}
                                  {s.metric_name === 'Macro F1' && '>= 80.0%'}
                                  {s.metric_name === 'Training Time' && '<= 60.0s'}
                                </td>
                                <td className="p-4 text-emerald-600 font-extrabold text-right font-mono">+{s.contribution.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 border-t border-slate-200">
                            <tr>
                              <td colSpan={3} className="p-4 text-slate-900 font-extrabold text-right">Final Deterministic Score:</td>
                              <td className="p-4 text-blue-600 font-black text-right text-2xl font-mono">{scoringData.final_score.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 100</span></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : <div className="text-slate-400 text-sm">Loading scoring breakdown...</div>}
                  </div>
                )}

                {/* TAB 5: Findings Log */}
                {activeTab === 'findings' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">Integrity Engine Findings</h4>
                      <p className="text-xs text-slate-600">
                        Detailed log of all automated findings generated by the Data Hygiene Engine and the Integrity Engine.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {findingsData.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 well-3d">
                          No alerts or integrity findings logged.
                        </div>
                      ) : (
                        findingsData.map((f: any, i: number) => {
                          const isPass = f.finding_type?.includes('PASS');
                          const isLeakage = f.finding_type?.includes('LEAKAGE');
                          
                          return (
                            <div 
                              key={i} 
                              className={`p-4 rounded-xl border flex items-start gap-3 ${
                                isPass 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                                  : isLeakage 
                                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}
                            >
                              {isPass ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              ) : isLeakage ? (
                                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    isPass 
                                      ? 'bg-emerald-200/60 text-emerald-800' 
                                      : isLeakage 
                                      ? 'bg-rose-200/60 text-rose-800' 
                                      : 'bg-amber-200/60 text-amber-800'
                                  }`}>
                                    {f.finding_type}
                                  </span>
                                  <span className="text-xs font-mono text-slate-500">Source: {f.source}</span>
                                </div>
                                <h5 className="text-sm font-extrabold">{f.title}</h5>
                                <p className="text-xs text-slate-700 leading-relaxed">{f.description}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-500 font-mono">
                  Audit ID: RUN-{selectedRun.id.toString().padStart(4, '0')} | Batch: {selectedRun.batch_id || 'CURRENT'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportSingleRun(selectedRun)}
                    className="btn-3d-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Dossier
                  </button>
                  <button 
                    onClick={() => setSelectedRun(null)} 
                    className="btn-3d px-6 py-2 text-xs font-bold"
                  >
                    Close Audit
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
