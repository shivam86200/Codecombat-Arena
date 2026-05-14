import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, BookOpen, ChevronRight, Zap, Clock, BarChart2, AlertCircle } from 'lucide-react';
import { createMatch } from '../services/matchService';
import Button from '../components/Button';

/* ─── Static Problem List ────────────────────────────────
   In production this would come from GET /api/problems.
   Kept static for now as per requirements.
───────────────────────────────────────────────────────── */
const PROBLEMS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Map'],
    description: 'Given an array of integers and a target, return indices of two numbers that add up to the target.',
    timeLimit: '15 min',
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    description: 'Determine if a string of brackets is valid and properly closed in the correct order.',
    timeLimit: '15 min',
  },
  {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Chars',
    difficulty: 'Medium',
    tags: ['Sliding Window', 'Hash Map'],
    description: 'Find the length of the longest substring without repeating characters.',
    timeLimit: '20 min',
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    tags: ['Array', 'Sorting'],
    description: 'Given an array of intervals, merge all overlapping intervals and return the result.',
    timeLimit: '20 min',
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    description: 'Search for a target value in a sorted array. Return index or -1 if not found.',
    timeLimit: '10 min',
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Hard',
    tags: ['Design', 'Linked List', 'Hash Map'],
    description: 'Design and implement a data structure for a Least Recently Used (LRU) cache.',
    timeLimit: '30 min',
  },
];

const difficultyStyle = {
  Easy:   'text-green-400  bg-green-500/10  border-green-500/30',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Hard:   'text-red-400    bg-red-500/10    border-red-500/30',
};

/* ─── Problem Card ───────────────────────────────────────── */
const ProblemCard = ({ problem, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(problem.id)}
    className={`w-full text-left p-5 rounded-xl border transition-all duration-200 group
      ${selected
        ? 'border-primary-500/60 bg-primary-600/10 ring-2 ring-primary-500/20'
        : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40'
      }
    `}
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className={`font-semibold text-sm ${selected ? 'text-primary-300' : 'text-white'}`}>
          {problem.title}
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
      </div>
      <ChevronRight className={`h-4 w-4 shrink-0 mt-0.5 transition-transform ${selected ? 'text-primary-400 rotate-90' : 'text-slate-600 group-hover:text-slate-400'}`} />
    </div>

    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{problem.description}</p>

    <div className="flex items-center gap-4 text-xs text-slate-600">
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{problem.timeLimit}</span>
      <span className="flex items-center gap-1 flex-wrap gap-y-1">
        {problem.tags.map((t) => (
          <span key={t} className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">{t}</span>
        ))}
      </span>
    </div>
  </button>
);

import { useAuth } from '../context/AuthContext';

/* ─── Create Match Page ──────────────────────────────────── */
const CreateMatch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const selectedProblem = PROBLEMS.find((p) => p.id === selectedId);

  const handleCreate = async () => {
    if (!selectedId) return;
    try {
      setLoading(true);
      setError('');
      const { data: resData } = await createMatch(selectedId);
      const matchId = resData.data.match._id;
      navigate(`/match/${matchId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create match. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="h-7 w-7 text-primary-400" />
          <h1 className="text-4xl font-bold text-white">Create Match</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Choose a problem to challenge your opponent. First to solve wins.
        </p>
      </div>

      {/* Step Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">1</div>
        <p className="text-sm font-semibold text-slate-300">Select a Problem</p>
        <div className="flex-grow border-t border-slate-800 ml-2" />
        <span className="text-xs text-slate-600">{PROBLEMS.length} available</span>
      </div>

      {/* Problem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {PROBLEMS.map((p) => (
          <ProblemCard
            key={p.id}
            problem={p}
            selected={selectedId === p.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {/* Create Panel */}
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">2</div>
          <p className="text-sm font-semibold text-slate-300">Launch Battle</p>
        </div>

        {selectedProblem ? (
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-primary-600/10 border border-primary-500/20 mb-5">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Selected Problem</p>
              <p className="font-semibold text-white">{selectedProblem.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[selectedProblem.difficulty]}`}>
                  {selectedProblem.difficulty}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {selectedProblem.timeLimit}
                </span>
              </div>
            </div>
            <BarChart2 className="h-8 w-8 text-primary-500/40" />
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-700 mb-5 text-center">
            <BookOpen className="h-6 w-6 text-slate-600 mx-auto mb-1" />
            <p className="text-sm text-slate-600">No problem selected yet</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          icon={Zap}
          loading={loading}
          disabled={!selectedId || loading || (user?.coins < 10)}
          onClick={handleCreate}
          title={user?.coins < 10 ? "Not enough coins" : ""}
        >
          {loading ? 'Creating Match...' : 'Start Battle (-10 Coins)'}
        </Button>
        {user?.coins < 10 && (
          <p className="text-center text-xs text-red-400 mt-2">Not enough coins to join. You need 10 coins.</p>
        )}
        {!selectedId && user?.coins >= 10 && (
          <p className="text-center text-xs text-slate-600 mt-2">Select a problem above to continue</p>
        )}
      </div>
    </div>
  );
};

export default CreateMatch;
