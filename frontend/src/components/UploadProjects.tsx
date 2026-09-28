import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, Sparkles, FolderUp, Check } from 'lucide-react';

export const UploadProjects = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFiles([]);
          setActiveTab('Leaderboard');
        }, 1800);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
            Batch Ingestion
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Upload Student Projects</h1>
        <p className="text-slate-500 text-base font-medium">Upload student Jupyter Notebooks (.ipynb) for automated validation & ranking</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-8"
      >
        {!success ? (
          <div className="space-y-6">
            <div 
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-gradient-to-b from-slate-50/60 to-blue-50/20 rounded-2xl p-12 text-center transition-all cursor-pointer relative group shadow-inner"
            >
              <input 
                type="file" 
                multiple 
                accept=".ipynb"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-[0_8px_20px_rgba(37,99,235,0.15)] flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 transition-all">
                  <UploadCloud className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-extrabold text-lg">Drop your student notebooks here</p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Select one or multiple <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200">.ipynb</code> files to evaluate</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-600" />
                    Selected Notebooks ({files.length})
                  </h3>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl bg-white border border-slate-200 shadow-xs font-medium">
                      <span className="text-slate-800 font-mono truncate max-w-md">{file.name}</span>
                      <span className="text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <div className="flex items-center text-xs font-semibold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                Auto-extracts Accuracy, Macro F1, Timing & Workflow Evidence
              </div>
              <button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="btn-3d px-8 py-3.5 flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Evidence...</span>
                  </>
                ) : (
                  <>
                    <FolderUp className="w-4 h-4" />
                    <span>Start AI Validation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-[0_8px_20px_rgba(16,185,129,0.35)] animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Validation Batch Completed!</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Directing to Leaderboard for comparative ranking analysis...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
