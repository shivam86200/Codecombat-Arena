import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Frown, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/leaderboardService';

/* ─── Rank Config (mirrors Dashboard logic) ─────────────── */
const getRank = (wins) => {
  if (wins >= 15) return { label: 'Gold',   color: 'text-yellow-500', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: '🥇' };
  if (wins >= 5)  return { label: 'Silver', color: 'text-gray-400',   bg: 'bg-gray-500/15  border-gray-400/30',  icon: '🥈' };
  return                 { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-700/15 border-orange-700/30', icon: '🥉' };
};

/* ─── Position decorations for top 3 ───────────────────── */
const positionStyle = (pos) => {
  if (pos === 1) return { ring: 'ring-2 ring-yellow-500/60',  text: 'text-yellow-400', medal: '🥇' };
  if (pos === 2) return { ring: 'ring-2 ring-slate-400/50',   text: 'text-slate-300',  medal: '🥈' };
  if (pos === 3) return { ring: 'ring-2 ring-orange-500/50',  text: 'text-orange-400', medal: '🥉' };
  return           { ring: '',                               text: 'text-slate-500',  medal: null };
};

/* ─── Skeleton Row ──────────────────────────────────────── */
const SkeletonRow = ({ index }) => (
  <tr className="border-b border-slate-800/60 animate-pulse" style={{ animationDelay: `${index * 80}ms` }}>
    <td className="px-6 py-4"><div className="h-4 w-6  bg-slate-800 rounded" /></td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
      </div>
    </td>
    <td className="px-6 py-4"><div className="h-4 w-10 bg-slate-800 rounded" /></td>
    <td className="px-6 py-4"><div className="h-4 w-10 bg-slate-800 rounded" /></td>
    <td className="px-6 py-4"><div className="h-4 w-10 bg-slate-800 rounded" /></td>
    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-800 rounded-full" /></td>
  </tr>
);

/* ─── Empty State ────────────────────────────────────────── */
const EmptyState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-5">
      <Frown className="h-8 w-8 text-slate-500" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">No Warriors Yet</h3>
    <p className="text-slate-500 text-sm max-w-xs mb-6">
      The arena is empty. Be the first to win a battle and claim the top spot!
    </p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/10 transition-colors"
    >
      <RefreshCw className="h-4 w-4" /> Retry
    </button>
  </div>
);

/* ─── Error State ────────────────────────────────────────── */
const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
      <Medal className="h-8 w-8 text-red-400" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">Failed to Load</h3>
    <p className="text-slate-500 text-sm max-w-xs mb-6">{message}</p>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/10 transition-colors"
    >
      <RefreshCw className="h-4 w-4" /> Try Again
    </button>
  </div>
);

/* ─── Leaderboard Page ────────────────────────────────────── */
const Leaderboard = () => {
  const { user } = useAuth();

  const [players, setPlayers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /* ── Fetch ────────────────────────────────────────────── */
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      const { data } = await getLeaderboard();
      // Support { users: [...] } or flat array
      setPlayers(Array.isArray(data) ? data : (data.users ?? data.leaderboard ?? []));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="px-4 py-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="h-7 w-7 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Top warriors ranked by victories. Updated in real-time.
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchData(true)}
          disabled={loading || refreshing}
          title="Refresh leaderboard"
          className="p-2.5 rounded-lg border border-slate-700/60 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-800/70 text-slate-400 hover:text-white transition-all disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table Card */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          /* ── Skeleton State ─────────────────────── */
          <table className="w-full">
            <thead className="border-b border-slate-800/80">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Pos</th>
                <th className="px-6 py-4">Warrior</th>
                <th className="px-6 py-4">Wins</th>
                <th className="px-6 py-4">Losses</th>
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4 text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)}
            </tbody>
          </table>
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchData()} />
        ) : players.length === 0 ? (
          <EmptyState onRetry={() => fetchData()} />
        ) : (
          /* ── Data Table ─────────────────────────── */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800/80 bg-slate-900/40">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 w-14">Rank #</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4 text-center">Wins</th>
                  <th className="px-6 py-4 text-center">Losses</th>
                  <th className="px-6 py-4 text-center">Coins</th>
                  <th className="px-6 py-4">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {players.map((player, index) => {
                  const pos    = index + 1;
                  const rank   = getRank(player.wins ?? 0);
                  const pStyle = positionStyle(pos);
                  const isMe   = player._id === user?._id || player.id === user?.id;

                  return (
                    <tr
                      key={player._id ?? player.id ?? index}
                      className={`group transition-colors duration-150
                        ${isMe ? 'bg-primary-600/10 hover:bg-primary-600/15' : 'hover:bg-slate-800/30'}
                      `}
                    >
                      {/* Position */}
                      <td className="px-6 py-4">
                        <span className={`text-base font-bold ${pStyle.text}`}>
                          {pStyle.medal ?? `#${pos}`}
                        </span>
                      </td>

                      {/* Name + Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                            bg-slate-800 border ${pStyle.ring || 'border-slate-700/60'}
                            ${isMe ? 'bg-primary-700/40 border-primary-500/60 text-primary-300' : 'text-slate-300'}
                          `}>
                            {(player.name ?? player.email ?? 'W')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isMe ? 'text-primary-300' : 'text-white'}`}>
                              {player.name ?? player.email?.split('@')[0] ?? 'Unknown Warrior'}
                              {isMe && (
                                <span className="ml-2 text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full border border-primary-500/30">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Wins */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-400 font-bold text-sm">{player.wins ?? 0}</span>
                      </td>

                      {/* Losses */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-400 font-bold text-sm">{player.losses ?? 0}</span>
                      </td>

                      {/* Coins */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-400 font-bold text-sm">{player.coins ?? 0}</span>
                      </td>

                      {/* Rank Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${rank.bg} ${rank.color}`}>
                          {rank.icon} {rank.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-600">
              <span>{players.length} warrior{players.length !== 1 ? 's' : ''} ranked</span>
              <span>Sorted by wins · Auto-ranked by backend</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
