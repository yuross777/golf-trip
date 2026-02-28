import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { TopNav } from './components/TopNav';
import { HomeScreen } from './components/HomeScreen';
import { CourseDetail } from './components/CourseDetail';
import { ScorecardScreen } from './components/ScorecardScreen';
import { ChallengesScreen } from './components/ChallengesScreen';
import { TripsScreen } from './components/TripsScreen';
import { Course, mockCourses } from './data/mockData';
import { Toaster } from './components/ui/sonner';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

type View = 'home' | 'courseDetail' | 'scorecard' | 'challenges' | 'trips';

// 로그인 없이 접근 가능한 탭
const GUEST_ALLOWED_TABS: View[] = ['home', 'courseDetail'];

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [guestMode, setGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState<View>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [preselectedCourseForScorecard, setPreselectedCourseForScorecard] = useState<Course | null>(null);
  const [userCourses, setUserCourses] = useState<Course[]>([]);

  const allCourses = useMemo(() => [...mockCourses, ...userCourses], [userCourses]);

  // Load saved courses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedCourses');
    if (saved) {
      setSavedCourses(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save to localStorage whenever savedCourses changes
  useEffect(() => {
    localStorage.setItem('savedCourses', JSON.stringify(Array.from(savedCourses)));
  }, [savedCourses]);

  // Load user-added courses from Firestore
  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then(snapshot => {
        const courses = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Course));
        setUserCourses(courses);
      })
      .catch(err => console.error('Failed to load user courses:', err));
  }, []);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('courseDetail');
  };

  const handleBackToHome = () => {
    setSelectedCourse(null);
    setActiveTab('home');
  };

  const handleSaveCourse = (courseId: string) => {
    const newSaved = new Set(savedCourses);
    if (newSaved.has(courseId)) {
      newSaved.delete(courseId);
    } else {
      newSaved.add(courseId);
    }
    setSavedCourses(newSaved);
  };

  const handleTabChange = (tab: string) => {
    const view = tab as View;

    // 게스트 모드에서 잠긴 탭 클릭 시
    if (!user && guestMode && !GUEST_ALLOWED_TABS.includes(view)) {
      toast('로그인이 필요한 서비스입니다', {
        action: { label: '로그인', onClick: () => setGuestMode(false) },
      });
      return;
    }

    setActiveTab(view);
    if (tab !== 'courseDetail') setSelectedCourse(null);
    if (tab !== 'scorecard') setPreselectedCourseForScorecard(null);
  };

  const handleStartScorecard = (course: Course) => {
    setPreselectedCourseForScorecard(course);
    setActiveTab('scorecard');
  };

  // 로그아웃 — 게스트 모드도 함께 해제
  const handleLogout = async () => {
    setGuestMode(false);
    if (user) await logout();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !guestMode) {
    return <LoginScreen onBrowseWithoutLogin={() => setGuestMode(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab === 'courseDetail' ? 'home' : activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        isGuest={!user && guestMode}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && (
          <HomeScreen
            courses={allCourses}
            onCourseClick={handleCourseClick}
            savedCourses={savedCourses}
            onSaveCourse={handleSaveCourse}
            onCourseAdded={(course) => setUserCourses(prev => [course, ...prev])}
          />
        )}

        {activeTab === 'courseDetail' && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onBack={handleBackToHome}
            onSave={handleSaveCourse}
            isSaved={savedCourses.has(String(selectedCourse.id))}
            onStartScorecard={handleStartScorecard}
          />
        )}

        {activeTab === 'scorecard' && (
          <ScorecardScreen
            preselectedCourse={preselectedCourseForScorecard}
            onClearPreselection={() => setPreselectedCourseForScorecard(null)}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesScreen />
        )}

        {activeTab === 'trips' && (
          <TripsScreen />
        )}
      </div>

      {/* Toast Notifications */}
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
