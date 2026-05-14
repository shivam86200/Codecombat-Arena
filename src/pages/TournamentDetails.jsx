import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Users, ChevronLeft, Lock, Unlock, Play, Zap, CheckCircle2, BarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTournamentById, getTournamentLeaderboard, joinTournament, startTournament } from '../services/tournamentService';
import Button from '../components/Button';

const Countdown = ({ startTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!startTime) return;
    const timer = setInterval(() => {
      const diff = new Date(startTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('LIVE');
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
  }, [startTime]);

  return <span>{timeLeft}</span>;
};

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [t, setT] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, leaderboard, problems

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getTournamentById(id);
      setT(res.data.data.tournament);
      
      try {
        const lbRes = await getTournamentLeaderboard(id);
        setLeaderboard(lbRes.data.data.leaderboard || []);
      } catch (err) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!t) return;
    try {
      setJoining(true);
      await joinTournament(t._id);
      alert('Successfully joined the tournament!');
      fetchData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join tournament. Insufficient coins?');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading tournament...</div>;
  if (!t) return <div className="p-10 text-center text-red-400">Tournament not found.</div>;

  const isJoined = t.participants?.some(p => p._id === user._id || p === user._id);
  const isFull = t.participants?.length >= t.maxParticipants;
  const canJoin = t.status === 'UPCOMING' && !isFull && !isJoined;
  const diffStyle = { Easy: 'text-green-400 border-green-500/30', Medium: 'text-yellow-400 border-yellow-500/30', Hard: 'text-red-400 border-red-500/30' };

  const handleStartTournament = async () => {
    try {
      setJoining(true); // Re-use loading state
      await startTournament(t._id);
      alert('Tournament started!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start tournament.');
    } finally {
      setJoining(false);
    }
  };

  const isCreator = t.createdBy === user._id;

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ChevronLeft className="h-4 w-4" /> Back to Tournaments
      </button>

      {/* Header Card */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-8 relative overflow-hidden">
        {/* Status Badge */}
        <div className="absolute top-6 right-6 flex gap-2">
          {isCreator && t.status === 'UPCOMING' && (
            <Button size="sm" variant="outline" onClick={handleStartTournament} disabled={joining} loading={joining}>
              Start Now (Admin)
            </Button>
          )}
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border 
            ${t.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 
              t.status === 'COMPLETED' ? 'bg-slate-700/50 text-slate-400 border-slate-600' : 
              'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
            {t.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 pr-40">{t.title}</h1>
        <p className="text-slate-400 text-sm max-w-2xl mb-6">{t.description}</p>
        
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span>Prize Pool: <strong className="text-white">{t.prizePool} Coins</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className={`px-2 py-0.5 rounded text-xs border ${diffStyle[t.difficulty] || diffStyle.Medium}`}>{t.difficulty}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <span className="font-medium text-primary-400">Entry: {t.entryFee} Coins</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>{t.status === 'UPCOMING' ? <span>Starts in: <strong className="text-white font-mono"><Countdown startTime={t.startTime} /></strong></span> : 'Time elapsed'}</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between">
           <div>
             <div className="text-xs text-slate-500 mb-1">Participants</div>
             <div className="text-white font-medium">{t.participants?.length || 0} / {t.maxParticipants} <span className="text-slate-500 text-sm font-normal ml-2">joined</span></div>
           </div>
           
           <div>
             {t.status === 'UPCOMING' ? (
               <Button 
                 icon={isJoined ? CheckCircle2 : Zap} 
                 loading={joining} 
                 disabled={isJoined || isFull} 
                 onClick={handleJoin} 
                 variant={isJoined ? 'outline' : 'primary'}
               >
                 {isJoined ? 'Joined' : (isFull ? 'Full' : 'Join Tournament')}
               </Button>
             ) : t.status === 'LIVE' ? (
               <Button icon={Play} variant="primary" disabled={!isJoined} onClick={() => navigate(`/tournaments/${id}/play`)}>
                 {isJoined ? 'Enter Contest' : 'Signups Closed'}
               </Button>
             ) : (
               <Button variant="outline" onClick={() => setActiveTab('leaderboard')}>View Final Results</Button>
             )}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-800 mb-6">
        {['details', 'problems', 'leaderboard'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary-500 text-primary-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/20 border border-slate-700/30 rounded-2xl p-6 min-h-[400px]">
        {activeTab === 'details' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary-400"/> Registered Warriors</h3>
              <div className="flex flex-wrap gap-3">
                {t.participants?.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                      {(p.username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{p.username || 'Anonymous'}</span>
                  </div>
                ))}
                {!t.participants?.length && <p className="text-slate-500 text-sm">Be the first to join!</p>}
              </div>
            </div>
            
            <div>
               <h3 className="text-lg font-bold text-white mb-4">Rules & Anti-Cheat</h3>
               <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
                 <li>Strictly adhere to the time limits. Submissions post-deadline will be rejected.</li>
                 <li>Any form of plagiarism or outside help is strictly prohibited. AI judge tracks code patterns.</li>
                 <li>Rate limiting: Submissions are capped at 5 per minute per problem.</li>
                 <li>Prizes are distributed to wallet automatically within 10 minutes of tournament end.</li>
               </ul>
            </div>
          </div>
        )}

        {activeTab === 'problems' && (
          <div>
            {t.status === 'UPCOMING' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                 <Lock className="h-12 w-12 text-slate-600 mb-4" />
                 <h3 className="text-xl font-bold text-white mb-2">Problems are locked</h3>
                 <p className="text-slate-400 text-sm max-w-md">The problem set will be revealed immediately when the tournament goes LIVE. Check back when the countdown hits zero!</p>
              </div>
            ) : (
              <div className="space-y-4">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Unlock className="h-5 w-5 text-green-400"/> Contest Problems</h3>
                 {t.problems?.map((prob, i) => (
                   <div key={i} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl hover:border-primary-500/30 transition-colors">
                     <div className="flex items-center gap-4">
                       <span className="text-lg font-bold text-slate-500">{i+1}</span>
                       <div>
                         <h4 className="text-white font-medium capitalize">{prob.replace(/-/g, ' ')}</h4>
                         <p className="text-xs text-slate-400 mt-1">10 Points • standard I/O</p>
                       </div>
                     </div>
                     <Button size="sm" variant="outline" disabled={t.status === 'COMPLETED' || !isJoined}>Solve</Button>
                   </div>
                 ))}
                 {(!t.problems || t.problems.length === 0) && <p className="text-slate-400">No problems available.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div>
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart className="h-5 w-5 text-primary-400"/> Live Leaderboard</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Auto-updating</span>
             </div>
             
             {leaderboard.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Trophy className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p>No submissions yet. The leaderboard is waiting for its first hero!</p>
                </div>
             ) : (
               <div className="overflow-hidden rounded-xl border border-slate-700/50">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-4 font-medium">Rank</th>
                       <th className="px-6 py-4 font-medium">Warrior</th>
                       <th className="px-6 py-4 font-medium text-right">Score</th>
                       <th className="px-6 py-4 font-medium text-right">Penalty</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700/50">
                     {leaderboard.map((entry, idx) => (
                       <tr key={idx} className="bg-slate-900/20 hover:bg-slate-800/40 transition-colors">
                         <td className="px-6 py-4">
                           {idx === 0 ? <Trophy className="h-5 w-5 text-yellow-400" /> : 
                            idx === 1 ? <Trophy className="h-5 w-5 text-slate-300" /> : 
                            idx === 2 ? <Trophy className="h-5 w-5 text-amber-600" /> : 
                            <span className="text-slate-400 font-bold ml-1">{idx + 1}</span>}
                         </td>
                         <td className="px-6 py-4 font-medium text-white">{entry.username}</td>
                         <td className="px-6 py-4 text-right font-bold text-primary-400">{entry.score}</td>
                         <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">{entry.timePenalty}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetails;
