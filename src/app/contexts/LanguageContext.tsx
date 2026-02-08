import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ko';

interface Translations {
  [key: string]: {
    en: string;
    ko: string;
  };
}

const translations: Translations = {
  // Navigation
  home: { en: 'Home', ko: '홈' },
  map: { en: 'Map', ko: '지도' },
  scorecard: { en: 'Scorecard', ko: '스코어카드' },
  challenges: { en: 'Challenges', ko: '챌린지' },
  trips: { en: 'Trips', ko: '여행' },
  saved: { en: 'Saved', ko: '저장됨' },
  
  // Home Screen
  searchPlaceholder: { en: 'Search course or region', ko: '코스 또는 지역 검색' },
  island: { en: 'Island', ko: '섬' },
  all: { en: 'All', ko: '전체' },
  north: { en: 'North', ko: '북섬' },
  south: { en: 'South', ko: '남섬' },
  priceTier: { en: 'Price', ko: '가격' },
  value: { en: 'Value', ko: '가성비' },
  mid: { en: 'Mid', ko: '중급' },
  premium: { en: 'Premium', ko: '프리미엄' },
  tags: { en: 'Tags', ko: '태그' },
  view: { en: 'View', ko: '뷰' },
  links: { en: 'Links', ko: '링크스' },
  resort: { en: 'Resort', ko: '리조트' },
  city: { en: 'City', ko: '도시' },
  local: { en: 'Local', ko: '로컬' },
  sort: { en: 'Sort', ko: '정렬' },
  recommended: { en: 'Recommended', ko: '추천' },
  priceLow: { en: 'Price: Low', ko: '가격: 낮은순' },
  nearest: { en: 'Nearest', ko: '가까운순' },
  moreFilters: { en: 'More Filters', ko: '더 많은 필터' },
  
  // Course Detail
  details: { en: 'Details', ko: '상세정보' },
  save: { en: 'Save', ko: '저장' },
  openInMaps: { en: 'Open in Google Maps', ko: 'Google 지도에서 열기' },
  bookTeeTime: { en: 'Book Tee Time', ko: '예약하기' },
  overview: { en: 'Overview', ko: '개요' },
  stays: { en: 'Stays', ko: '숙박' },
  food: { en: 'Food', ko: '식당' },
  shopping: { en: 'Shopping', ko: '쇼핑' },
  tour: { en: 'Tour', ko: '관광' },
  location: { en: 'Location', ko: '위치' },
  price: { en: 'Price', ko: '가격' },
  copyAddress: { en: 'Copy Address', ko: '주소 복사' },
  openMap: { en: 'Open Map', ko: '지도 열기' },
  directions: { en: 'Directions', ko: '길찾기' },
  call: { en: 'Call', ko: '전화' },
  website: { en: 'Website', ko: '웹사이트' },
  distanceKm: { en: 'km', ko: 'km' },
  
  // Stays
  openAirbnbSearch: { en: 'Open Airbnb Search Near This Course', ko: '이 코스 근처 Airbnb 검색' },
  nearbyStays: { en: 'Nearby Stays', ko: '근처 숙박' },
  
  // Food
  nearbyRestaurants: { en: 'Nearby Restaurants', ko: '근처 레스토랑' },
  
  // Shopping
  nearbyMarkets: { en: 'Nearby Markets', ko: '근처 마켓' },
  golfMarkets: { en: 'Golf Markets', ko: '골프 마켓' },
  golfStores: { en: 'Golf Stores', ko: '골프 상점' },
  
  // Tour
  nearbyAttractions: { en: 'Nearby Attractions', ko: '근처 명소' },
  
  // Scorecard
  startScorecard: { en: 'Start Scorecard', ko: '스코어카드 시작' },
  viewPastRounds: { en: 'View Past Rounds', ko: '지난 라운드 보기' },
  myRounds: { en: 'My Rounds', ko: '내 라운드' },
  createRound: { en: 'Create Round', ko: '라운드 생성' },
  selectCourse: { en: 'Select Course', ko: '코스 선택' },
  date: { en: 'Date', ko: '날짜' },
  players: { en: 'Players', ko: '플레이어' },
  addPlayer: { en: 'Add Player', ko: '플레이어 추가' },
  teeType: { en: 'Tee Type', ko: '티 타입' },
  notes: { en: 'Notes', ko: '메모' },
  totalScore: { en: 'Total Score', ko: '총 스코어' },
  front9: { en: 'Front 9', ko: '전반 9홀' },
  back9: { en: 'Back 9', ko: '후반 9홀' },
  putts: { en: 'Putts', ko: '퍼트' },
  addMedia: { en: 'Add Photos/Videos', ko: '사진/동영상 추가' },
  saveRound: { en: 'Save Round', ko: '라운드 저장' },
  editScore: { en: 'Edit Score', ko: '스코어 편집' },
  shareRound: { en: 'Share Round', ko: '라운드 공유' },
  deleteRound: { en: 'Delete Round', ko: '라운드 삭제' },
  uploadMedia: { en: 'Upload Media', ko: '미디어 업로드' },
  selectFiles: { en: 'Select Files', ko: '파일 선택' },
  
  // Challenges
  activeChallenges: { en: 'Active Challenges', ko: '활성 챌린지' },
  completedChallenges: { en: 'Completed Challenges', ko: '완료된 챌린지' },
  nearestToPin: { en: 'Nearest to the Pin', ko: '핀 근접 대회' },
  viewShot: { en: 'View Shot Challenge', ko: '뷰 샷 챌린지' },
  blowUpHole: { en: 'Blow-Up Hole', ko: '블로우업 홀' },
  iceMan: { en: 'Ice Man Challenge', ko: '아이스맨 챌린지' },
  windMaster: { en: 'Wind Master', ko: '바람의 마스터' },
  sheepRule: { en: 'Sheep Rule', ko: '양 규칙' },
  gentlemanHole: { en: 'Gentleman Hole', ko: '신사 홀' },
  zenShot: { en: 'Zen Shot', ko: '젠 샷' },
  bestBall: { en: 'Best Ball Lite', ko: '베스트 볼 라이트' },
  strategyHole: { en: 'Strategy Hole', ko: '전략 홀' },
  todaysTitles: { en: "Today's Titles", ko: '오늘의 타이틀' },
  driverOfDay: { en: 'Driver of the Day', ko: '오늘의 드라이버' },
  mentalChampion: { en: 'Mental Champion', ko: '멘탈 챔피언' },
  bestViewAward: { en: 'Best View Award', ko: '베스트 뷰 상' },
  recordResult: { en: 'Record Result', ko: '결과 기록' },
  uploadProof: { en: 'Upload Proof Photo', ko: '증거 사진 업로드' },
  
  // Trips
  myTrips: { en: 'My Trips', ko: '내 여행' },
  createTrip: { en: 'Create Trip', ko: '여행 만들기' },
  tripName: { en: 'Trip Name', ko: '여행 이름' },
  startDate: { en: 'Start Date', ko: '시작 날짜' },
  endDate: { en: 'End Date', ko: '종료 날짜' },
  baseCity: { en: 'Base City', ko: '기준 도시' },
  inviteFriends: { en: 'Invite Friends', ko: '친구 초대' },
  manageMembers: { en: 'Manage Members', ko: '멤버 관리' },
  members: { en: 'Members', ko: '멤버' },
  inviteLink: { en: 'Invite Link', ko: '초대 링크' },
  copyLink: { en: 'Copy Link', ko: '링크 복사' },
  regenerateLink: { en: 'Regenerate Link', ko: '링크 재생성' },
  qrCode: { en: 'QR Code', ko: 'QR 코드' },
  expiresOn: { en: 'Expires on', ko: '만료일' },
  joinTrip: { en: 'Join Trip', ko: '여행 참가' },
  
  // Common
  cancel: { en: 'Cancel', ko: '취소' },
  confirm: { en: 'Confirm', ko: '확인' },
  close: { en: 'Close', ko: '닫기' },
  back: { en: 'Back', ko: '뒤로' },
  next: { en: 'Next', ko: '다음' },
  submit: { en: 'Submit', ko: '제출' },
  loading: { en: 'Loading...', ko: '로딩 중...' },
  noResults: { en: 'No results found', ko: '결과가 없습니다' },
  
  // Messages
  savedSuccess: { en: 'Saved successfully', ko: '저장되었습니다' },
  copiedToClipboard: { en: 'Copied to clipboard', ko: '클립보드에 복사됨' },
  featureComingSoon: { en: 'This feature is coming soon', ko: '이 기능은 곧 제공됩니다' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
