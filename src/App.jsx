import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Volume2, ArrowRight, RotateCcw, Sparkles, X, Loader2, Mic, MicOff, Layers, Check, Plus, Trash2, MessageCircle, PenTool, Scissors, Ear, Trophy, Grid, Zap, Eye, AlertCircle, Upload, Settings, Coffee, RefreshCw, ChevronLeft, ChevronRight, Library as LibraryIcon } from 'lucide-react';
import { fetchGemini, fetchGeminiJSON, fetchGeminiTTS } from './api';

// --- HELPER COMPONENT ---
const AudioButton = ({ text, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const speak = async (e) => {
    e?.stopPropagation();
    if (!text) return;
    setLoading(true);
    const wavBlob = await fetchGeminiTTS(text);
    if (wavBlob) {
      const audio = new Audio(URL.createObjectURL(wavBlob));
      audio.play();
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      window.speechSynthesis.speak(utterance);
    }
    setLoading(false);
  };
  return (
    <button onClick={speak} disabled={loading} className={`p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors ${className}`}>
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Volume2 size={18} />}
    </button>
  );
};

// --- SUB-COMPONENTS ---

const Library = ({ history, setHistory, onStudy }) => {
  const [search, setSearch] = useState('');
  const filtered = history.filter(h => (h.word?.toLowerCase().includes(search.toLowerCase()) || h.translation?.toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
       <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
         <h2 className="text-xl font-bold flex items-center gap-2"><LibraryIcon className="text-indigo-600"/> Library ({history.length})</h2>
         <input type="text" placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} className="p-2 border rounded-lg"/>
       </div>
       <div className="max-h-[600px] overflow-y-auto">
         {filtered.map((item, i) => (
           <div key={i} className="flex items-center justify-between p-4 border-b hover:bg-slate-50">
             <div>
                <div className="font-bold flex items-center gap-2">{item.gender && <span className="text-xs uppercase bg-slate-200 px-1 rounded">{item.gender}</span>} {item.word}</div>
                <div className="text-sm text-slate-500">{item.translation}</div>
             </div>
             <div className="flex gap-2">
                <AudioButton text={item.word} />
                <button onClick={()=>onStudy(item.word)} className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><Search size={16}/></button>
                <button onClick={()=>{const n=history.filter(h=>h.word!==item.word);setHistory(n);localStorage.setItem('german_history',JSON.stringify(n))}} className="p-2 bg-rose-50 text-rose-600 rounded-full"><Trash2 size={16}/></button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

const Analyzer = ({ activeWord, addXP, history, setHistory, level }) => {
  const [query, setQuery] = useState(activeWord || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const search = async () => {
    if(!query) return;
    setLoading(true);
    try {
       const prompt = `Analyze German word "${query}". Level ${level}. Return JSON: {"word": "BaseLemma", "gender": "der/die/das", "translation": "en", "definition": "def", "ipa": "ipa", "partOfSpeech": "type", "grammar": {"plural": "pl"}, "exampleSentence": {"german": "ex", "translation": "en"}}`;
       const res = await fetchGeminiJSON(prompt);
       setData(res);
       const newH = [res, ...history.filter(h=>h.word!==res.word)].slice(0,50);
       setHistory(newH);
       localStorage.setItem('german_history', JSON.stringify(newH));
       addXP(10);
    } catch(e) { alert("Error"); }
    setLoading(false);
  };

  useEffect(()=>{ if(activeWord) { setQuery(activeWord); search(); } },[activeWord]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
       <div className="flex gap-2 mb-6">
         <input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 p-3 border rounded-xl" placeholder="Enter word..."/>
         <button onClick={search} disabled={loading} className="bg-indigo-600 text-white px-6 rounded-xl">{loading?<Loader2 className="animate-spin"/>:<Search/>}</button>
       </div>
       {data && (
         <div className="animate-in fade-in">
            <div className="flex justify-between items-start mb-4">
              <div>
                 <h1 className="text-4xl font-bold mb-1">{data.word}</h1>
                 <div className="text-slate-500">{data.gender} • {data.partOfSpeech} • {data.ipa}</div>
              </div>
              <AudioButton text={data.word} className="w-12 h-12 bg-indigo-100"/>
            </div>
            <div className="text-2xl text-indigo-900 mb-6">{data.translation}</div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <div className="font-medium text-slate-800">"{data.exampleSentence?.german}"</div>
               <div className="text-slate-500 text-sm mt-1">{data.exampleSentence?.translation}</div>
               <div className="mt-2 flex justify-end"><AudioButton text={data.exampleSentence?.german}/></div>
            </div>
         </div>
       )}
    </div>
  );
};

// ... (Ideally, you would separate other components like Flashcards, Dojo etc. here. 
// For brevity in this copy-paste, I am including the Dashboard logic below)

export default function App() {
  const [view, setView] = useState('dashboard');
  const [activeWord, setActiveWord] = useState(null);
  const [xp, setXp] = useState(0);
  const [history, setHistory] = useState([]);
  const [level, setLevel] = useState('A1');
  
  useEffect(() => {
    const h = localStorage.getItem('german_history');
    if(h) setHistory(JSON.parse(h));
    const x = localStorage.getItem('german_xp');
    if(x) setXp(parseInt(x));
  }, []);

  useEffect(() => { localStorage.setItem('german_xp', xp); }, [xp]);

  const tools = [
    { id: 'analyzer', name: 'Analyzer', icon: Search, color: 'bg-blue-500' },
    { id: 'library', name: 'Library', icon: LibraryIcon, color: 'bg-purple-600' },
    // Add more tools here as you expand
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
       <header className="bg-white border-b sticky top-0 z-50">
         <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="font-bold text-xl cursor-pointer" onClick={()=>setView('dashboard')}>WortMeister</h1>
            <div className="flex items-center gap-4">
               <select value={level} onChange={(e)=>setLevel(e.target.value)} className="bg-slate-100 rounded p-1 text-sm font-bold"><option>A1</option><option>B1</option><option>C1</option></select>
               <span className="font-bold text-amber-600">{xp} XP</span>
            </div>
         </div>
       </header>
       <main className="max-w-4xl mx-auto px-4 py-8">
          {view === 'dashboard' && (
             <div className="grid grid-cols-2 gap-4">
                {tools.map(t=>(
                   <button key={t.id} onClick={()=>setView(t.id)} className="bg-white p-6 rounded-2xl border hover:shadow-md transition-all text-left">
                      <div className={`w-10 h-10 rounded-lg ${t.color} text-white flex items-center justify-center mb-3`}><t.icon size={20}/></div>
                      <div className="font-bold">{t.name}</div>
                   </button>
                ))}
             </div>
          )}
          {view === 'analyzer' && <Analyzer activeWord={activeWord} addXP={(x)=>setXp(curr=>curr+x)} history={history} setHistory={setHistory} level={level}/>}
          {view === 'library' && <Library history={history} setHistory={setHistory} onStudy={(w)=>{setActiveWord(w); setView('analyzer')}}/>}
       </main>
    </div>
  );
}