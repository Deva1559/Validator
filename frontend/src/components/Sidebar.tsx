import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ListChecks, 
  Users, 
  ListOrdered, 
  Sliders, 
  FileText, 
  LogOut, 
  Hexagon, 
  GraduationCap, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-[0_4px_14px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] translate-y-[-1px]' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-medium active:translate-y-[1px]'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]' : 'text-slate-500'}`} />
    <span>{label}</span>
  </button>
);

export const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { user, isFaculty, isStudent, logout } = useAuth();

  return (
    <div className="w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/90 flex flex-col justify-between shadow-[4px_0_20px_rgba(15,23,42,0.03)] z-30">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 shadow-[0_6px_16px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center text-white transform -rotate-3 hover:rotate-0 transition-transform">
            <Hexagon className="w-full h-full fill-white/20 stroke-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">MODEL</h1>
            <h1 className="text-sm font-extrabold text-blue-600 tracking-wider leading-tight mt-0.5">VALIDATOR AI</h1>
          </div>
        </div>

        {/* Navigation - Tailored by Role */}
        <nav className="p-4 space-y-1.5">
          {isFaculty ? (
            <>
              <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
              <NavItem icon={ListChecks} label="Validation Queue" active={activeTab === 'Validation Queue'} onClick={() => setActiveTab('Validation Queue')} />
              <NavItem icon={Users} label="Student Directory" active={activeTab === 'Students'} onClick={() => setActiveTab('Students')} />
              <NavItem icon={ListOrdered} label="Leaderboard" active={activeTab === 'Leaderboard'} onClick={() => setActiveTab('Leaderboard')} />
              <NavItem icon={Sliders} label="Baselines" active={activeTab === 'Baselines'} onClick={() => setActiveTab('Baselines')} />
              <NavItem icon={FileText} label="Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
              <NavItem icon={ShieldCheck} label="Test Center" active={activeTab === 'Test Center'} onClick={() => setActiveTab('Test Center')} />
            </>
          ) : (
            <>
              <NavItem icon={LayoutDashboard} label="My Overview" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
              <NavItem icon={UploadCloud} label="Upload Notebook" active={activeTab === 'Upload Projects'} onClick={() => setActiveTab('Upload Projects')} />
              <NavItem icon={ListOrdered} label="Class Leaderboard" active={activeTab === 'Leaderboard'} onClick={() => setActiveTab('Leaderboard')} />
              <NavItem icon={FileText} label="My Audit Report" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
              <NavItem icon={Users} label="Student Directory" active={activeTab === 'Students'} onClick={() => setActiveTab('Students')} />
            </>
          )}
        </nav>
      </div>
      
      {/* 3D User Card with Real Session State */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_#FFF] mb-2">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-[0_3px_8px_rgba(37,99,235,0.3)] ${
              isFaculty 
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' 
                : 'bg-gradient-to-tr from-blue-500 to-indigo-600'
            }`}>
              {isFaculty ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user?.name || (isFaculty ? 'Dr. Karunakaran' : 'Student')}
              </p>
              <p className="text-xs text-slate-400 font-medium truncate">
                {isFaculty ? (user?.title || 'Faculty Lead') : `${user?.department || 'AIML'} · Sec ${user?.section || 'A'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-100 text-slate-500">
            <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {isFaculty ? 'FACULTY' : (user?.roll_no || '24AM001')}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold ${
              isFaculty ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              Active
            </span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session / Switch User</span>
        </button>
      </div>
    </div>
  );
};
