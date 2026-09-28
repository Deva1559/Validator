import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, AlertCircle, Loader2, FolderUp, Check, User, GraduationCap, Hash, Layers } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const UploadProjects = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Student candidate metadata
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [sec, setSec] = useState('');
  const [rollNo, setRollNo] = useState('');

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

    if (name.trim()) formData.append('name', name.trim());
    if (dept.trim()) formData.append('dept', dept.trim());
    if (sec.trim()) formData.append('sec', sec.trim());
    if (rollNo.trim()) formData.append('roll_no', rollNo.trim());

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFiles([]);
          setName('');
          setDept('');
          setSec('');
          setRollNo('');
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
            Student Submission Portal
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Upload Student Project</h1>
        <p className="text-slate-500 text-base font-medium">Enter candidate information and submit Jupyter Notebooks (.ipynb) for validation</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-8"
      >
        {!success ? (
          <div className="space-y-8">
            {/* Student Information Fields */}
            <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Candidate Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Student Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Name
                  </label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Akash"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs transition-colors"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Dept
                  </label>
                  <input 
                    type="text"
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    placeholder="AIML"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs transition-colors"
                  />
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" /> Sec
                  </label>
                  <input 
                    type="text"
                    value={sec}
                    onChange={(e) => setSec(e.target.value)}
                    placeholder="A"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs transition-colors"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" /> Roll No
                  </label>
                  <input 
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="24AM001"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload Area */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Notebook Document Upload (.ipynb)
              </label>
              
              <div 
                className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-gradient-to-b from-slate-50/60 to-blue-50/20 rounded-2xl p-10 text-center transition-all cursor-pointer relative group shadow-inner"
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
                    <p className="text-slate-900 font-extrabold text-lg">Drop your notebook file here</p>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Select <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200">.ipynb</code> assignment file to validate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Notebooks List */}
            {files.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-600" />
                    Selected Notebook ({files.length})
                  </h3>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Remove
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

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center text-xs font-semibold text-amber-800 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                Validates Data Cleaning, Model Training, Leakage & Metrics
              </div>
              <button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="btn-3d px-8 py-3.5 flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Assignment...</span>
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
              <h2 className="text-2xl font-black text-slate-900">Project Validated Successfully!</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Directing to Leaderboard for comparative ranking analysis...</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
