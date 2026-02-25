import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  callbackError: string | null;
  signInWithKakao: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    // Handle Kakao OAuth redirect callback (?code=...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Remove code from URL immediately so refresh doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);

      const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
      fetch(`${functionsUrl}/kakaoAuth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: window.location.origin }),
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
          return data;
        })
        .then(({ customToken }) => signInWithCustomToken(auth, customToken))
        .catch((err) => {
          console.error('Kakao auth callback failed:', err);
          setCallbackError(String(err?.message ?? err));
          setLoading(false);
        });
    }

    // Subscribe to Firebase Auth state — this resolves loading for all cases
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithKakao = () => {
    const url = new URL('https://kauth.kakao.com/oauth/authorize');
    url.searchParams.set('client_id', import.meta.env.VITE_KAKAO_REST_API_KEY);
    url.searchParams.set('redirect_uri', window.location.origin);
    url.searchParams.set('response_type', 'code');
    window.location.href = url.toString();
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, callbackError, signInWithKakao, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
