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
  CheckCircle, 
  HelpCircle,
  Building,
  Hash,
  Sparkles,
  School
} from 'lucide-react';
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

  // Student credentials
  const [studentRoll, setStudentRoll] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

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
      setErrorMessage(res.error || 'Authentication failed. Please check your faculty credentials.');
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
    if (!studentRoll.trim()) {
      setErrorMessage('Please enter your Student Roll Number.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const res = await login('STUDENT', studentRoll.trim(), studentPassword.trim());
    setLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials or register below.');
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-canvas-3d font-sans select-none p-4 sm:p-6 lg:p-8">
      {/* Top Institutional Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 shadow-[0_4px_12px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
            <Hexagon className="w-full h-full fill-white/20 stroke-white stroke-[2.5]" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight block leading-tight">
              MODEL VALIDATOR <span className="text-blue-600">AI</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block tracking-wide">
              Academic Model Verification System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-white/80 transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Support</span>
          </button>
        </div>
      </header>

      {/* Main Form Center */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] p-7 sm:p-9 relative overflow-hidden"
        >
          {/* Subtle Top Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Institutional Sign In
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Select your role to access your validation portfolio and audits
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl mb-6 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setPortalType('STUDENT');
                setIsRegistering(false);
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                portalType === 'STUDENT'
                  ? 'bg-white text-blue-600 shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_#FFF]'
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
                  ? 'bg-white text-indigo-600 shadow-[0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_#FFF]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Faculty & Admin</span>
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Student Roll Number / Register ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24AM001"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password / PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelp(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:underline"
                  >
                    Need Help?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your student password or PIN"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 font-medium transition-all shadow-inner focus:shadow-sm outline-none"
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

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember my ID</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
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

              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                  First time submitting a model?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setErrorMessage('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Register student profile
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= STUDENT REGISTRATION ================= */}
          {portalType === 'STUDENT' && isRegistering && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  New Student Registration
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Return to Sign In
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24AM001"
                    value={regRoll}
                    onChange={(e) => setRegRoll(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Department
                  </label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium outline-none"
                  >
                    <option value="AIML">AIML</option>
                    <option value="CSE">CSE</option>
                    <option value="AIDS">AIDS</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Section
                  </label>
                  <select
                    value={regSec}
                    onChange={(e) => setRegSec(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Access PIN / Password
                  </label>
                  <input
                    type="password"
                    placeholder="Create a PIN"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Institutional Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="student@institution.edu"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-medium outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register & Access Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= FACULTY SIGN IN ================= */}
          {portalType === 'FACULTY' && (
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
                    placeholder="Enter your security access key"
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
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-[0_4px_14px_rgba(79,70,229,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 disabled:opacity-50"
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

        {/* Support & Institutional Assistance Modal */}
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
                  Sign In Information
                </span>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Students:</strong> Sign in using your registered college Roll Number (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">24AM001</code>). If you haven't set a custom password, the default access PIN is your roll number or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">1234</code>.
              </p>
              <p className="text-slate-600 leading-relaxed">
                <strong>Faculty & Evaluators:</strong> Use your institutional faculty security key configured by your department administrator.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Institutional Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-medium">
        <div>
          Model Validator AI · Secure Academic Evaluation Platform
        </div>
        <div className="flex items-center gap-4">
          <span>Deterministic Audit</span>
          <span>·</span>
          <span>Leakage Prevention</span>
          <span>·</span>
          <span>Cell Traceability</span>
        </div>
      </footer>
    </div>
  );
};
