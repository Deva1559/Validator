import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BaselineConfig } from './components/BaselineConfig';
import { UploadProjects } from './components/UploadProjects';
import { Leaderboard } from './components/Leaderboard';
import { ValidationQueue } from './components/ValidationQueue';
import { Students } from './components/Students';
import { Reports } from './components/Reports';
import { TestCenter } from './components/TestCenter';
import { Login } from './components/Login';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  // Restrict faculty-only administrative views for students, and student-only upload for faculty
  const safeTab = (isStudent && (activeTab === 'Baselines' || activeTab === 'Validation Queue' || activeTab === 'Test Center'))
    ? 'Dashboard'
    : (!isStudent && activeTab === 'Upload Projects')
    ? 'Dashboard'
    : activeTab;

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      <Sidebar activeTab={safeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-canvas-3d custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {safeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {safeTab === 'Upload Projects' && <UploadProjects setActiveTab={setActiveTab} />}
          {safeTab === 'Leaderboard' && <Leaderboard />}
          {safeTab === 'Baselines' && <BaselineConfig />}
          {safeTab === 'Validation Queue' && <ValidationQueue />}
          {safeTab === 'Students' && <Students />}
          {safeTab === 'Reports' && <Reports />}
          {safeTab === 'Test Center' && <TestCenter />}
          
          {!['Dashboard', 'Upload Projects', 'Leaderboard', 'Baselines', 'Validation Queue', 'Students', 'Reports', 'Test Center'].includes(safeTab) && (
            <div className="flex items-center justify-center h-full text-slate-400">
              {safeTab} Content
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
