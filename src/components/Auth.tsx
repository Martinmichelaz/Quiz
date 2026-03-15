import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthProps {
  user: any;
}

export const Auth: React.FC<AuthProps> = ({ user }) => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4 p-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
              <User className="text-zinc-400" size={20} />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-zinc-100">{user.displayName}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-xl">
        <LogIn className="text-emerald-500" size={32} />
      </div>
      <h1 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight">QuizMaster AI</h1>
      <p className="text-zinc-500 mb-8 max-w-md">
        Connect your account to start the challenge, track your progress, and climb the global leaderboard.
      </p>
      <button
        onClick={handleLogin}
        className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
      >
        <LogIn size={20} />
        Sign in with Google
      </button>
    </div>
  );
};
