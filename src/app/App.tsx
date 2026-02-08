import { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { TopNav } from './components/TopNav';
import { HomeScreen } from './components/HomeScreen';
import { CourseDetail } from './components/CourseDetail';
import { ScorecardScreen } from './components/ScorecardScreen';
import { ChallengesScreen } from './components/ChallengesScreen';
import { TripsScreen } from './components/TripsScreen';
import { Course } from './data/mockData';
import { Toaster } from './components/ui/sonner';

type View = 'home' | 'courseDetail' | 'scorecard' | 'challenges' | 'trips';

export default function App() {
  const [activeTab, setActiveTab] = useState<View>('home');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [preselectedCourseForScorecard, setPreselectedCourseForScorecard] = useState<Course | null>(null);

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
    setActiveTab(tab as View);
    if (tab !== 'courseDetail') {
      setSelectedCourse(null);
    }
    if (tab !== 'scorecard') {
      setPreselectedCourseForScorecard(null);
    }
  };

  const handleStartScorecard = (course: Course) => {
    setPreselectedCourseForScorecard(course);
    setActiveTab('scorecard');
  };

  return (
    <LanguageProvider>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Navigation */}
        <TopNav activeTab={activeTab === 'courseDetail' ? 'home' : activeTab} onTabChange={handleTabChange} />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'home' && (
            <HomeScreen
              onCourseClick={handleCourseClick}
              savedCourses={savedCourses}
              onSaveCourse={handleSaveCourse}
            />
          )}

          {activeTab === 'courseDetail' && selectedCourse && (
            <CourseDetail
              course={selectedCourse}
              onBack={handleBackToHome}
              onSave={handleSaveCourse}
              isSaved={savedCourses.has(selectedCourse.id)}
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
    </LanguageProvider>
  );
}
