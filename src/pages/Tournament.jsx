import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Zap, Clock, CheckCircle2, AlertCircle, Lock, Search, Filter, Code, BarChart, Bell, Plus, X, BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { joinTournament, getAllTournaments, createAITournament } from '../services/tournamentService';
import api from '../services/api';
import Button from '../components/Button';

const diffStyle   = { Easy: 'text-green-400 bg-green-500/10 border-green-500/30', Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', Hard: 'text-red-400 bg-red-500/10 border-red-500/30' };

const Countdown = ({ startTime, fallback }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!startTime) {
      setTimeLeft(fallback || 'TBA');
      return;
    }
    const timer = setInterval(() => {
      const diff = new Date(startTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('Started');
        clearInterval(timer);
        return;
      }
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (d > 0) {
        setTimeLeft(`${d}d ${h}h`);
      } else {
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, fallback]);

  return <span className="font-mono text-xs font-bold text-primary-400">{timeLeft}</span>;
};

const TournamentCard = ({ t, onCardClick, onJoin, joiningId, isJoined }) => {
  const isFull    = t.participants?.length >= (t.maxParticipants || 100);
  const isJoining = joiningId === t._id;
  const canJoin   = (t.status === 'UPCOMING' || t.status === 'OPEN') && !isFull && !isJoined;
  const fillPct   = Math.round(((t.participants?.length || 0) / (t.maxParticipants || 100)) * 100);

  return (
    <div 
      onClick={() => onCardClick(t._id)}
      className="glass rounded-2xl border border-white/5 overflow-hidden hover:border-primary-500/40 transition-all cursor-pointer group relative flex flex-col h-full"
    >
      {isJoined && t.status === 'UPCOMING' && (
        <div className="absolute top-4 right-4 z-10" title="You will be notified 15 mins before start">
          <Bell className="h-4 w-4 text-primary-400 animate-pulse" />
        </div>
      )}

      <div className="px-6 pt-6 pb-4 border-b border-slate-800/60 relative">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-white leading-tight group-hover:text-primary-400 transition-colors pr-6">{t.title}</h3>
          <div className="flex gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${diffStyle[t.difficulty] ?? diffStyle.Medium}`}>{t.difficulty || 'Medium'}</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm line-clamp-2">{t.description || 'Join this competitive arena and prove your worth.'}</p>
      </div>

      <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-slate-800/60 text-sm flex-1">
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Trophy className="h-3 w-3"/>Entry Fee</p>
          <p className="font-medium text-yellow-400 truncate">{t.entryFee} Coins</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3"/>{t.status === 'UPCOMING' ? 'Starts In' : 'Status'}</p>
          {t.status === 'UPCOMING' ? (
             <Countdown startTime={t.startTime} fallback="TBA" />
          ) : (
             <p className={`text-xs font-bold uppercase tracking-wider ${t.status === 'LIVE' ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>{t.status}</p>
          )}
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-800/60">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{t.participants?.length || 0} joined</span>
          <span>{(t.maxParticipants || 100) - (t.participants?.length || 0)} slots left</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isFull ? 'bg-slate-600' : 'bg-gradient-to-r from-primary-600 to-primary-400'}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
        </div>
      </div>

      <div className="px-6 py-4 mt-auto">
        {t.status === 'LIVE' ? (
          <Button 
            fullWidth 
            onClick={(e) => { e.stopPropagation(); onCardClick(t._id); }} 
            variant="primary"
            icon={Zap}
          >
            {isJoined ? 'Enter Contest' : 'Signups Closed'}
          </Button>
        ) : t.status === 'COMPLETED' ? (
          <Button 
            fullWidth 
            onClick={(e) => { e.stopPropagation(); onCardClick(t._id); }} 
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            View Results
          </Button>
        ) : (
          <Button 
            fullWidth 
            icon={isJoined ? CheckCircle2 : Lock} 
            loading={isJoining} 
            disabled={!canJoin || !!joiningId} 
            onClick={(e) => { e.stopPropagation(); onJoin(t); }} 
            variant={isJoined ? 'outline' : (canJoin ? 'primary' : 'outline')}
          >
            {isJoined ? 'Already Joined' : (isJoining ? 'Joining...' : (isFull ? 'Tournament Full' : 'Join Tournament'))}
          </Button>
        )}
      </div>
    </div>
  );
};

const CreateTournamentModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState({ title: '', description: '', numberOfProblems: 2, difficulty: 'Medium' });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createAITournament(formData);
      alert('Tournament created successfully with AI-generated problems!');
      onCreated();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tournament.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary-400"/> Create AI Tournament</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full hover:bg-slate-700/50"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tournament Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50" placeholder="e.g. Weekend Code Sprint" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50" rows="2" placeholder="Rules or details..."></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Number of Problems</label>
              <input required type="number" min="1" max="5" value={formData.numberOfProblems} onChange={e => setFormData({...formData, numberOfProblems: parseInt(e.target.value)})} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Difficulty</label>
              <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800">
            <Button fullWidth variant="primary" type="submit" loading={creating} icon={BrainCircuit}>
              {creating ? 'Generating Problems...' : 'Create Tournament'}
            </Button>
            <p className="text-center text-xs text-slate-500 mt-3">This may take up to 20 seconds as AI crafts unique problems.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

const Tournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments,  setTournaments]  = useState([]);
  const [fetchError,   setFetchError]   = useState('');
  const [joiningId,    setJoiningId]    = useState(null);
  
  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState('upcoming');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [showMyTournaments, setShowMyTournaments] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, [user?._id]);

  const fetchTournaments = async () => {
    try {
      const res = await getAllTournaments();
      const payload = res.data?.data;
      if (payload?.tournaments) {
        setTournaments(payload.tournaments);
        setFetchError('');
      }
    } catch (err) {
      setFetchError('Failed to fetch tournaments.');
    }
  };

  const handleJoin = async (t) => {
    setJoiningId(t._id);
    try {
      await joinTournament(t._id);
      alert(`Success! You have joined "${t.title}".`);
      fetchTournaments(); // Refresh to update participants and coins
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join tournament. Do you have enough coins?');
    } finally {
      setJoiningId(null);
    }
  };

  const filteredTournaments = tournaments.filter(t => {
    // Basic mapping for legacy status
    const tStat = t.status === 'OPEN' ? 'upcoming' : t.status.toLowerCase();
    if (tStat !== statusTab) return false;
    
    const isJoined = t.participants?.some(p => p === user?._id || p._id === user?._id);
    if (showMyTournaments && !isJoined) return false;
    
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const tDiff = t.difficulty || 'Medium';
    if (difficultyFilter !== 'All' && tDiff !== difficultyFilter) return false;
    
    return true;
  });

  return (
    <div className="px-4 py-10 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2"><Trophy className="h-7 w-7 text-yellow-400" /><h1 className="text-4xl font-bold text-white">Tournaments</h1></div>
          <p className="text-slate-500 text-sm">Compete for glory, test your skills, and climb the leaderboard.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} icon={Plus} variant="primary">Create AI Tournament</Button>
      </div>

      {fetchError && tournaments.length === 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/40 p-4 rounded-xl mb-8">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0"/>
            <div>
              <p className="text-xs text-slate-300 font-medium">Currently no active tournaments found.</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={async () => {
              try {
                await api.post('/tournaments/seed');
                fetchTournaments();
              } catch (err) {
                alert('Failed to seed. Make sure your backend is running.');
              }
            }}
          >
            Create Test Tournaments
          </Button>
        </div>
      )}

      {/* Filtering Navigation Bar */}
      <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl p-4 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tournaments by title..." 
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                className="appearance-none bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-700/50 pt-4 mt-2">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            {['Upcoming', 'Live', 'Completed'].map(tab => (
              <button 
                key={tab}
                onClick={() => setStatusTab(tab.toLowerCase())}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${statusTab === tab.toLowerCase() ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-sm text-slate-400 font-medium select-none group-hover:text-slate-300 transition-colors hidden sm:block">My Tournaments</span>
            <div className={`relative w-10 h-5 rounded-full transition-colors ${showMyTournaments ? 'bg-primary-500' : 'bg-slate-700'}`}>
              <input type="checkbox" className="hidden" checked={showMyTournaments} onChange={(e) => setShowMyTournaments(e.target.checked)} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform transform ${showMyTournaments ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/10 rounded-2xl border border-slate-800/50 border-dashed">
          <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-300 mb-1">No tournaments found</h3>
          <p className="text-slate-500 text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTournaments.map((t) => (
            <TournamentCard 
              key={t._id} 
              t={t} 
              onCardClick={(id) => navigate(`/tournaments/${id}`)}
              onJoin={handleJoin} 
              joiningId={joiningId} 
              isJoined={t.participants?.some(p => p === user?._id || p._id === user?._id)}
            />
          ))}
        </div>
      )}

      {showCreateModal && <CreateTournamentModal onClose={() => setShowCreateModal(false)} onCreated={fetchTournaments} />}
    </div>
  );
};

export default Tournament;
