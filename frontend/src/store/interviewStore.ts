// src/store/interviewStore.ts
import { create } from 'zustand';
import type { InterviewSession, Question } from '../types';

interface InterviewState {
  session: InterviewSession | null;
  currentQuestionIndex: number;
  isRecording: boolean;
  transcript: string;
  submittedQuestions: Set<string>;

  setSession: (session: InterviewSession) => void;
  setCurrentQuestion: (index: number) => void;
  setRecording: (val: boolean) => void;
  setTranscript: (text: string) => void;
  markSubmitted: (questionId: string) => void;
  reset: () => void;

  // Computed
  currentQuestion: () => Question | null;
  progress: () => number;
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  session: null,
  currentQuestionIndex: 0,
  isRecording: false,
  transcript: '',
  submittedQuestions: new Set(),

  setSession: (session) => {
    // Find the first unanswered question
    const firstUnanswered = session.questions.findIndex((q) => !q.answered);
    set({
      session,
      currentQuestionIndex: firstUnanswered === -1 ? 0 : firstUnanswered,
      submittedQuestions: new Set(
        session.questions.filter((q) => q.answered).map((q) => q.id)
      ),
    });
  },

  setCurrentQuestion: (index) => set({ currentQuestionIndex: index, transcript: '' }),
  setRecording: (val) => set({ isRecording: val }),
  setTranscript: (text) => set({ transcript: text }),
  markSubmitted: (questionId) =>
    set((state) => ({ submittedQuestions: new Set([...state.submittedQuestions, questionId]) })),

  reset: () =>
    set({ session: null, currentQuestionIndex: 0, isRecording: false, transcript: '', submittedQuestions: new Set() }),

  currentQuestion: () => {
    const { session, currentQuestionIndex } = get();
    return session?.questions[currentQuestionIndex] ?? null;
  },

  progress: () => {
    const { session, submittedQuestions } = get();
    if (!session) return 0;
    return Math.round((submittedQuestions.size / session.totalQuestions) * 100);
  },
}));
