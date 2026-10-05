import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, CheckCircle2, AlertTriangle, RefreshCw, FileCode } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const ValidationQueue = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    setRefreshing(true);
    fetch(`${API_BASE_URL}/api/validations/all`)
      .then(res => res.json())
      .then(data => setData(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
              Execution Monitoring
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Validation Queue</h1>
          <p className="text-slate-500 text-base font-medium">Execution logs, verification timestamps, and cohort pipeline tracking</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={refreshing}
          className="btn-3d-secondary px-4 py-2.5 flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          Refresh Queue
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-7 space-y-6"
      >
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-600" />
            Processed Validation Tasks ({data.length})
          </h2>
          <span className="text-xs font-semibold text-slate-400">Deterministic Evidence Store</span>
        </div>
        
        {loading ? (
          <div className="text-center text-slate-400 py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <div className="font-semibold text-slate-600">Loading task queue...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center text-slate-400 py-12 font-medium">No tasks recorded in queue. Upload notebooks to begin.</div>
            ) : (
              data.map((item, idx) => (
                <div key={item.id || idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-sm shadow-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-slate-900 font-extrabold text-sm">{item.student_name}</h3>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Run #{item.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <FileCode className="w-3.5 h-3.5 text-slate-400" />
                        {item.filename}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</p>
                      <p className="text-sm font-black text-slate-900">{item.final_score} / 100</p>
                    </div>

                    <div>
                      <span className="flex items-center text-blue-700 text-xs gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full font-bold shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" /> Reviewed
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
