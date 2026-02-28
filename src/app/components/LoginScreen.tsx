import { useState } from 'react';
import { Map, ClipboardList, Luggage, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginScreenProps {
  onBrowseWithoutLogin: () => void;
}

export function LoginScreen({ onBrowseWithoutLogin }: LoginScreenProps) {
  const { signInWithKakao, callbackError } = useAuth();
  const [lang, setLang] = useState<'en' | 'ko'>('ko');

  const text = {
    title: lang === 'ko' ? 'Kiwi Links' : 'Kiwi Links',
    loginButton: lang === 'ko' ? '카카오로 로그인' : 'Login with Kakao',
    browseButton: lang === 'ko' ? '로그인 없이 코스 탐색' : 'Explore Courses — No Sign-In Needed',
    features: {
      course: lang === 'ko' ? '코스 탐색' : 'Courses',
      score: lang === 'ko' ? '스코어' : 'Scorecard',
      trip: lang === 'ko' ? '여행 계획' : 'Trips',
    },
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-emerald-900 via-green-700 to-green-500">

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes nzgt-float-a {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(6deg); }
        }
        @keyframes nzgt-float-b {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-8deg); }
        }
        @keyframes nzgt-float-c {
          0%, 100% { transform: translateY(0px); }
          33% { transform: translateY(-10px); }
          66% { transform: translateY(6px); }
        }
      `}</style>

      {/* Floating background decorations */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <span className="absolute top-[10%] left-[7%]  text-4xl opacity-[0.12]" style={{ animation: 'nzgt-float-a 4.0s ease-in-out infinite 0.0s' }}>⛳</span>
        <span className="absolute top-[22%] right-[9%]  text-3xl opacity-[0.10]" style={{ animation: 'nzgt-float-b 5.0s ease-in-out infinite 1.0s' }}>⛳</span>
        <span className="absolute top-[48%] left-[5%]  text-2xl opacity-[0.10]" style={{ animation: 'nzgt-float-c 6.0s ease-in-out infinite 2.0s' }}>🏌️</span>
        <span className="absolute top-[14%] left-[42%] text-2xl opacity-[0.08]" style={{ animation: 'nzgt-float-a 7.0s ease-in-out infinite 0.5s' }}>⚪</span>
        <span className="absolute top-[60%] right-[7%]  text-xl  opacity-[0.08]" style={{ animation: 'nzgt-float-b 3.8s ease-in-out infinite 1.5s' }}>⚪</span>
        <span className="absolute top-[32%] right-[22%] text-xl  opacity-[0.07]" style={{ animation: 'nzgt-float-c 5.5s ease-in-out infinite 3.0s' }}>🌿</span>
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
          className="text-sm text-white/80 hover:text-white px-3 py-1 rounded border border-white/30 bg-white/10 backdrop-blur-sm transition-colors"
        >
          {lang === 'ko' ? 'EN' : 'KR'}
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-36">

        {/* Golf icon with ping pulse */}
        <div className="relative mb-7">
          <div
            className="absolute inset-0 rounded-full bg-white/25 animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
            {/* Kiwi + Golf abstract mark */}
            <svg width="68" height="60" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body — 가로로 길쭉한 키위 몸통 */}
              <ellipse cx="34" cy="48" rx="27" ry="16" fill="#7D4632"/>
              {/* Head — 몸통 앞쪽에 붙은 머리 */}
              <ellipse cx="54" cy="37" rx="12" ry="11" fill="#7D4632"/>

              {/* 깃털 텍스처 — 수직 곡선 스트로크 */}
              <path d="M 12 46 Q 15 51 12 57" stroke="#5A3020" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.6"/>
              <path d="M 20 43 Q 23 49 20 56" stroke="#5A3020" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.6"/>
              <path d="M 28 41 Q 31 47 28 55" stroke="#5A3020" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
              <path d="M 36 40 Q 39 46 36 54" stroke="#5A3020" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
              <path d="M 44 40 Q 47 45 45 52" stroke="#5A3020" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.45"/>
              <path d="M 46 29 Q 49 33 47 38" stroke="#5A3020" strokeWidth="1.0" strokeLinecap="round" fill="none" opacity="0.4"/>

              {/* 눈 */}
              <circle cx="60" cy="32" r="3" fill="#120C06"/>
              <circle cx="61.2" cy="30.8" r="1.1" fill="white" fillOpacity="0.85"/>

              {/* 부리 = 골프 클럽 샤프트 (길고 직선적) */}
              <path d="M 65 36 Q 75 31 84 27" stroke="#DDC99A" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
              {/* 클럽 헤드 (iron) */}
              <line x1="79" y1="24" x2="89" y2="31" stroke="#DDC99A" strokeWidth="5" strokeLinecap="round"/>

              {/* 골프공 — 클럽 헤드 위에 위치 */}
              <circle cx="84" cy="12" r="7" fill="white" fillOpacity="0.95"/>
              <circle cx="84" cy="12" r="7" stroke="rgba(180,180,180,0.3)" strokeWidth="0.5"/>
              {/* 딤플 */}
              <circle cx="80" cy="10" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="84" cy="8"  r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="88" cy="10" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="81" cy="14" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="87" cy="14" r="1.2" fill="#ccc" fillOpacity="0.5"/>

              {/* 다리 — 굵고 짧게 */}
              <line x1="26" y1="63" x2="20" y2="73" stroke="#9B7A55" strokeWidth="3.2" strokeLinecap="round"/>
              <line x1="38" y1="64" x2="43" y2="73" stroke="#9B7A55" strokeWidth="3.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white tracking-tight mb-7 text-center drop-shadow-md">
          {text.title}
        </h1>

        {/* Feature cards */}
        <div className="flex gap-2 mb-8" style={{ width: '340px' }}>

          {/* 코스탐색 — GUEST (active) */}
          <button
            onClick={onBrowseWithoutLogin}
            style={{ width: '108px', minWidth: '108px' }}
            className="flex flex-col items-center gap-1.5 bg-white/25 backdrop-blur-sm border border-white/50 rounded-2xl py-3 shadow-lg active:scale-95 transition-transform"
          >
            <Map className="w-6 h-6 text-white" />
            <span className="text-white text-[11px] font-bold whitespace-nowrap">{text.features.course}</span>
            <span className="text-emerald-200 text-[9px] font-black tracking-widest px-1.5 py-0.5 bg-emerald-500/40 rounded-full whitespace-nowrap">GUEST</span>
          </button>

          {/* 스코어 — 잠금 */}
          <div
            style={{ width: '108px', minWidth: '108px' }}
            className="flex flex-col items-center gap-1.5 bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl py-3 opacity-55"
          >
            <ClipboardList className="w-6 h-6 text-white/70" />
            <span className="text-white/70 text-[11px] font-bold whitespace-nowrap">{text.features.score}</span>
            <Lock className="w-3.5 h-3.5 text-white/50" />
          </div>

          {/* 여행계획 — 잠금 */}
          <div
            style={{ width: '108px', minWidth: '108px' }}
            className="flex flex-col items-center gap-1.5 bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl py-3 opacity-55"
          >
            <Luggage className="w-6 h-6 text-white/70" />
            <span className="text-white/70 text-[11px] font-bold whitespace-nowrap">{text.features.trip}</span>
            <Lock className="w-3.5 h-3.5 text-white/50" />
          </div>

        </div>

        {/* Error */}
        {callbackError && (
          <div className="mb-4 w-full max-w-xs bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-600 text-xs font-mono break-all">{callbackError}</p>
          </div>
        )}

        {/* Kakao login button */}
        <button
          onClick={signInWithKakao}
          className="flex items-center justify-center gap-3 w-full max-w-xs py-3.5 px-6 rounded-xl font-bold text-gray-900 shadow-lg hover:shadow-yellow-400/50 active:scale-[0.97] transition-all duration-150"
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

        {/* Browse without login */}
        <button
          onClick={onBrowseWithoutLogin}
          className="mt-4 flex items-center gap-1.5 text-white/65 hover:text-white text-sm transition-colors"
        >
          {text.browseButton}
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

      {/* SVG Wave layers — 3 depths */}
      <div className="absolute bottom-0 left-0 right-0">

        {/* Wave 1 — back, slowest (10s) */}
        <svg viewBox="0 0 1440 180" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path fill="rgba(21,128,61,0.45)">
            <animate
              attributeName="d"
              dur="10s"
              repeatCount="indefinite"
              values="
                M0,110 C360,160 720,50 1080,110 C1260,140 1350,65 1440,85 L1440,180 L0,180 Z;
                M0,85 C360,50 720,160 1080,85 C1260,55 1350,140 1440,110 L1440,180 L0,180 Z;
                M0,110 C360,160 720,50 1080,110 C1260,140 1350,65 1440,85 L1440,180 L0,180 Z
              "
            />
          </path>
        </svg>

        {/* Wave 2 — middle (8s) */}
        <svg viewBox="0 0 1440 140" xmlns="http://www.w3.org/2000/svg" className="w-full block absolute bottom-0">
          <path fill="rgba(22,163,74,0.55)">
            <animate
              attributeName="d"
              dur="8s"
              repeatCount="indefinite"
              values="
                M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,140 L0,140 Z;
                M0,55 C240,105 480,15 720,55 C960,105 1200,15 1440,55 L1440,140 L0,140 Z;
                M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,140 L0,140 Z
              "
            />
          </path>
        </svg>

        {/* Wave 3 — front, fastest (6s) */}
        <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="w-full block absolute bottom-0">
          <path fill="rgba(20,83,45,0.85)">
            <animate
              attributeName="d"
              dur="6s"
              repeatCount="indefinite"
              values="
                M0,55 C360,95 720,15 1080,55 C1260,75 1350,25 1440,45 L1440,100 L0,100 Z;
                M0,40 C360,10 720,80 1080,40 C1260,20 1350,75 1440,55 L1440,100 L0,100 Z;
                M0,55 C360,95 720,15 1080,55 C1260,75 1350,25 1440,45 L1440,100 L0,100 Z
              "
            />
          </path>
        </svg>

      </div>
    </div>
  );
}
