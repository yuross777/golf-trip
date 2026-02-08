import { Home, FileText, Trophy, Luggage, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
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
        <h1 className="text-2xl font-bold text-green-700">NZ Golf Trip</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(language === 'en' ? 'ko' : 'en')}
        >
          <Globe className="w-5 h-5 mr-1" />
          {language.toUpperCase()}
        </Button>
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
