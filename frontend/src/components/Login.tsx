import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Hexagon, 
  Eye, 
  EyeOff, 
  HelpCircle,
  School,
  Search,
  BookOpen,
  CheckCircle2,
  X,
  FileCheck2,
  Cpu,
  Layers
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, registerStudent, registerFaculty } = useAuth();
  
  const [portalType, setPortalType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Faculty credentials
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyKey, setFacultyKey] = useState('');

  // Faculty registration credentials
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facDept, setFacDept] = useState('AIML');
  const [facTitle, setFacTitle] = useState('Faculty ML Evaluator');
  const [facPassword, setFacPassword] = useState('');

  // Student credentials (Username = Name, Password = Register Number)
  const [studentName, setStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');

  // Roster lookup helper
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterList, setRosterList] = useState<any[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [loadingRoster, setLoadingRoster] = useState(false);

  const fetchRoster = async () => {
    setLoadingRoster(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/students-roster`);
      if (res.ok) {
        const data = await res.json();
        setRosterList(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRoster(false);
    }
  };

  // Student registration credentials
  const [regName, setRegName] = useState('');
  const [regRoll, setRegRoll] = useState('');
  const [regDept, setRegDept] = useState('AIML');
  const [regSec, setRegSec] = useState('A');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const handleFacultySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = facultyKey.trim() || facultyEmail.trim();
    if (!key) {
      setErrorMessage('Please enter your Faculty Security Key or Email.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await login('FACULTY', facultyEmail.trim() || key, facultyKey.trim() || key);
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify your faculty credentials.');
    }
  };

  const handleFacultyRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim() || !facEmail.trim() || !facPassword.trim()) {
      setErrorMessage('Full Name, Email, and Password are required for faculty registration.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await registerFaculty({
      name: facName.trim(),
      email: facEmail.trim().toLowerCase(),
      department: facDept.trim(),
      title: facTitle.trim(),
      password: facPassword.trim()
    });

    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Faculty registration failed.');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMessage('Please enter your Student Username (Full Name).');
      return;
    }
    if (!studentRegNo.trim()) {
      setErrorMessage('Please enter your Password (Register Number).');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await login('STUDENT', studentName.trim(), studentRegNo.trim());
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify your Name and Register Number.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regRoll.trim()) {
      setErrorMessage('Please provide both your Full Name and Roll Number.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await registerStudent({
      name: regName.trim(),
      roll_no: regRoll.trim(),
      department: regDept.trim(),
      section: regSec.trim(),
      pin: regPassword.trim() || '1234',
      email: regEmail.trim() || `${regRoll.trim().toLowerCase()}@institution.edu`
    });

    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed. Please verify the provided details.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-canvas-3d font-sans select-none">
      {/* Top Institutional Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 shadow-[0_4px_12px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
              <Hexagon className="w-full h-full fill-white/20 stroke-white stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 tracking-tight block leading-tight">
                MODEL VALIDATOR <span className="text-blue-600">AI</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block tracking-wide">
                Academic Model Verification System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowRosterModal(true);
                if (rosterList.length === 0) fetchRoster();
              }}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Class Roster (130)</span>
              <span className="sm:hidden">Roster</span>
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Help and Login Instructions"
            >
              <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Dual Column Hero + Form */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        {/* Left Side: Professional Academic Hero */}
        <div className="w-full lg:w-1/2 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic ML Validation Platform</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Deterministic Verification for Machine Learning Pipelines
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Automated audit agent for Jupyter notebooks. Performs rigorous AST code inspection, metric extraction, and evaluation against strict faculty target baselines.
            </p>
          </div>

          {/* 3 Core Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Deterministic Scoring</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Objective rubric across 7 ML problems</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">AST Cell Audit</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Zero data leakage & code verification</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Cyclic Allocation</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">130 students pre-assigned (1 to 7 chain)</p>
            </div>
          </div>

          {/* Operational Status Badge */}
          <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700">Audit Engine Online</span>
            </div>
            <span>•</span>
            <span>130 Enrolled Students</span>
            <span>•</span>
            <span>7 Use Cases</span>
          </div>
        </div>

        {/* Right Side: High-Aesthetic Sign In Card */}
        <div className="w-full lg:w-[460px] flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200/90 rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Top Accent Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

            {/* Form Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Portal Sign In
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Authenticate to access evaluations, leaderboards, and audit records
              </p>
            </div>

            {/* Role Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setPortalType('STUDENT');
                  setIsRegistering(false);
                  setErrorMessage('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  portalType === 'STUDENT'
                    ? 'bg-white text-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPortalType('FACULTY');
                  setIsRegistering(false);
                  setErrorMessage('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  portalType === 'FACULTY'
                    ? 'bg-white text-indigo-600 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Faculty Evaluator</span>
              </button>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                  <span className="flex-1">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ================= STUDENT SIGN IN ================= */}
            {portalType === 'STUDENT' && !isRegistering && (
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span>Username (Student Name)</span>
                    <span className="text-[11px] font-normal text-slate-400">e.g. G S ABINIVAS</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Full Name as in Class Roster"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password (Register Number)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRosterModal(true);
                        if (rosterList.length === 0) fetchRoster();
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>Check Assigned Track</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="12-digit Register Number (e.g. 722824148001)"
                      value={studentRegNo}
                      onChange={(e) => setStudentRegNo(e.target.value.trim())}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Test Demo Chip for fast evaluation */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Quick Test:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentName('G S ABINIVAS');
                      setStudentRegNo('722824148001');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold hover:underline font-mono"
                  >
                    G S ABINIVAS (Roll 1)
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember credentials</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRosterModal(true);
                      if (rosterList.length === 0) fetchRoster();
                    }}
                    className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>View Roster</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Student Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= FACULTY SIGN IN ================= */}
            {portalType === 'FACULTY' && !isRegistering && (
              <form onSubmit={handleFacultySubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Institutional Email or Faculty ID
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. karunakaran@aiml.edu"
                      value={facultyEmail}
                      onChange={(e) => setFacultyEmail(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Faculty Security Key / Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter faculty security key"
                      value={facultyKey}
                      onChange={(e) => setFacultyKey(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Faculty Key Chip */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Lead Faculty:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFacultyEmail('karunakaran@aiml.edu');
                      setFacultyKey('FACULTY_2026_ML_VALIDATOR');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline font-mono"
                  >
                    Dr. Karunakaran (Autofill Key)
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Remember evaluator session</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In as Faculty Evaluator</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-3 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">
                    New faculty evaluator?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setErrorMessage('');
                      }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Register faculty profile
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ================= FACULTY REGISTRATION ================= */}
            {portalType === 'FACULTY' && isRegistering && (
              <form onSubmit={handleFacultyRegisterSubmit} className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    New Faculty Registration
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Return to Sign In
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Karunakaran"
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="faculty@institution.edu"
                    value={facEmail}
                    onChange={(e) => setFacEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Department
                    </label>
                    <select
                      value={facDept}
                      onChange={(e) => setFacDept(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium outline-none"
                    >
                      <option value="AIML">AIML</option>
                      <option value="CSE">CSE</option>
                      <option value="AIDS">AIDS</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Associate Professor"
                      value={facTitle}
                      onChange={(e) => setFacTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Account Password / Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a secure password"
                    value={facPassword}
                    onChange={(e) => setFacPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Register Faculty Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Support / Help Dropdown */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg text-xs space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    Sign In Guidelines
                  </span>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Students:</strong> Sign in with your <strong>Full Name</strong> as Username and your <strong>12-digit Register Number</strong> as Password.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Track Allocation:</strong> All 130 students have been chained cyclically across the 7 assignment tracks. View the Class Roster to see your assigned use case.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Faculty Evaluators:</strong> Sign in using your institutional email and security access key.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Searchable Roster Modal for 130 Students */}
      <AnimatePresence>
        {showRosterModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Class Roster & Assigned ML Tracks
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      130 Students allocated across 7 Use Cases
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRosterModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by student name or register number..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 outline-none transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Roster List */}
              <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-2">
                {loadingRoster ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading student roster...</span>
                  </div>
                ) : (
                  (() => {
                    const filtered = rosterList.filter(s => 
                      !rosterSearch.trim() ||
                      s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                      s.roll_no.includes(rosterSearch.trim())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No student matching "{rosterSearch}" found in roster.
                        </div>
                      );
                    }

                    return filtered.map((s) => (
                      <div 
                        key={s.roll_no}
                        className="pt-2 pb-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{s.name}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                              Sec {s.section}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span>Reg: <strong className="font-mono text-slate-700">{s.roll_no}</strong></span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">Username: <strong>{s.name}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="inline-block text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                              {s.assigned_use_case || 'Assigned Track'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentName(s.name);
                              setStudentRegNo(s.roll_no);
                              setShowRosterModal(false);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-transparent px-3 py-1 rounded-lg transition-all"
                          >
                            Autofill
                          </button>
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                Click <strong>Autofill</strong> next to your name to populate your credentials instantly.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Institutional Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white/70 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
          <div>
            Model Validator AI • Secure Academic Evaluation Platform
          </div>
          <div className="flex items-center gap-4">
            <span>Deterministic Scoring</span>
            <span>•</span>
            <span>Leakage Prevention</span>
            <span>•</span>
            <span>AST Code Verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
