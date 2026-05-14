import React, { useState, useEffect } from 'react';
import { History, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const REASON_LABELS = {
  SIGNUP: 'Welcome Bonus',
  JOIN_MATCH: 'Match Entry Fee',
  MATCH_WIN: 'Match Victory Reward',
  MATCH_LOSS: 'Match Defeat Penalty',
  DAILY_BONUS: 'Daily Login Bonus'
};

const Ledger = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const { data } = await api.get('/wallet/ledger');
        setTransactions(data.data.transactions);
      } catch (err) {
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  return (
    <div className="px-4 py-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <History className="h-7 w-7 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Ledger</h1>
          </div>
          <p className="text-slate-500 text-sm">Your complete coin transaction history.</p>
        </div>
        
        <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-4 self-start sm:self-center">
          <div>
            <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-3xl font-black text-yellow-400">{user?.coins || 0} <span className="text-sm font-medium text-slate-400">Coins</span></p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-400">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reason</th>
                  <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Clock className="h-4 w-4 text-slate-500" />
                          {new Date(tx.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-white">{REASON_LABELS[tx.reason] || tx.reason}</p>
                        {tx.matchId && <p className="text-xs text-slate-500 font-mono mt-0.5">Match: {tx.matchId}</p>}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold border ${
                          isPositive 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <Icon className="h-4 w-4" />
                          {isPositive ? '+' : ''}{tx.amount}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;
