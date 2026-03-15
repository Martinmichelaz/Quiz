import React, { useState, useEffect, useRef } from 'react';
import { Question, UserProfile, OperationType } from '../types';
import { checkAnswer } from '../services/geminiService';
import { db, handleFirestoreError } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Send, CheckCircle2, XCircle, Loader2, HelpCircle, Trophy, FastForward, Star } from 'lucide-react';
import questionsData from '../questions.json';
import confetti from 'canvas-confetti';

interface QuizProps {
  userProfile: UserProfile;
  onProgressUpdate: (newProfile: UserProfile) => void;
}

export const Quiz: React.FC<QuizProps> = ({ userProfile, onProgressUpdate }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; score: number; message: string } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const questions = questionsData as Question[];
    if (userProfile.progress < questions.length) {
      setCurrentQuestion(questions[userProfile.progress]);
      setIsFinished(false);
    } else {
      setIsFinished(true);
    }
  }, [userProfile.progress]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const triggerShake = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || !answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const path = `users/${userProfile.uid}`;
    try {
      const result = await checkAnswer(currentQuestion.question, answer);
      
      if (result.isCorrect) {
        triggerConfetti();
        const newScore = userProfile.score + result.score;
        const newProgress = userProfile.progress + 1;
        
        const updatedProfile = {
          ...userProfile,
          score: newScore,
          progress: newProgress,
          lastActive: new Date().toISOString()
        };

        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, {
          score: newScore,
          progress: newProgress,
          lastActive: updatedProfile.lastActive
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, path));

        setFeedback({
          isCorrect: true,
          score: result.score,
          message: result.feedback
        });

        setTimeout(() => {
          onProgressUpdate(updatedProfile);
          setAnswer('');
          setFeedback(null);
        }, 4000);
      } else {
        await triggerShake();
        setFeedback({
          isCorrect: false,
          score: 0,
          message: result.feedback
        });
      }
    } catch (error) {
      console.error("Error submitting answer", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    const path = `users/${userProfile.uid}`;
    try {
      const newProgress = userProfile.progress + 1;
      const newScore = Math.max(0, userProfile.score - 5);
      const updatedProfile = {
        ...userProfile,
        score: newScore,
        progress: newProgress,
        lastActive: new Date().toISOString()
      };

      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        score: newScore,
        progress: newProgress,
        lastActive: updatedProfile.lastActive
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, path));

      onProgressUpdate(updatedProfile);
      setAnswer('');
      setFeedback(null);
    } catch (error) {
      console.error("Error skipping question", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (userProfile.progress / questionsData.length) * 100;

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <Trophy className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">اكتمل الاختبار!</h2>
        <p className="text-zinc-400 mb-8 max-w-md">
          لقد أجبت على جميع الأسئلة المتاحة. مجموع نقاطك هو <span className="text-emerald-500 font-bold">{userProfile.score}</span>.
          تحقق من لوحة المتصدرين لمعرفة مركزك!
        </p>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">إجمالي النقاط</p>
            <p className="text-2xl font-mono text-zinc-100">{userProfile.score}</p>
          </div>
          <div className="px-6 py-3 bg-zinc-800 rounded-xl border border-zinc-700">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">المركز</p>
            <p className="text-2xl font-mono text-zinc-100">#--</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">تقدمك في المسابقة</span>
          <span className="text-[10px] font-mono text-emerald-500 font-bold">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          />
        </div>
      </div>

      <motion.div animate={controls}>
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">السؤال {userProfile.progress + 1} من {questionsData.length}</p>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight leading-tight">{currentQuestion.question}</h2>
          </div>
          <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0 shadow-lg">
            <HelpCircle className="text-zinc-500" size={28} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-zinc-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="اكتب إجابتك هنا..."
              className="relative w-full h-48 p-8 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-all resize-none text-right text-lg leading-relaxed"
              disabled={isSubmitting || !!feedback?.isCorrect}
              dir="rtl"
            />
            <div className="absolute bottom-6 left-6 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
              {answer.length} حرف
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !answer.trim() || !!feedback?.isCorrect}
              className="w-full sm:flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-900 disabled:text-zinc-700 disabled:border-zinc-800 disabled:shadow-none text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] order-2 sm:order-1 border-b-4 border-emerald-700 hover:border-emerald-600"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} className="rotate-180" />
              )}
              {isSubmitting ? 'جاري التحقق من الإجابة...' : 'إرسال الإجابة'}
            </button>
            
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting || !!feedback?.isCorrect}
              className="w-full sm:w-auto px-8 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold rounded-2xl transition-all border border-zinc-800 active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2"
            >
              <FastForward size={18} className="rotate-180" />
              تخطي (-5 نقاط)
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={feedback.isCorrect ? 'success' : 'error'}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`mt-10 p-8 rounded-3xl border-2 shadow-2xl ${
              feedback.isCorrect 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 shadow-emerald-900/10' 
                : 'bg-rose-500/5 border-rose-500/20 text-rose-400 shadow-rose-900/10'
            }`}
          >
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                feedback.isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              }`}>
                {feedback.isCorrect ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <XCircle size={32} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-xl">
                    {feedback.isCorrect ? 'إجابة رائعة!' : 'تحتاج للمراجعة'}
                  </p>
                  {feedback.isCorrect && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 rounded-full">
                      <Star size={12} className="fill-emerald-500" />
                      <span className="text-xs font-bold">+{feedback.score} نقطة</span>
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 leading-relaxed mb-4">{feedback.message}</p>
                {!feedback.isCorrect && (
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">تلميح للمساعدة</p>
                    <p className="text-sm text-zinc-300 italic">{currentQuestion.hint}</p>
                  </div>
                )}
                {feedback.isCorrect && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-500/60">
                    <Loader2 className="animate-spin" size={12} />
                    جاري الانتقال للسؤال التالي...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
