import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginScreen() {
  const { signInWithKakao, callbackError } = useAuth();
  const [lang, setLang] = useState<'en' | 'ko'>('ko');

  const text = {
    title: lang === 'ko' ? '뉴질랜드 골프 여행' : 'NZ Golf Trip',
    subtitle: lang === 'ko' ? '코스 탐색, 스코어 기록, 여행 계획' : 'Explore courses, track scores, plan trips',
    loginButton: lang === 'ko' ? '카카오로 로그인' : 'Login with Kakao',
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 bg-white"
        >
          {lang === 'ko' ? 'EN' : '한'}
        </button>
      </div>

      {/* Golf icon */}
      <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-6 shadow-lg">
        <span className="text-4xl">⛳</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{text.title}</h1>
      <p className="text-gray-500 text-sm text-center mb-10">{text.subtitle}</p>

      {/* Error from callback */}
      {callbackError && (
        <div className="mb-4 w-full max-w-xs bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-xs font-mono break-all">{callbackError}</p>
        </div>
      )}

      {/* Kakao login button — clicking redirects to Kakao login page */}
      <button
        onClick={signInWithKakao}
        className="flex items-center justify-center gap-3 w-full max-w-xs py-3 px-6 rounded-xl font-semibold text-gray-900 shadow-sm"
        style={{ backgroundColor: '#FEE500' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3C7.03 3 3 6.36 3 10.5c0 2.63 1.64 4.95 4.12 6.35l-.9 3.33c-.08.3.26.54.52.37L11.1 18c.29.02.59.03.9.03 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
            fill="#3C1E1E"
          />
        </svg>
        {text.loginButton}
      </button>
    </div>
  );
}
