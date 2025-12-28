'use client';

import { create } from 'zustand';

type AuthModalMode = 'signin' | 'signup' | null;

interface AuthModalStore {
  mode: AuthModalMode;
  openSignIn: () => void;
  openSignUp: () => void;
  close: () => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  mode: null,
  openSignIn: () => set({ mode: 'signin' }),
  openSignUp: () => set({ mode: 'signup' }),
  close: () => set({ mode: null }),
}));
