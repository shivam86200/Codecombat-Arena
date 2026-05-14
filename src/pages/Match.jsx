import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Swords, Clock, CheckCircle2, AlertCircle,
  Trophy, Send, Hourglass,
  Loader2, FileText, BookOpen, History, Terminal,
  Play, Layout, RefreshCw, Check, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMatch, submitCode, runCode, judgeSubmit } from '../services/matchService';
import Button from '../components/Button';
import { TEST_CASES, STARTER_CODE } from '../data/testCases';

const PROBLEM_META = {
  'two-sum': { title: 'Two Sum', difficulty: 'Easy', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', '-10⁹ ≤ target ≤ 10⁹', 'Only one valid answer exists.'] },
  'valid-parentheses': { title: 'Valid Parentheses', difficulty: 'Easy', description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.', constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only'] },
  'longest-substring': { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', description: 'Given a string s, find the length of the longest substring without repeating characters.', constraints: ['0 ≤ s.length ≤ 5 × 10⁴', 's consists of English letters, digits, symbols and spaces'] },
  'merge-intervals': { title: 'Merge Intervals', difficulty: 'Medium', description: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals.', constraints: ['1 ≤ intervals.length ≤ 10⁴', 'intervals[i].length == 2'] },
  'binary-search': { title: 'Binary Search', difficulty: 'Easy', description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.', constraints: ['1 ≤ nums.length ≤ 10⁴', 'All integers in nums are unique', 'nums is sorted in ascending order'] },
  'lru-cache': { title: 'LRU Cache', difficulty: 'Hard', description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.', constraints: ['1 ≤ capacity ≤ 3000', '0 ≤ key ≤ 10⁴', '0 ≤ value ≤ 10⁵'] },
};

const diffColor = { Easy: 'text-green-400 bg-green-500/10', Medium: 'text-yellow-400 bg-yellow-500/10', Hard: 'text-red-400 bg-red-500/10' };

/** Format a test case input object as LeetCode-style variable assignments */
const formatInput = (input) => {
  return Object.entries(input)
    .map(([key, val]) => {
      // Stringify value nicely
      let v;
      if (typeof val === 'string') v = `"${val}"`;
      else if (Array.isArray(val)) v = JSON.stringify(val);
      else v = String(val);
      return `${key} = ${v}`;
    })
    .join(', ');
};

/** Format output value */
const formatOutput = (val) => {
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
};

const STATUS_CFG = {
  waiting:   { label: 'Waiting...', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', Icon: Hourglass },
  pending:   { label: 'Waiting...', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', Icon: Hourglass },
  active:    { label: 'Battle Active', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', Icon: Swords },
  submitted: { label: 'Judging...', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', Icon: Loader2 },
  completed: { label: 'Complete', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', Icon: Trophy },
};

const PlayerAvatar = ({ player, isYou }) => {
  const empty = !player;
  const name = player?.name ?? player?.email?.split('@')[0] ?? 'Warrior';
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border
        ${empty ? 'border-dashed border-slate-700 bg-slate-900 text-slate-600' : ''}
        ${!empty && isYou ? 'border-blue-500/50 bg-blue-500/20 text-blue-400' : (!empty ? 'border-slate-600 bg-slate-800 text-slate-300' : '')}
      `}>
        {empty ? '?' : name[0].toUpperCase()}
      </div>
      <span className={`text-xs font-medium truncate max-w-[80px] ${isYou ? 'text-blue-400' : 'text-slate-400'}`}>
        {empty ? 'Waiting...' : name}
      </span>
    </div>
  );
};

const Match = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('testcase');
  const [selectedCase, setSelectedCase] = useState(0);

  // Run results
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);

  const problemId = match?.problemId ?? '';
  const testCases = TEST_CASES[problemId] ?? [];
  const meta = PROBLEM_META[problemId];

  // Set starter code when problem loads
  useEffect(() => {
    if (problemId && STARTER_CODE[problemId]) {
      setCode(STARTER_CODE[problemId][language] ?? '// Write your solution here\n\n');
    }
  }, [problemId, language]);

  const fetchMatch = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await getMatch(id);
      setMatch(data.data?.match ?? data.data ?? data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load match.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMatch(); }, [fetchMatch]);

  useEffect(() => {
    if (!match) return;
    if (['waiting', 'pending', 'active'].includes(match.status?.toLowerCase())) {
      pollRef.current = setInterval(() => fetchMatch(true), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [match?.status, fetchMatch]);

  useEffect(() => {
    if (match?.status?.toUpperCase() !== 'ACTIVE') return;
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [match?.status]);

  // Run against 3 sample test cases via backend
  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setActiveRightTab('result');
    setRunResults(null);
    try {
      const { data } = await runCode(problemId, code, language);
      setRunResults({ ...data.data, mode: 'run' });
    } catch (err) {
      setRunResults({ error: err.response?.data?.message || 'Judge failed.', results: [], passed: 0, total: 0, score: 0 });
    } finally {
      setRunning(false);
    }
  };

  // Submit against all 40 test cases via backend
  const handleSubmit = async () => {
    if (!code.trim() || submitted) return;
    try {
      setSubmitting(true);
      setSubmitError('');
      setActiveRightTab('result');
      // Run judge on all cases
      const { data } = await judgeSubmit(problemId, code, language);
      const judgeData = data.data;
      setRunResults({ ...judgeData, mode: 'submit' });
      // Save to DB
      const summary = `${judgeData.passed}/${judgeData.total} passed — Score: ${judgeData.score}%`;
      await submitCode(id, code, language, summary);
      setSubmitted(true);
      setSubmitSuccess(true);
      setMatch(prev => prev ? { ...prev, status: 'SUBMITTED' } : prev);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-slate-300">{error}</p>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  );

  const status = match?.status?.toLowerCase() ?? 'waiting';
  const statusCfg = STATUS_CFG[status] ?? STATUS_CFG.waiting;
  const player1 = match?.createdBy;
  const player2 = match?.opponent;

  const passedCount = runResults?.passed ?? 0;
  const totalCount  = runResults?.total  ?? 0;


  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col text-slate-300 font-sans">

      {/* Navbar */}
      <nav className="h-12 border-b border-white/5 bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <Layout className="h-4 w-4 text-slate-400" />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white truncate max-w-[200px]">
              {meta?.title || match?.problemId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Coding Challenge'}
            </h1>
            <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
              #{id.slice(-6).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {status === 'active' && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Clock className="h-3.5 w-3.5" /> {formatTime(elapsed)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <PlayerAvatar player={player1} isYou={user?._id === player1?._id} />
            <span className="text-[10px] font-black text-slate-700 italic">VS</span>
            <PlayerAvatar player={player2} isYou={user?._id === player2?._id} />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color} border`}>
            {statusCfg.label}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-grow flex overflow-hidden p-2 gap-2">

        {/* Left: Problem */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center bg-[#262626] border-b border-white/5 px-2 h-10 shrink-0">
            {[
              { id: 'description', label: 'Description', icon: FileText },
              { id: 'editorial', label: 'Editorial', icon: BookOpen },
              { id: 'submissions', label: 'Submissions', icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveLeftTab(tab.id)}
                className={`h-full px-4 flex items-center gap-2 text-xs font-medium transition-all relative
                  ${activeLeftTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {activeLeftTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-auto p-6">
            {activeLeftTab === 'description' && meta && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-white mb-2">{meta.title}</h2>
                <div className="flex items-center gap-2 mb-5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${diffColor[meta.difficulty]}`}>{meta.difficulty}</span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 text-sm">{meta.description}</p>

                <div className="space-y-5 mb-8">
                  {testCases.slice(0, 3).map((tc, i) => (
                    <div key={tc.id}>
                      <p className="text-sm font-bold text-white mb-2">Example {i + 1}:</p>
                      <div className="border-l-2 border-white/10 pl-4 space-y-1.5">
                        <p className="font-mono text-[13px]">
                          <span className="font-bold text-slate-300">Input: </span>
                          <span className="text-slate-300">{formatInput(tc.input)}</span>
                        </p>
                        <p className="font-mono text-[13px]">
                          <span className="font-bold text-slate-300">Output: </span>
                          <span className="text-slate-300">{formatOutput(tc.expected)}</span>
                        </p>
                        {tc.explanation && (
                          <p className="text-slate-500 text-[12px] italic">Explanation: {tc.explanation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/5 pt-5">
                  <h4 className="text-sm font-bold text-white mb-3">Constraints:</h4>
                  <ul className="list-disc list-inside text-slate-400 space-y-1 text-[13px]">
                    {meta.constraints.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {activeLeftTab !== 'description' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 opacity-50">
                <Hourglass className="h-8 w-8 animate-pulse" />
                <p className="text-sm">Coming soon...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editor + Console */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">

          {/* Editor */}
          <div className="flex-[2] flex flex-col bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between bg-[#262626] border-b border-white/5 px-2 h-10 shrink-0">
              <div className="flex items-center gap-3 h-full">
                <button className="h-full px-3 flex items-center gap-2 text-xs font-bold text-green-500 border-b-2 border-green-500">
                  <Terminal className="h-3.5 w-3.5" /> Code
                </button>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-[#1e1e1e] border border-white/10 rounded text-[11px] font-semibold text-slate-300 px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="flex items-center gap-1 px-2">
                <button
                  onClick={() => setCode(STARTER_CODE[problemId]?.[language] ?? '')}
                  className="p-1.5 hover:bg-white/5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title="Reset code"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-grow relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#1a1a1a] border-r border-white/5 flex flex-col items-center py-4 text-[11px] text-slate-700 font-mono select-none z-10">
                {Array.from({ length: 30 }).map((_, i) => <div key={i} className="leading-[1.625rem]">{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 left-10 w-[calc(100%-40px)] h-full bg-transparent text-slate-300 font-mono text-[13px] p-4 resize-none outline-none leading-[1.625rem]"
                placeholder="// Write your solution here..."
              />
            </div>
          </div>

          {/* Console / Results */}
          <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden min-h-[160px]">
            <div className="flex items-center justify-between bg-[#262626] border-b border-white/5 px-4 h-10 shrink-0">
              <div className="flex items-center gap-5 h-full">
                {['testcase', 'result'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveRightTab(tab)}
                    className={`text-xs font-bold transition-colors relative h-full flex items-center capitalize
                      ${activeRightTab === tab ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab === 'testcase' ? 'Test Cases' : `Test Result${runResults ? ` (${runResults.passed ?? 0}/${runResults.total ?? 0})` : ''}`}
                    {activeRightTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded">⚡ Judge0</span>
            </div>

            <div className="flex-grow overflow-auto p-4 font-mono text-[12px]">
              {activeRightTab === 'testcase' ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {testCases.map((tc, i) => (
                      <button
                        key={tc.id}
                        onClick={() => setSelectedCase(i)}
                        className={`px-3 py-1 rounded text-xs border transition-all ${selectedCase === i ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-white/5 bg-white/5 text-slate-500 hover:text-slate-300'}`}
                      >
                        Case {i + 1}
                        {runResults?.cases?.[i] !== undefined && (
                          <span className="ml-1.5">
                            {runResults.cases[i].passed
                              ? <span className="text-green-400">✓</span>
                              : <span className="text-red-400">✗</span>}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {testCases[selectedCase] && (
                    <div className="space-y-2">
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Input</p>
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-slate-300">{JSON.stringify(testCases[selectedCase].input)}</div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Expected Output</p>
                        <div className="bg-white/5 p-2 rounded border border-white/5 text-slate-300">{JSON.stringify(testCases[selectedCase].expected)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : running ? (
                <div className="flex items-center gap-3 text-slate-400 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Running test cases...
                </div>
              ) : runResults ? (
                runResults.error ? (
                  <div className="text-red-400 py-2">⚠ {runResults.error}</div>
                ) : (
                  <div className="space-y-2">
                    {/* Score Banner */}
                    <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${
                      runResults.passed === runResults.total ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div>
                        <p className={`text-sm font-bold ${runResults.passed === runResults.total ? 'text-green-400' : 'text-red-400'}`}>
                          {runResults.mode === 'submit' ? '🏆 Final Result' : '🧪 Sample Tests'}
                          {' — '}{runResults.passed}/{runResults.total} Passed
                        </p>
                        {runResults.mode === 'submit' && (
                          <p className="text-xs text-slate-400 mt-0.5">Score: <span className="font-bold text-white">{runResults.score}%</span></p>
                        )}
                      </div>
                      <span className={`text-2xl font-black ${
                        runResults.score >= 80 ? 'text-green-400' : runResults.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{runResults.score}%</span>
                    </div>
                    {runResults.results?.map((r, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${r.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {r.passed ? <Check className="h-3.5 w-3.5 text-green-400" /> : <X className="h-3.5 w-3.5 text-red-400" />}
                          <span className={`text-xs font-bold ${r.passed ? 'text-green-400' : 'text-red-400'}`}>Case {i + 1}</span>
                        </div>
                        {!r.passed && (
                          <div className="space-y-1 text-[11px] pl-5">
                            {r.error ? (
                              <p className="text-red-300">Error: {r.error}</p>
                            ) : (
                              <>
                                <p><span className="text-slate-500">Expected: </span><span className="text-slate-300">{JSON.stringify(r.expected)}</span></p>
                                <p><span className="text-slate-500">Got: </span><span className="text-slate-300">{JSON.stringify(r.output)}</span></p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2 italic">
                  <Play className="h-6 w-6 opacity-30" />
                  <p>Click "Run" to test your code</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="h-14 bg-[#1a1a1a] border-t border-white/5 flex items-center justify-end px-6 shrink-0 gap-3">
        <span className="text-[10px] text-slate-600 mr-auto">Run → 3 sample cases &nbsp;|&nbsp; Submit → all {testCases.length} cases</span>
        <button
          onClick={handleRun}
          disabled={running || submitting}
          className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {submitting ? 'Judging...' : submitted ? 'Submitted ✓' : 'Submit'}
        </button>
      </footer>

      {/* Toasts */}
      {submitError && (
        <div className="fixed bottom-20 right-6 bg-red-500/20 border border-red-500/40 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-200">{submitError}</p>
        </div>
      )}
      {submitSuccess && (
        <div className="fixed bottom-20 right-6 bg-green-500/20 border border-green-500/40 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <p className="text-sm text-green-200">Solution submitted successfully!</p>
        </div>
      )}
    </div>
  );
};

export default Match;
