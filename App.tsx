
import React, { useState, useCallback, useRef } from 'react';
import { ResearchForm } from './components/ResearchForm';
import { ResultsTable } from './components/ResultsTable';
import { GeminiResearchService } from './services/geminiService';
import { FacultyMember, ResearchQuery, GroundingSource } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<FacultyMember[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);

  const progressInterval = useRef<number | null>(null);

  const stages = [
    "Menyiapkan Mesin Pencari Google...",
    "Menelusuri Direktori Sekolah & Universitas...",
    "Mengekstrak Kontak Email & Posisi Guru...",
    "Menganalisis Rentang Gaji Regional...",
    "Membuat Draft Dokumen Paystub...",
    "Melakukan Verifikasi Alamat...",
    "Memfinalisasi Laporan Riset..."
  ];

  const startProgress = () => {
    setProgress(0);
    setStatusMessage(stages[0]);
    let currentProgress = 0;
    let stageIndex = 0;
    progressInterval.current = window.setInterval(() => {
      if (currentProgress < 30) currentProgress += Math.random() * 5;
      else if (currentProgress < 70) currentProgress += Math.random() * 2;
      else if (currentProgress < 95) currentProgress += Math.random() * 0.5;
      setProgress(Math.floor(currentProgress));
      const newStageIndex = Math.min(Math.floor((currentProgress / 100) * stages.length), stages.length - 1);
      if (newStageIndex !== stageIndex) {
        stageIndex = newStageIndex;
        setStatusMessage(stages[stageIndex]);
      }
    }, 400);
  };

  const completeProgress = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgress(100);
    setStatusMessage("Riset Selesai!");
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);
  };

  const handleSearch = useCallback(async (query: ResearchQuery) => {
    setLoading(true);
    setError(null);
    setIsQuotaError(false);
    startProgress();
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await window.aistudio.openSelectKey();
      const service = new GeminiResearchService();
      const { data, sources } = await service.researchSchools(query);
      setResults(prev => [...data, ...prev]);
      const formattedSources = (sources || []).map((s: any) => ({
        title: s.web?.title || 'External Source',
        uri: s.web?.uri || '#'
      }));
      setSources(formattedSources);
      completeProgress();
    } catch (err: any) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setLoading(false);
      const msg = err.message || 'Terjadi kesalahan saat melakukan riset.';
      if (msg.includes("Requested entity was not found")) {
        setError("Sesi API Key tidak valid. Silakan pilih kembali API Key Anda.");
        await window.aistudio.openSelectKey();
        return;
      }
      setError(msg);
      if (msg.includes("QUOTA_EXCEEDED") || err.status === 429) setIsQuotaError(true);
    }
  }, []);

  const handleExport = () => {
    if (results.length === 0) return;
    const headers = ['Name', 'Position', 'Email', 'School', 'Address', 'Level', 'Salary Estimate'];
    const csvContent = [
      headers.join(','),
      ...results.map(r => [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.position.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.schoolName.replace(/"/g, '""')}"`,
        `"${r.schoolAddress.replace(/"/g, '""')}"`,
        `"${r.level}"`,
        `"${r.salaryEstimate}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `riset_guru_us_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleExportText = () => {
    if (results.length === 0) return;
    let textContent = `LAPORAN RISET GURU & GAJI US\n`;
    textContent += `Total Entri: ${results.length}\n==================================================\n\n`;
    results.forEach((r, index) => {
      textContent += `[${index + 1}] DATA GURU / STAF\n`;
      textContent += `Nama      : ${r.name}\nPosisi    : ${r.position}\nEmail     : ${r.email}\nSekolah   : ${r.schoolName}\nAlamat    : ${r.schoolAddress}\nEstimasi Gaji: ${r.salaryEstimate}\n--------------------------------------------------\n\n`;
    });
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `riset_guru_us_${new Date().getTime()}.txt`;
    link.click();
  };

  const handleExportJson = () => {
    if (results.length === 0) return;
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `riset_guru_us_${new Date().getTime()}.json`;
    link.click();
  };

  const clearResults = () => {
    if (confirm('Hapus semua data hasil riset?')) {
      setResults([]);
      setSources([]);
      setError(null);
    }
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    setError(null);
    setIsQuotaError(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">E</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">EduScout US</h1>
              <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest leading-none">Portal Peneliti Gaji</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleSelectKey} className="text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 px-3 py-1.5 rounded-full transition-colors">Ganti API Key</button>
            <span className="hidden sm:flex text-sm font-medium text-slate-500 items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Gemini AI Aktif
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900">Riset Data Guru & Paystub US</h2>
            <p className="text-slate-600 text-lg">Eksplorasi hierarki sekolah US dan buat dokumen paystub instan berbasis data riset.</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Multiformat Export
            </h3>
            <p className="text-[10px] text-rose-800 leading-relaxed font-medium">
              Sistem ini mengekstrak profil guru dan memungkinkan Anda untuk mengunduh laporan dalam format CSV, JSON, TXT, PDF, atau JPG.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative">
              <ResearchForm onSearch={handleSearch} isLoading={loading} />
            </div>
          </div>

          {loading && (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
              <div className="flex justify-between items-end mb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 italic">
                    <svg className="animate-spin h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {statusMessage}
                  </h4>
                </div>
                <div className="text-right"><span className="text-2xl font-black text-indigo-600">{progress}%</span></div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 p-0.5">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className={`p-6 border rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${isQuotaError ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <p className="font-bold text-lg">Terjadi Masalah</p>
            <p className="text-sm opacity-90 leading-relaxed">{error}</p>
          </div>
        )}

        <section className="space-y-6">
          {results.length > 0 && (
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-sm text-slate-500 font-bold">Data Terkumpul: {results.length}</span>
              <button onClick={clearResults} className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider px-3 py-1">Hapus Semua</button>
            </div>
          )}
          <ResultsTable 
            data={results} 
            onExport={handleExport} 
            onExportText={handleExportText} 
            onExportJson={handleExportJson}
          />
          {results.length === 0 && !loading && !error && (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white/50">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-slate-600">Siap Melakukan Riset</p>
              <p className="text-sm mt-1 max-w-xs text-center">Tentukan wilayah dan kategori guru untuk mulai mengekstrak data dan membuat paystub.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">EduScout US - Researcher AI System v2.1 (Instant PDF Paystub)</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
