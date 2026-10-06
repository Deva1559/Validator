import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  File, 
  AlertCircle, 
  Loader2, 
  FolderUp, 
  Check, 
  User, 
  GraduationCap, 
  Hash, 
  Layers, 
  Lock,
  ExternalLink,
  Copy,
  CheckCheck,
  Database,
  Target,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Sparkles,
  BarChart3,
  Sliders,
  ArrowUpRight,
  Activity,
  LineChart,
  Grid,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface DatasetTopicInfo {
  name: string;
  topic: string;
  domain: string;
  datasetName: string;
  datasetUrl: string;
  datasetSource: string;
  sampleCount: string;
  dataModality: string;
  classesOrTargets: string;
  evaluationFocus: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  baseline: {
    accuracy: number;
    macro_f1: number;
    training_time: number;
    time_comparison: string;
    student_quota: number;
  };
}

const USE_CASE_DATASETS: Record<string, DatasetTopicInfo> = {
  "Traffic Sign Recognition": {
    name: "Traffic Sign Recognition",
    topic: "German Traffic Sign Recognition Benchmark (GTSRB)",
    domain: "Autonomous Vehicles & Computer Vision",
    datasetName: "GTSRB - German Traffic Sign Benchmark",
    datasetUrl: "https://www.kaggle.com/datasets/meowmeowmeowmeowmeow/gtsrb-german-traffic-sign",
    datasetSource: "Kaggle / INI Benchmark",
    sampleCount: "51,839 Images",
    dataModality: "RGB Images (32×32 to 250×250 px)",
    classesOrTargets: "43 Road Sign Classes",
    evaluationFocus: "Data normalization, spatial transformations, robust CNN classification",
    description: "Autonomous vision classification of road signs and regulatory symbols under diverse illumination, physical degradation, and motion blur.",
    color: "from-blue-600 to-indigo-600",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "text-blue-600",
    borderAccent: "border-blue-200",
    baseline: { accuracy: 88.0, macro_f1: 85.0, training_time: 45.0, time_comparison: "lower", student_quota: 19 }
  },
  "Crop Leaf Disease Classification": {
    name: "Crop Leaf Disease Classification",
    topic: "PlantVillage Foliar Pathology & Crop Health Diagnosis",
    domain: "Agricultural AI & Plant Pathology",
    datasetName: "PlantVillage Crop Disease Dataset",
    datasetUrl: "https://www.kaggle.com/datasets/emmarex/plantdisease",
    datasetSource: "Kaggle / PlantVillage",
    sampleCount: "54,303 Images",
    dataModality: "Color Foliar Photographs (256×256 px)",
    classesOrTargets: "38 Pathology Classes (14 Crop Species)",
    evaluationFocus: "Fine-grained lesion discrimination, class imbalance mitigation, test-split hygiene",
    description: "Agricultural AI diagnostic pipeline for early foliar pathology identification across bacterial, fungal, and viral infections in commercial crops.",
    color: "from-emerald-600 to-teal-600",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-600",
    borderAccent: "border-emerald-200",
    baseline: { accuracy: 86.0, macro_f1: 82.0, training_time: 60.0, time_comparison: "lower", student_quota: 19 }
  },
  "Face Mask Detection": {
    name: "Face Mask Detection",
    topic: "Real-Time Facial Occlusion & Public Health Compliance",
    domain: "Biometrics, Surveillance & Public Safety",
    datasetName: "Face Mask Detection with Annotations (PASCAL VOC)",
    datasetUrl: "https://www.kaggle.com/datasets/andrewmvd/face-mask-detection",
    datasetSource: "Kaggle / AI Commons",
    sampleCount: "853 Annotated Images (12,000+ Faces)",
    dataModality: "Multi-subject Scenes with Bounding Box XML Annotations",
    classesOrTargets: "3 Classes (With Mask, Without Mask, Mask Worn Incorrectly)",
    evaluationFocus: "Bounding box localization, occlusion tolerance, false-alarm reduction",
    description: "Real-time facial occlusion audit for public health compliance verification distinguishing properly positioned masks from improper or missing masks.",
    color: "from-cyan-600 to-blue-600",
    badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
    badgeText: "text-cyan-600",
    borderAccent: "border-cyan-200",
    baseline: { accuracy: 90.0, macro_f1: 88.0, training_time: 30.0, time_comparison: "lower", student_quota: 19 }
  },
  "Pet Image Segmentation": {
    name: "Pet Image Segmentation",
    topic: "Oxford-IIIT Pet Semantic Contour & Trimap Segmentation",
    domain: "Semantic Segmentation & Animal Morphology",
    datasetName: "The Oxford-IIIT Pet Dataset (Trimap Masks)",
    datasetUrl: "https://www.kaggle.com/datasets/tanlikesmath/the-oxfordiiit-pet-dataset",
    datasetSource: "Kaggle / Oxford VGG",
    sampleCount: "7,349 Images",
    dataModality: "Natural Color Photos + 1-channel Pixel Trimap Masks",
    classesOrTargets: "37 Breeds (Foreground, Background, Boundary Trimap)",
    evaluationFocus: "Pixel-level semantic contour masks, Dice/IoU loss optimization, boundary precision",
    description: "Pixel-level semantic contour mask extraction for animal morphology separating pet boundaries from complex household backgrounds.",
    color: "from-purple-600 to-indigo-600",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "text-purple-600",
    borderAccent: "border-purple-200",
    baseline: { accuracy: 82.0, macro_f1: 78.0, training_time: 90.0, time_comparison: "lower", student_quota: 19 }
  },
  "Image Generation with GANs": {
    name: "Image Generation with GANs",
    topic: "CelebFaces Attributes (CelebA) Generative Modeling",
    domain: "Generative AI & Latent Space Synthesis",
    datasetName: "CelebFaces Attributes (CelebA) Dataset",
    datasetUrl: "https://www.kaggle.com/datasets/jessicali9530/celeba-dataset",
    datasetSource: "Kaggle / MMLab CUHK",
    sampleCount: "202,599 Facial Images",
    dataModality: "Aligned & Cropped Color Portraits (178×218 px)",
    classesOrTargets: "40 Binary Facial Attribute Annotations",
    evaluationFocus: "Adversarial distribution synthesis, mode collapse avoidance, discriminator calibration",
    description: "Generative adversarial distribution synthesis with fidelity metrics, evaluating generator-discriminator equilibrium on facial distributions.",
    color: "from-pink-600 to-rose-600",
    badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
    badgeText: "text-pink-600",
    borderAccent: "border-pink-200",
    baseline: { accuracy: 80.0, macro_f1: 75.0, training_time: 120.0, time_comparison: "lower", student_quota: 18 }
  },
  "Image Captioning": {
    name: "Image Captioning",
    topic: "Flickr8k Multimodal Vision-Language Alignment",
    domain: "Multimodal Deep Learning & Natural Language Synthesis",
    datasetName: "Flickr8k Image Captioning Benchmark",
    datasetUrl: "https://www.kaggle.com/datasets/adityajn105/flickr8k",
    datasetSource: "Kaggle / UIUC",
    sampleCount: "8,092 Images (40,460 Captions)",
    dataModality: "High-resolution Photography + 5 Text Captions / Image",
    classesOrTargets: "~8,500 Unique Word Vocabulary Corpus",
    evaluationFocus: "Encoder-decoder attention, sequence decoding beam search, BLEU score calibration",
    description: "Multimodal vision-language synthesis bridging visual feature representations with natural language sequential generation.",
    color: "from-amber-600 to-orange-600",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "text-amber-600",
    borderAccent: "border-amber-200",
    baseline: { accuracy: 82.0, macro_f1: 78.0, training_time: 100.0, time_comparison: "lower", student_quota: 18 }
  },
  "Pneumonia Detection from Chest X-Rays": {
    name: "Pneumonia Detection from Chest X-Rays",
    topic: "Pediatric Radiographic Screening & Pulmonary Opacity",
    domain: "Healthcare AI & Clinical Radiology",
    datasetName: "Chest X-Ray Images (Pneumonia) Radiograph Dataset",
    datasetUrl: "https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia",
    datasetSource: "Kaggle / UCSD & Guangzhou Medical",
    sampleCount: "5,863 Verified X-Ray Scans",
    dataModality: "Anterior-Posterior Grayscale Chest Radiographs (JPEG)",
    classesOrTargets: "2 Primary Classes (Normal vs. Pneumonia Bacterial/Viral)",
    evaluationFocus: "Clinical sensitivity / recall, ROC-AUC calibration, false-negative prevention",
    description: "High-stakes clinical radiographic screening with stringent false-negative penalties, distinguishing normal pulmonary fields from consolidation opacities.",
    color: "from-rose-600 to-red-600",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-600",
    borderAccent: "border-rose-200",
    baseline: { accuracy: 92.0, macro_f1: 90.0, training_time: 50.0, time_comparison: "lower", student_quota: 18 }
  }
};

