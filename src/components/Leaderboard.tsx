import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { UserProfile, OperationType } from '../types';
import { Trophy, Medal, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const Leaderboard: React.FC = () => {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = 'users';
    const q = query(
      collection(db, path),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as UserProfile);
      });
      setLeaders(users);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Trophy className="text-amber-500" size={20} />
          Global Leaderboard
        </h3>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Top 10 Players</span>
      </div>
      
      <div className="divide-y divide-zinc-800/50">
        {leaders.map((leader, index) => (
          <motion.div
            key={leader.uid}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="w-8 text-center font-mono text-sm font-bold text-zinc-500">
              {index === 0 ? <Medal className="text-amber-500 mx-auto" size={20} /> : 
               index === 1 ? <Medal className="text-zinc-400 mx-auto" size={20} /> :
               index === 2 ? <Medal className="text-amber-700 mx-auto" size={20} /> :
               index + 1}
            </div>
            
            {leader.photoURL ? (
              <img src={leader.photoURL} alt={leader.displayName} className="w-10 h-10 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <UserIcon className="text-zinc-500" size={16} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-100 truncate">{leader.displayName}</p>
              <p className="text-xs text-zinc-500">Level {Math.floor(leader.progress / 5) + 1}</p>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-mono font-bold text-emerald-500">{leader.score}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">Points</p>
            </div>
          </motion.div>
        ))}
        
        {leaders.length === 0 && (
          <div className="p-12 text-center text-zinc-500 italic">
            No players yet. Be the first to join!
          </div>
        )}
      </div>
    </div>
  );
};
