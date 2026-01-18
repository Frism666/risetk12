
import React, { useState } from 'react';
import { SchoolLevel, ResearchQuery } from '../types';

interface Props {
  onSearch: (query: ResearchQuery) => void;
  isLoading: boolean;
}

export const ResearchForm: React.FC<Props> = ({ onSearch, isLoading }) => {
  const [region, setRegion] = useState('');
  const [level, setLevel] = useState<SchoolLevel>(SchoolLevel.K12);
  const [keywords, setKeywords] = useState('');
  const [count, setCount] = useState<number | string>(25);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!region || !keywords) return;
    
    // Ensure count is a valid number between 1 and 1000 on submit
    const finalCount = Math.min(Math.max(Number(count) || 1, 1), 1000);
    onSearch({ region, level, keywords, count: finalCount });
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string so user can clear the input to type a new number
    if (val === '') {
      setCount('');
      return;
    }
    
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setCount(parsed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Wilayah Riset (US)</label>
          <input
            type="text"
            placeholder="Contoh: Dallas, Texas"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Tipe Sekolah</label>
          <select
            className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none bg-white font-bold text-indigo-900"
            value={level}
            onChange={(e) => setLevel(e.target.value as SchoolLevel)}
          >
            {Object.values(SchoolLevel).map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Jumlah Data (1-1000)</label>
          <input
            type="number"
            min="1"
            max="1000"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-indigo-600"
            value={count}
            onChange={handleCountChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Jabatan Guru / Staf</label>
          <input
            type="text"
            placeholder="Contoh: Math, Science"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-4">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 text-lg ${
            isLoading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
          }`}
        >
          {isLoading ? `Mengekstrak ${count} Data...` : `Ekstrak ${count} Data Sekolah & Guru`}
        </button>
        <div className="flex justify-center items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Multi-Source Scraper
          </span>
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            K-12 Unified Focus
          </span>
        </div>
      </div>
    </form>
  );
};
