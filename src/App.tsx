import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { UserProfile, OperationType } from './types';
import { Auth } from './components/Auth';
import { Quiz } from './components/Quiz';
import { Leaderboard } from './components/Leaderboard';
import { Shield, Brain, Zap, Github } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quiz' | 'leaderboard'>('quiz');

  // Connection test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        const userRef = doc(db, 'users', firebaseUser.uid);
        const privateRef = doc(db, 'users', firebaseUser.uid, 'private', 'settings');
        
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || '',
              score: 0,
              progress: 0,
              lastActive: new Date().toISOString(),
              role: 'user'
            };
            
            // Create public profile
            setDoc(userRef, initialProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, path));
            
            // Create private data
            setDoc(privateRef, { email: firebaseUser.email || '' })
              .catch(err => handleFirestoreError(err, OperationType.WRITE, `${path}/private/settings`));
            
            setUserProfile(initialProfile);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        });

        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProgressUpdate = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing QuizMaster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Brain className="text-black" size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">QuizMaster AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Quiz
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaderboard' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Leaderboard
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                <Zap className="text-amber-500" size={14} />
                <span className="text-xs font-mono font-bold text-zinc-300">{userProfile.score} pts</span>
              </div>
            )}
            <div className="w-px h-6 bg-zinc-800 hidden sm:block" />
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-100 transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!user ? (
          <Auth user={user} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-12">
              <div className="flex items-center gap-1 md:hidden bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 mb-8">
                <button 
                  onClick={() => setActiveTab('quiz')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
                >
                  Quiz
                </button>
                <button 
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaderboard' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
                >
                  Leaderboard
                </button>
              </div>

              {activeTab === 'quiz' ? (
                userProfile && <Quiz userProfile={userProfile} onProgressUpdate={handleProgressUpdate} />
              ) : (
                <Leaderboard />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <Auth user={user} />
              
              <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-emerald-500" size={20} />
                  <h4 className="font-bold text-zinc-100">Anti-Cheating System</h4>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Our system uses <span className="text-zinc-300 font-medium">Gemini AI</span> to analyze answers in real-time. Copy-pasting from external sources or using AI to generate answers is monitored.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-wider">AI Analysis</span>
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progress Lock</span>
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Secure Auth</span>
                </div>
              </div>

              {activeTab === 'quiz' && (
                <div className="hidden lg:block">
                  <Leaderboard />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-600 text-sm">
            © 2026 QuizMaster AI. Powered by Google Gemini.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
