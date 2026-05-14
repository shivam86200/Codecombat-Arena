import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Swords, Shield, TrendingUp, TrendingDown,
  LogOut, Star, Zap, Award, Target, Loader2, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { updateStats } from '../services/userService';
import { joinQueue, leaveQueue } from '../services/queueService';
import api from '../services/api';
import Button from '../components/Button';

/* ─── Rank Config ────────────────────────────────────────
   Rank is derived purely from wins so the UI reacts live
   as mock buttons are pressed.
────────────────────────────────────────────────────────── */
const getRank = (wins) => {
  if (wins >= 20) return { label: 'Grandmaster', color: 'from-purple-400 to-pink-500',   border: 'border-purple-500/40', bg: 'bg-purple-500/10',  icon: '👑', minWins: 20 };
  if (wins >= 10) return { label: 'Gold',         color: 'from-yellow-400 to-amber-500',  border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', icon: '🥇', minWins: 10 };
  if (wins >= 5)  return { label: 'Silver',       color: 'from-slate-300 to-slate-400',   border: 'border-slate-400/40',  bg: 'bg-slate-500/10',  icon: '🥈', minWins: 5  };
  return            { label: 'Bronze',       color: 'from-orange-400 to-amber-600',   border: 'border-orange-500/40', bg: 'bg-orange-500/10', icon: '🥉', minWins: 0  };
};

const nextRankThreshold = (wins) => {
  if (wins >= 20) return null;
  if (wins >= 10) return 20;
  if (wins >= 5)  return 10;
  return 5;
};

/* ─── Stat Card ──────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, accentClass, borderClass }) => (
  <div className={`glass rounded-xl p-6 border ${borderClass} flex items-center gap-5 transition-transform hover:-translate-y-0.5 duration-200`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentClass} shrink-0`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Dashboard Page ─────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Local stats state — seeded from auth user, updated optimistically
  const [stats, setStats] = useState({
    wins:   user?.wins   ?? 0,
    losses: user?.losses ?? 0,
  });
  const [loadingWin,  setLoadingWin]  = useState(false);
  const [loadingLoss, setLoadingLoss] = useState(false);
  const [toast, setToast] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Matchmaking state
  const { getSocket, getSocketId, connected } = useSocket();
  const [searching, setSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const searchTimerRef = useRef(null);

  // Fetch Ledger on mount
  React.useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get('/wallet/ledger');
        setLedger(res.data.data.transactions || []);
      } catch (err) {
        console.error('Failed to fetch ledger', err);
      } finally {
        setLoadingLedger(false);
      }
    };
    fetchLedger();
  }, []);

  // Socket: listen for MATCH_FOUND + QUEUE_TIMEOUT
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMatchFound = ({ matchId }) => {
      clearInterval(searchTimerRef.current);
      setSearching(false);
      showToast('⚔️ Opponent found! Entering arena...', 'win');
      setTimeout(() => navigate(`/match/${matchId}`), 800);
    };

    const onTimeout = ({ message }) => {
      clearInterval(searchTimerRef.current);
      setSearching(false);
      setSearchTime(0);
      showToast(message || 'No opponent found. Coins refunded.', 'error');
    };

    socket.on('MATCH_FOUND',   onMatchFound);
    socket.on('QUEUE_TIMEOUT', onTimeout);
    return () => {
      socket.off('MATCH_FOUND',   onMatchFound);
      socket.off('QUEUE_TIMEOUT', onTimeout);
    };
  }, [connected, navigate]);

  // Search timer
  useEffect(() => {
    if (searching) {
      setSearchTime(0);
      searchTimerRef.current = setInterval(() => setSearchTime(s => s + 1), 1000);
    } else {
      clearInterval(searchTimerRef.current);
    }
    return () => clearInterval(searchTimerRef.current);
  }, [searching]);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* ── Matchmaking ──────────────────────────────────── */
  const handleFindOpponent = async () => {
    if (searching) return;
    const socketId = getSocketId();
    if (!socketId) {
      showToast('Connecting to server... try again.', 'error');
      return;
    }
    if ((user?.coins ?? 0) < 20) {
      showToast('Not enough coins! You need 20 coins to enter.', 'error');
      return;
    }
    try {
      setSearching(true);
      await joinQueue(socketId, user?.rank || 'Bronze');
    } catch (err) {
      setSearching(false);
      showToast(err.response?.data?.message || 'Failed to join queue.', 'error');
    }
  };

  const handleCancelSearch = async () => {
    try {
      await leaveQueue();
    } catch { /* ignore */ }
    clearInterval(searchTimerRef.current);
    setSearching(false);
    setSearchTime(0);
    showToast('Search cancelled. Coins refunded.', 'error');
  };

  /* ── Mock Result Handler ─────────────────────────── */
  const handleResult = async (result) => {
    const setLoading = result === 'win' ? setLoadingWin : setLoadingLoss;
    setLoading(true);

    // Optimistic update
    setStats((prev) => ({
      ...prev,
      [result === 'win' ? 'wins' : 'losses']: prev[result === 'win' ? 'wins' : 'losses'] + 1,
    }));

    try {
      await updateStats(user?._id || user?.id || 'me', result);
      showToast(result === 'win' ? '🏆 Victory recorded!' : '💀 Defeat logged. Learn & return.', result);
    } catch {
      // Rollback on failure
      setStats((prev) => ({
        ...prev,
        [result === 'win' ? 'wins' : 'losses']: prev[result === 'win' ? 'wins' : 'losses'] - 1,
      }));
      showToast('Failed to update stats. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived Data ────────────────────────────────── */
  const total   = stats.wins + stats.losses;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
  const rank    = getRank(stats.wins);
  const nextT   = nextRankThreshold(stats.wins);
  const progress = nextT
    ? Math.min(100, Math.round(((stats.wins - rank.minWins) / (nextT - rank.minWins)) * 100))
    : 100;

  /* ── Logout ──────────────────────────────────────── */
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <div className="px-4 py-10 max-w-5xl mx-auto">

      {/* ── Toast ──────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border transition-all
            ${toast.type === 'win'   ? 'bg-green-500/20 border-green-500/40 text-green-300' : ''}
            ${toast.type === 'loss'  ? 'bg-red-500/20   border-red-500/40   text-red-300'   : ''}
            ${toast.type === 'error' ? 'bg-slate-800    border-slate-700    text-slate-300' : ''}
          `}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-4xl font-bold text-white">
            {user?.name || user?.email?.split('@')[0] || 'Warrior'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-center">
          <Button
            variant="outline"
            icon={Zap}
            onClick={async () => {
              try {
                const res = await api.post('/wallet/daily-bonus');
                showToast(`+10 Coins: ${res.data.message}`, 'win');
                // Reload window to update coin balance globally (simplest way without refactoring context deeply)
                setTimeout(() => window.location.reload(), 1500);
              } catch (err) {
                showToast(err.response?.data?.message || 'Failed to claim daily bonus.', 'error');
              }
            }}
            className="text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10"
          >
            Claim Daily Bonus
          </Button>

          <Button
            variant="outline"
            icon={LogOut}
            onClick={handleLogout}
            className="text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* ── Rank Card ──────────────────────────────── */}
      <div className={`glass rounded-2xl p-6 mb-8 border ${rank.border} ${rank.bg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Badge */}
          <div className="flex items-center gap-4">
            <div className="text-5xl">{rank.icon}</div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Current Rank</p>
              <h2 className={`text-3xl font-extrabold bg-gradient-to-r ${rank.color} bg-clip-text text-transparent`}>
                {rank.label}
              </h2>
            </div>
          </div>

          {/* Progress to next rank */}
          {nextT !== null && (
            <div className="flex-grow">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>{stats.wins} wins</span>
                <span>{nextT} wins to next rank</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${rank.color} transition-all duration-700`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{progress}% to {
                nextT >= 20 ? 'Grandmaster' : nextT >= 10 ? 'Gold' : nextT >= 5 ? 'Silver' : 'Gold'
              }</p>
            </div>
          )}
          {nextT === null && (
            <div className="flex items-center gap-2 text-purple-300 text-sm font-semibold ml-auto">
              <Star className="h-4 w-4 fill-purple-400 text-purple-400" />
              Maximum rank achieved!
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Coins"
          value={user?.coins ?? 0}
          icon={Star}
          accentClass="bg-yellow-500/15 text-yellow-400"
          borderClass="border-yellow-500/20"
        />
        <StatCard
          label="Total Wins"
          value={stats.wins}
          icon={Trophy}
          accentClass="bg-green-500/15 text-green-400"
          borderClass="border-green-500/20"
        />
        <StatCard
          label="Total Losses"
          value={stats.losses}
          icon={Shield}
          accentClass="bg-red-500/15 text-red-400"
          borderClass="border-red-500/20"
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          icon={Target}
          accentClass="bg-primary-500/15 text-primary-400"
          borderClass="border-primary-500/20"
        />
      </div>

      {/* ── Dashboard Bottom Grid ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Mock Battle Buttons ─────────────────────── */}
        <div className="lg:col-span-1 glass rounded-2xl p-6 border border-white/5 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Dev Testing</h3>
          </div>
          <p className="text-slate-500 text-sm mb-6 flex-grow">
            Simulate match results to test stat tracking.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleResult('win')}
              disabled={loadingWin || loadingLoss}
              className={`
                w-full flex items-center justify-center gap-3 py-3 px-6
                rounded-xl font-bold text-sm transition-all duration-200
                border border-green-500/30 bg-green-500/10 text-green-400
                hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-900/20
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
              `}
            >
              {loadingWin ? (
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {loadingWin ? 'Recording...' : 'Mock Win (+30 Coins)'}
            </button>

            <button
              onClick={() => handleResult('loss')}
              disabled={loadingWin || loadingLoss}
              className={`
                w-full flex items-center justify-center gap-3 py-3 px-6
                rounded-xl font-bold text-sm transition-all duration-200
                border border-red-500/30 bg-red-500/10 text-red-400
                hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-900/20
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-95
              `}
            >
              {loadingLoss ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {loadingLoss ? 'Recording...' : 'Mock Loss (-10 Coins)'}
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await api.post('/wallet/dev-coins');
                  showToast(res.data.message, 'win');
                  setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                  showToast('Failed to add dev coins', 'error');
                }
              }}
              className={`
                w-full flex items-center justify-center gap-3 py-3 px-6
                rounded-xl font-bold text-sm transition-all duration-200
                border border-primary-500/30 bg-primary-500/10 text-primary-400
                hover:bg-primary-500/20 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-900/20
                active:scale-95
              `}
            >
              <Star className="h-4 w-4" />
              Add 400 Coins (Testing)
            </button>
          </div>

          {/* Quick Stats Bar */}
          {total > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-800/70 flex items-center gap-3">
              <Award className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-mono shrink-0">
                {stats.wins}W – {stats.losses}L
              </span>
            </div>
          )}
        </div>

        {/* ── Quick Actions / Start Battle ────────────── */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 h-full relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-all duration-500" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="h-6 w-6 text-primary-400" />
              <h3 className="text-2xl font-bold text-white">Enter The Arena</h3>
            </div>

            {searching ? (
              /* ── Searching State ── */
              <div className="flex flex-col items-center justify-center flex-grow gap-5 py-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
                  <Swords className="absolute inset-0 m-auto h-7 w-7 text-primary-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">Searching for opponent...</p>
                  <p className="text-slate-500 text-sm mt-1">
                    {String(Math.floor(searchTime / 60)).padStart(2,'0')}:{String(searchTime % 60).padStart(2,'0')} &nbsp;·&nbsp; {Math.max(0, 90 - searchTime)}s remaining
                  </p>
                </div>
                <button
                  onClick={handleCancelSearch}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-all"
                >
                  <X className="h-4 w-4" /> Cancel Search (Refund 20 ⭐)
                </button>
              </div>
            ) : (
              /* ── Idle State ── */
              <>
                <p className="text-slate-400 text-sm mb-6 max-w-md">
                  Put your coding skills to the test. Join a match against a real opponent, solve algorithms under pressure, and climb the ranks.
                  <span className="text-yellow-400 font-semibold"> Entry costs 20 Coins.</span>
                </p>
                {(user?.coins ?? 0) < 20 && (
                  <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    ⚠ Not enough coins. You need 20 coins to enter the arena.
                  </div>
                )}
                <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={handleFindOpponent}
                    size="lg"
                    disabled={(user?.coins ?? 0) < 20}
                    className="shadow-xl shadow-primary-500/20"
                  >
                    <Swords className="h-4 w-4 mr-2" /> Find Opponent
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/leaderboard')}
                  >
                    View Leaderboard
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Recent Activity / Ledger ────────────────── */}
      <div className="mt-6 glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          </div>
          <button 
            onClick={() => navigate('/ledger')}
            className="text-xs font-semibold text-primary-400 hover:text-primary-300"
          >
            View Full Ledger →
          </button>
        </div>

        {loadingLedger ? (
          <div className="py-8 text-center text-slate-500 text-sm">Loading activity...</div>
        ) : ledger.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No recent activity. Start a match!</div>
        ) : (
          <div className="space-y-3">
            {ledger.slice(0, 5).map((txn) => (
              <div key={txn._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">
                    {txn.reason.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`text-sm font-bold ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.amount > 0 ? '+' : ''}{txn.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
