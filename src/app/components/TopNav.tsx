import { Home, FileText, Trophy, Luggage, Globe, LogOut, LogIn } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isGuest?: boolean;
}

export function TopNav({ activeTab, onTabChange, onLogout, isGuest = false }: TopNavProps) {
  const { t, language, setLanguage } = useLanguage();

  const tabs = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'scorecard', icon: FileText, label: t('scorecard') },
    { id: 'challenges', icon: Trophy, label: t('challenges') },
    { id: 'trips', icon: Luggage, label: t('trips') },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      {/* Top Bar with Logo and Language Toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* Kiwi Links Logo */}
        <div className="flex items-center gap-2">
          {/* Kiwi + Golf icon — 로그인 화면과 동일 */}
          <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="30" height="26" viewBox="0 0 96 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="34" cy="48" rx="27" ry="16" fill="#A0593E"/>
              <ellipse cx="54" cy="37" rx="12" ry="11" fill="#A0593E"/>
              <path d="M 12 46 Q 15 51 12 57" stroke="#7A3E28" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7"/>
              <path d="M 20 43 Q 23 49 20 56" stroke="#7A3E28" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7"/>
              <path d="M 28 41 Q 31 47 28 55" stroke="#7A3E28" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.6"/>
              <path d="M 36 40 Q 39 46 36 54" stroke="#7A3E28" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.55"/>
              <path d="M 44 40 Q 47 45 45 52" stroke="#7A3E28" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
              <circle cx="60" cy="32" r="3" fill="#120C06"/>
              <circle cx="61.2" cy="30.8" r="1.1" fill="white" fillOpacity="0.85"/>
              <path d="M 65 36 Q 75 31 84 27" stroke="#DDC99A" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
              <line x1="79" y1="24" x2="89" y2="31" stroke="#DDC99A" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="84" cy="12" r="7" fill="white" fillOpacity="0.95"/>
              <circle cx="80" cy="10" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="84" cy="8"  r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="88" cy="10" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="81" cy="14" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <circle cx="87" cy="14" r="1.2" fill="#ccc" fillOpacity="0.5"/>
              <line x1="26" y1="63" x2="20" y2="73" stroke="#9B7A55" strokeWidth="3.2" strokeLinecap="round"/>
              <line x1="38" y1="64" x2="43" y2="73" stroke="#9B7A55" strokeWidth="3.2" strokeLinecap="round"/>
            </svg>
          </div>
          {/* Title */}
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-black tracking-[0.55em] text-green-600 uppercase">Kiwi</span>
            <span className="text-[17px] font-black tracking-[0.12em] text-gray-900 uppercase leading-tight">Links</span>
            <div className="h-[2px] mt-[3px] w-full bg-gradient-to-r from-green-700 to-transparent rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
          >
            <Globe className="w-5 h-5 mr-1" />
            {language.toUpperCase()}
          </Button>
          {isGuest ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-green-700 hover:text-green-900 font-semibold text-xs"
            >
              <LogIn className="w-4 h-4 mr-1" />
              로그인
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-green-600 text-green-600 bg-green-50/50' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-sm ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
