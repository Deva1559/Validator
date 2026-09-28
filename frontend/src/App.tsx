import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BaselineConfig } from './components/BaselineConfig';
import { UploadProjects } from './components/UploadProjects';
import { Leaderboard } from './components/Leaderboard';
import { ValidationQueue } from './components/ValidationQueue';
import { Students } from './components/Students';
import { Reports } from './components/Reports';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans select-none">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 bg-canvas-3d custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'Dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'Upload Projects' && <UploadProjects setActiveTab={setActiveTab} />}
          {activeTab === 'Leaderboard' && <Leaderboard />}
          {activeTab === 'Baselines' && <BaselineConfig />}
          {activeTab === 'Validation Queue' && <ValidationQueue />}
          {activeTab === 'Students' && <Students />}
          {activeTab === 'Reports' && <Reports />}
          
          {!['Dashboard', 'Upload Projects', 'Leaderboard', 'Baselines', 'Validation Queue', 'Students', 'Reports'].includes(activeTab) && (
            <div className="flex items-center justify-center h-full text-slate-400">
              {activeTab} Content (Coming Soon)
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