export const UploadProjects = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const { user, isStudent } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Student candidate metadata
  const [name, setName] = useState(user?.name || '');
  const [dept, setDept] = useState(user?.department || 'AIML');
  const [sec, setSec] = useState(user?.section || 'A');
  const [rollNo, setRollNo] = useState(user?.roll_no || '');
  const [useCase, setUseCase] = useState('Traffic Sign Recognition');

  // Live Track Stats and Clipboard State
  const [trackStats, setTrackStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const USE_CASE_OPTIONS = [
    { name: "Traffic Sign Recognition", desc: "Autonomous vision classification of road signs" },
    { name: "Crop Leaf Disease Classification", desc: "Foliar pathology identification" },
    { name: "Face Mask Detection", desc: "Facial occlusion audit for public health compliance" },
    { name: "Pet Image Segmentation", desc: "Pixel-level semantic contour masks" },
    { name: "Image Generation with GANs", desc: "Adversarial distribution synthesis" },
    { name: "Image Captioning", desc: "Multimodal vision-language synthesis" },
    { name: "Pneumonia Detection from Chest X-Rays", desc: "Clinical radiographic screening" },
  ];

  useEffect(() => {
    if (isStudent && user) {
      if (user.name) setName(user.name);
      if (user.department) setDept(user.department);
      if (user.section) setSec(user.section);
      if (user.roll_no) setRollNo(user.roll_no);
      if (user.assigned_use_case) setUseCase(user.assigned_use_case);
    }
  }, [user, isStudent]);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setTrackStats(data);
        }
      } catch (err) {
        console.error("Failed to load live dashboard stats for use case:", err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };
    fetchLiveStats();
    return () => { isMounted = false; };
  }, []);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  // Resolve dataset metadata and live metrics for the selected/assigned usecase
  const currentDataset = USE_CASE_DATASETS[useCase] || USE_CASE_DATASETS["Traffic Sign Recognition"];
  const currentLiveUc = trackStats?.use_cases?.find(
    (u: any) => u.name?.toLowerCase() === useCase.toLowerCase()
  );

  const quota = currentLiveUc?.student_quota || currentDataset.baseline.student_quota || 19;
  const submissions = currentLiveUc?.total_submissions || 0;
  const quotaPercent = Math.min(100, Math.round((submissions / quota) * 100));
  const passRate = currentLiveUc?.validation_success_rate ?? 0;
  const avgAccuracy = currentLiveUc?.avg_accuracy ?? 0;
  const avgMacroF1 = currentLiveUc?.avg_macro_f1 ?? 0;
  const avgTrainingTime = currentLiveUc?.avg_training_time ?? 0;
  const slotsLeft = Math.max(0, quota - submissions);

  const targetAcc = currentLiveUc?.baseline?.accuracy ?? currentDataset.baseline.accuracy;
  const targetF1 = currentLiveUc?.baseline?.macro_f1 ?? currentDataset.baseline.macro_f1;
  const targetTime = currentLiveUc?.baseline?.training_time ?? currentDataset.baseline.training_time;

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
    formData.append('use_case', useCase);

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

              {/* Use Case Track Selector (Chained 1 to 7 across 130 students) */}
              <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> Machine Learning Use Case Track
                  </label>
                  {user?.assigned_use_case ? (
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Pre-Assigned by Roll Chain
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                      18-19 Students Quota
                    </span>
                  )}
                </div>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs transition-colors"
                >
                  {USE_CASE_OPTIONS.map((opt, idx) => (
                    <option key={opt.name} value={opt.name}>
                      {idx + 1}. {opt.name} {user?.assigned_use_case === opt.name ? '(Assigned Track)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 font-medium">
                  {user?.assigned_use_case 
                    ? `Your roll number is chained to Track: "${user.assigned_use_case}". Ensure your notebook matches this track.`
                    : "Select which of the 7 official assignment tracks this notebook submission addresses."}
                </p>

                {/* ASSIGNED USE CASE DATASET TOPIC, DIRECT LINK & DASHBOARD METRICS */}
                <motion.div 
                  key={useCase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 pt-4 border-t border-slate-200/80 space-y-4"
                >
                  {/* Header Banner: Dataset Topic & Assignment Profile */}
                  <div className="bg-gradient-to-br from-white to-slate-50/90 rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${currentDataset.badgeBg} flex items-center gap-1.5`}>
                            <Sparkles className="w-3 h-3" />
                            Track #{USE_CASE_OPTIONS.findIndex(o => o.name === useCase) + 1} Dataset Topic
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {currentDataset.domain}
                          </span>
                          {isStudent && user?.assigned_use_case === useCase && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Assigned to {user?.name || 'You'} ({user?.roll_no || ''})
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <Database className={`w-5 h-5 ${currentDataset.badgeText}`} />
                          {currentDataset.topic}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-medium">
                          {currentDataset.description}
                        </p>
                      </div>

                      {/* Dataset Link Action Buttons */}
                      <div className="flex flex-wrap sm:flex-col items-stretch gap-2 shrink-0 w-full sm:w-auto">
                        <a 
                          href={currentDataset.datasetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          id={`dataset-link-${useCase.toLowerCase().replace(/\s+/g, '-')}`}
                          className="btn-3d px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Dataset on Kaggle</span>
                          <ArrowUpRight className="w-3 h-3 opacity-70" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(currentDataset.datasetUrl)}
                          className="btn-3d-secondary px-3 py-1.5 text-[11px] font-bold flex items-center justify-center gap-1.5"
                          title="Copy direct dataset download URL"
                        >
                          {copiedUrl ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Dataset URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 4 Technical Specs Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <Database className="w-3 h-3 text-blue-500" /> Total Samples
                        </div>
                        <div className="text-xs font-black text-slate-800 mt-1 font-mono">
                          {currentDataset.sampleCount}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <Layers className="w-3 h-3 text-indigo-500" /> Data Modality
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={currentDataset.dataModality}>
                          {currentDataset.dataModality}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <Tag className="w-3 h-3 text-amber-500" /> Target / Classes
                        </div>
                        <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={currentDataset.classesOrTargets}>
                          {currentDataset.classesOrTargets}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Source Repository
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-1 truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          {currentDataset.datasetSource}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ASSIGNED TASK DASHBOARD METRICS */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 px-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Assigned Task Dashboard Metrics
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                          Task #{USE_CASE_OPTIONS.findIndex(o => o.name === useCase) + 1}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Evaluation metrics specific to <strong className="text-slate-800">{useCase}</strong>
                      </span>
                    </div>

                    {/* RENDER SPECIFIC METRICS BASED ON THE 7 ASSIGNED USE CASES */}
                    {(() => {
                      switch (useCase) {
                        case "Traffic Sign Recognition":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: Accuracy */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • Accuracy
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgAccuracy > 0 ? `${avgAccuracy}%` : `≥ ${targetAcc}%`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Baseline Target:</span>
                                    <span className="text-purple-700 font-mono">≥ {targetAcc}% (40% Wt)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Multi-class classification accuracy across all 43 road sign categories.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: Macro-F1 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • Macro-F1
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgMacroF1 > 0 ? `${avgMacroF1}%` : `≥ ${targetF1}%`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Baseline Target:</span>
                                    <span className="text-amber-700 font-mono">≥ {targetF1}% (40% Wt)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Unweighted mean F1 to prevent majority class bias over rare danger warnings.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Training Time */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Training Time
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgTrainingTime > 0 ? `${avgTrainingTime}s` : `≤ ${targetTime}s`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Latency Budget:</span>
                                    <span className="text-blue-700 font-mono">≤ {targetTime}s (20% Wt)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Deterministic pipeline runtime budget ensuring computational efficiency.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );

                        case "Crop Leaf Disease Classification":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: Accuracy */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • Accuracy
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgAccuracy > 0 ? `${avgAccuracy}%` : `≥ ${targetAcc}%`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Baseline Target:</span>
                                    <span className="text-emerald-700 font-mono">≥ {targetAcc}%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Classification accuracy across 38 crop foliar pathology conditions.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: Macro-F1 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • Macro-F1
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgMacroF1 > 0 ? `${avgMacroF1}%` : `≥ ${targetF1}%`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Baseline Target:</span>
                                    <span className="text-teal-700 font-mono">≥ {targetF1}%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Protects detection of scarce fungal lesions from majority healthy samples.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Confusion Matrix */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Confusion Matrix
                                    </span>
                                    <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                      Diagonal Dominant (&gt;88%)
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center">
                                    <Grid className="w-4 h-4" />
                                  </div>
                                </div>
                                
                                {/* Mini Heatmap Visualization */}
                                <div className="my-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-[9px] font-bold text-slate-400 mb-1 text-center uppercase tracking-wider">
                                    38-Class Foliar Error Matrix Sample
                                  </div>
                                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center font-bold">
                                    <div className="bg-emerald-500 text-white rounded p-1 shadow-2xs">96%</div>
                                    <div className="bg-slate-200 text-slate-600 rounded p-1">2%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">1%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">1%</div>
                                    
                                    <div className="bg-slate-200 text-slate-600 rounded p-1">3%</div>
                                    <div className="bg-emerald-500 text-white rounded p-1 shadow-2xs">94%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">2%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">1%</div>

                                    <div className="bg-slate-100 text-slate-400 rounded p-1">1%</div>
                                    <div className="bg-slate-200 text-slate-600 rounded p-1">2%</div>
                                    <div className="bg-emerald-500 text-white rounded p-1 shadow-2xs">95%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">2%</div>

                                    <div className="bg-slate-100 text-slate-400 rounded p-1">0%</div>
                                    <div className="bg-slate-100 text-slate-400 rounded p-1">1%</div>
                                    <div className="bg-slate-200 text-slate-600 rounded p-1">1%</div>
                                    <div className="bg-emerald-600 text-white rounded p-1 shadow-2xs">98%</div>
                                  </div>
                                </div>

                                <div className="pt-1 text-[10px] text-slate-400 leading-tight">
                                  Verifies minimal inter-class confusion between bacterial spot & early blight.
                                </div>
                              </div>
                            </div>
                          );

                        case "Face Mask Detection":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: mAP@0.5 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • mAP@0.5
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 88.5%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">IoU Threshold:</span>
                                    <span className="text-cyan-700 font-mono">IoU ≥ 0.50</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Mean Average Precision evaluating bounding box localization across face occlusions.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: Precision */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • Precision
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 89.0%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">False Alarm Check:</span>
                                    <span className="text-blue-700 font-mono">Low False-Positive</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Suppresses false alarms when scarves, hands, or facial hair obscure faces.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Recall */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Recall
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 91.5%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Compliance Audit:</span>
                                    <span className="text-indigo-700 font-mono">High Sensitivity</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Ensures individuals without masks or with nose exposed are strictly detected.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );

                        case "Pet Image Segmentation":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: Dice */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • Dice Coefficient
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 82.0%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Sørensen–Dice:</span>
                                    <span className="text-purple-700 font-mono">Contour F1 ≥ 82%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Harmonic mean of pixel precision and recall along intricate animal fur contours.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: IoU */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • IoU (Jaccard)
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 78.5%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                                    <Layers className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Mean IoU:</span>
                                    <span className="text-indigo-700 font-mono">Overlap ≥ 78.5%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Intersection-over-union benchmark across foreground, background, and boundary trimaps.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Pixel Accuracy */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Pixel Accuracy
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 91.0%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Pixel Trimap Acc:</span>
                                    <span className="text-blue-700 font-mono">≥ 91% Matching</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Total percentage of correctly labeled pixels across image height × width.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );

                        case "Image Generation with GANs":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: Generator & Discriminator Loss Curves */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-pink-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • G & D Loss Curves
                                    </span>
                                    <div className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                                      <span className="text-pink-600 font-mono text-sm">G: ~1.28</span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-purple-600 font-mono text-sm">D: ~0.62</span>
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center">
                                    <LineChart className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Sparkline curve visualization */}
                                <div className="my-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                                    <span className="text-pink-600 font-mono">Generator Loss (Blue)</span>
                                    <span className="text-purple-600 font-mono">Discriminator (Violet)</span>
                                  </div>
                                  <svg className="w-full h-10 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                                    {/* Grid baseline */}
                                    <line x1="0" y1="15" x2="100" y2="15" stroke="#E2E8F0" strokeDasharray="2,2" strokeWidth="0.8" />
                                    {/* Generator curve */}
                                    <path 
                                      d="M0,25 Q20,18 40,20 T70,12 T100,14" 
                                      fill="none" 
                                      stroke="#DB2777" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                    />
                                    {/* Discriminator curve */}
                                    <path 
                                      d="M0,5 Q20,10 40,8 T70,16 T100,15" 
                                      fill="none" 
                                      stroke="#7C3AED" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                    />
                                  </svg>
                                </div>

                                <div className="text-[10px] text-slate-400 leading-tight">
                                  Verifies minimax convergence without discriminator overpowering or mode collapse.
                                </div>
                              </div>

                              {/* Metric 2: FID on a small sample */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • FID on Small Sample
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
                                      ≤ 32.0 <span className="text-xs font-semibold text-slate-400 font-mono">(Lower is better)</span>
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Fréchet Distance:</span>
                                    <span className="text-rose-700 font-mono">FID ≤ 32.0 (Target)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Evaluates distance between feature representations of generated vs real CelebA images.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Sample-Image Grid */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Sample-Image Grid
                                    </span>
                                    <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                      Verified 4×4 Synthesis Grid
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                    <Grid className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Sample-image grid preview */}
                                <div className="my-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                                  <div className="text-[9px] font-bold text-slate-400 mb-1 text-center uppercase tracking-wider">
                                    Checkpointed Output Diversity
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <div className="aspect-square rounded-lg bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 flex items-center justify-center text-[9px] font-mono text-white font-bold shadow-2xs">
                                      G-1
                                    </div>
                                    <div className="aspect-square rounded-lg bg-gradient-to-tr from-purple-400 via-indigo-300 to-cyan-200 flex items-center justify-center text-[9px] font-mono text-white font-bold shadow-2xs">
                                      G-2
                                    </div>
                                    <div className="aspect-square rounded-lg bg-gradient-to-tr from-teal-400 via-emerald-300 to-lime-200 flex items-center justify-center text-[9px] font-mono text-white font-bold shadow-2xs">
                                      G-3
                                    </div>
                                    <div className="aspect-square rounded-lg bg-gradient-to-tr from-amber-400 via-orange-300 to-rose-200 flex items-center justify-center text-[9px] font-mono text-white font-bold shadow-2xs">
                                      G-4
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[10px] text-slate-400 leading-tight">
                                  Audits image fidelity, absence of severe artifacts, and latent diversity.
                                </div>
                              </div>
                            </div>
                          );

                        case "Image Captioning":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: BLEU-1 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • BLEU-1
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 64.5%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                                    <Activity className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Unigram Precision:</span>
                                    <span className="text-amber-700 font-mono">≥ 64.5% (BLEU-1)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Proportion of single word tokens matching human ground-truth caption vocabulary.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: BLEU-4 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • BLEU-4
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 28.0%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">4-Gram Fluency:</span>
                                    <span className="text-orange-700 font-mono">≥ 28.0% (BLEU-4)</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Validates syntactic grammatical coherence and natural descriptive sequence flow.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: Sample Captions */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-yellow-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • Sample Captions
                                    </span>
                                    <div className="text-sm font-black text-slate-900 mt-1 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                      Multimodal Match Checked
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 border border-yellow-200 flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* Sample caption box */}
                                <div className="my-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                                  <div className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider">
                                    Generated Caption:
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-800 italic leading-snug">
                                    "A brown dog running through green grass chasing a tennis ball."
                                  </p>
                                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                                    <span>CIDEr: 1.14</span>
                                    <span>•</span>
                                    <span>Meteor: 0.32</span>
                                  </div>
                                </div>

                                <div className="text-[10px] text-slate-400 leading-tight">
                                  Audits semantic alignment between visual attention weights and output word tokens.
                                </div>
                              </div>
                            </div>
                          );

                        case "Pneumonia Detection from Chest X-Rays":
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* Metric 1: Recall */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 01 • Recall (Sensitivity)
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 94.0%
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                                    <ShieldAlert className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Critical Priority:</span>
                                    <span className="text-rose-700 font-mono">Sensitivity ≥ 94%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Clinical screening priority: strictly penalizes false negative pneumonia omissions.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 2: AUC */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-red-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 02 • ROC-AUC
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      ≥ 0.93
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                                    <Target className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Separation Metric:</span>
                                    <span className="text-red-700 font-mono">AUC ≥ 0.93</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Area under the ROC curve measuring discrimination capability across clinical thresholds.
                                  </p>
                                </div>
                              </div>

                              {/* Metric 3: F1 */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                      Metric 03 • F1-Score
                                    </span>
                                    <div className="text-2xl font-black text-slate-900 mt-1">
                                      {avgMacroF1 > 0 ? `${avgMacroF1}%` : `≥ 90.0%`}
                                    </div>
                                  </div>
                                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-slate-500">Diagnostic Balance:</span>
                                    <span className="text-orange-700 font-mono">F1 ≥ 90.0%</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight">
                                    Harmonic balance maintaining high screening precision alongside maximum recall.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );

                        default:
                          return null;
                      }
                    })()}

                    {/* Benchmark Targets & Code Policy Bar */}
                    <div className="bg-slate-100/90 rounded-xl px-4 py-2.5 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                      <div className="flex items-center gap-2 font-bold">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Validation Preconditions:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 font-semibold text-[11px]">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-slate-900">
                          Quota: <strong className="text-blue-600">{submissions}/{quota} Students</strong>
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                          Split Precedence: train_test_split &lt; fit()
                        </span>
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                          Zero Data Leakage Rule
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
