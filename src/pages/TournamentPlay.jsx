import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Play, Send, ChevronLeft, AlertCircle, Save } from 'lucide-react';
import { getTournamentById, submitSolution } from '../services/tournamentService';
import Button from '../components/Button';

const TournamentPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timeOver, setTimeOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Per-problem state for code and language
  // Structure: { [problemIndex]: { code: string, language: string } }
  const [codeState, setCodeState] = useState({});

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await getTournamentById(id);
      const t = res.data.data.tournament;
      setTournament(t);
      
      // Load saved code from localStorage
      const savedCode = localStorage.getItem(`tourney_${id}_code`);
      if (savedCode) {
        setCodeState(JSON.parse(savedCode));
      } else {
        const initialCodeState = {};
        t.problems.forEach((p, idx) => {
          initialCodeState[idx] = { code: '', language: 'javascript' };
        });
        setCodeState(initialCodeState);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tournament?.endTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(tournament.endTime);
      const diff = Math.max(0, end - now);

      if (diff <= 0) {
        setTimeOver(true);
        setTimeLeft('00:00');
        clearInterval(timer);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tournament]);

  const handleCodeChange = (e) => {
    const val = e.target.value;
    setCodeState(prev => {
      const newState = {
        ...prev,
        [activeProblemIdx]: { ...prev[activeProblemIdx], code: val }
      };
      // Auto-save
      localStorage.setItem(`tourney_${id}_code`, JSON.stringify(newState));
      return newState;
    });
  };

  const handleLangChange = (e) => {
    const val = e.target.value;
    setCodeState(prev => {
      const newState = {
        ...prev,
        [activeProblemIdx]: { ...prev[activeProblemIdx], language: val }
      };
      localStorage.setItem(`tourney_${id}_code`, JSON.stringify(newState));
      return newState;
    });
  };

  const handleSubmit = async () => {
    if (timeOver) return alert("Time is up!");
    
    const currentCode = codeState[activeProblemIdx]?.code;
    const currentLang = codeState[activeProblemIdx]?.language;
    
    if (!currentCode) return alert("Code cannot be empty");

    setSubmitting(true);
    try {
      await submitSolution({
        code: currentCode,
        language: currentLang,
        problemId: tournament.problems[activeProblemIdx]._id || activeProblemIdx,
        tournamentId: id
      });
      alert('Solution submitted successfully! (Pending Judge evaluation)');
    } catch (err) {
      alert('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading arena...</div>;
  if (!tournament) return <div className="p-10 text-center text-red-400">Tournament not found.</div>;

  if (tournament.status !== 'LIVE') {
    return (
      <div className="p-20 text-center text-slate-400">
        <h2 className="text-2xl text-white mb-2">Arena is Closed</h2>
        <p>This tournament is currently {tournament.status}.</p>
        <Button className="mt-4" onClick={() => navigate(`/tournaments/${id}`)}>Go Back</Button>
      </div>
    );
  }

  const activeProblem = tournament.problems[activeProblemIdx];
  const currentCodeState = codeState[activeProblemIdx] || { code: '', language: 'javascript' };

  // Check if less than 2 minutes left
  const isDangerTime = timeLeft && parseInt(timeLeft.split(':')[0]) < 2;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#0f172a] text-slate-300">
      
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/tournaments/${id}`)} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-white text-lg truncate max-w-xs">{tournament.title}</h1>
        </div>

        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-lg border transition-colors ${timeOver ? 'bg-red-500/20 text-red-500 border-red-500' : isDangerTime ? 'bg-red-500/10 text-red-400 border-red-500/50 animate-pulse' : 'bg-slate-800 text-white border-slate-700'}`}>
          <Clock className="h-4 w-4" />
          {timeOver ? 'TIME OVER' : (timeLeft || '00:00')}
        </div>
      </div>

      {/* Problem Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/30 overflow-x-auto no-scrollbar">
        {tournament.problems.map((p, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveProblemIdx(idx)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeProblemIdx === idx ? 'border-primary-500 text-primary-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'}`}
          >
            Problem {idx + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Problem Description */}
        <div className="w-1/2 flex flex-col border-r border-slate-800 overflow-y-auto bg-slate-900/20 p-6 custom-scrollbar">
          {activeProblem ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{activeProblem.title || `Problem ${activeProblemIdx + 1}`}</h2>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-wrap">
                  {activeProblem.description}
                </div>
              </div>

              {activeProblem.constraints && activeProblem.constraints.length > 0 && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="font-bold text-slate-400 mb-2 text-xs uppercase tracking-wider">Constraints</h3>
                  <ul className="list-disc list-inside text-sm font-mono text-primary-300">
                    {activeProblem.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Examples</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-2 text-xs font-bold text-slate-500 bg-slate-900 border-b border-slate-800">
                    <div className="p-2 border-r border-slate-800">Input</div>
                    <div className="p-2">Output</div>
                  </div>
                  <div className="grid grid-cols-2 text-sm font-mono">
                    <div className="p-3 border-r border-slate-800 whitespace-pre-wrap text-slate-300">{activeProblem.sampleInput}</div>
                    <div className="p-3 whitespace-pre-wrap text-green-400">{activeProblem.sampleOutput}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 mt-20">No problem selected</div>
          )}
        </div>

        {/* Right Side: Code Editor */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-[#2d2d2d]">
            <select 
              value={currentCodeState.language}
              onChange={handleLangChange}
              disabled={timeOver}
              className="bg-[#1e1e1e] border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1 mr-2"><Save className="h-3 w-3"/> Auto-saved</span>
              <Button size="sm" variant="outline" icon={Play} disabled={timeOver} onClick={() => alert('Run Code (Local Test) not implemented yet.')}>Run</Button>
              <Button size="sm" variant="primary" icon={Send} disabled={timeOver || submitting} loading={submitting} onClick={handleSubmit}>Submit</Button>
            </div>
          </div>

          {/* Textarea Editor */}
          <div className="flex-1 relative">
            <textarea
              value={currentCodeState.code}
              onChange={handleCodeChange}
              disabled={timeOver}
              spellCheck="false"
              placeholder={`// Write your ${currentCodeState.language} solution here...`}
              className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm p-4 resize-none outline-none custom-scrollbar"
              style={{ lineHeight: '1.5' }}
            />
            {timeOver && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
                <h3 className="text-xl font-bold text-white">Time is up!</h3>
                <p className="text-slate-400 text-sm">Editor locked.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPlay;
