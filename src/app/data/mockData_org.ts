export interface Course {
  id: string;
  name: string;
  island: 'North' | 'South';
  region: string;
  address: string;
  lat: number;
  lng: number;
  price_min_nzd: number;
  price_max_nzd: number;
  tags: string[];
  booking_url: string;
  website_url: string;
  image: string;
  description: string;
  photo_url: string;
}

export interface Place {
  id: string;
  course_id: string;
  category: 'stay' | 'restaurant' | 'market' | 'golf_market' | 'golf_store' | 'tour_spot';
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  price_level: number;
  phone?: string;
  website_url?: string;
  distance_km: number;
}

export interface Round {
  id: string;
  course_id: string;
  course_name: string;
  played_at: string;
  players: string[];
  tee_type: string;
  total_score: number;
  front9_score?: number;
  back9_score?: number;
  putts_total?: number;
  notes: string;
  media: Media[];
}

export interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnail_url: string;
  caption: string;
}

export interface Challenge {
  id: string;
  type: string;
  title: { en: string; ko: string };
  description: { en: string; ko: string };
  icon: string;
  category: 'play' | 'nature' | 'fun' | 'team' | 'daily';
}

export interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  base_city: string;
  members: string[];
  invite_token: string;
  created_at: string;
}

export const mockCourses: Course[] = [
  {
    id: '1',
    name: "Cape Kidnappers",
    island: 'North',
    region: 'Hawke\'s Bay',
    address: '446 Clifton Road, Te Awanga, Hawke\'s Bay',
    lat: -39.6504,
    lng: 177.0893,
    price_min_nzd: 495,
    price_max_nzd: 695,
    tags: ['premium', 'view', 'links', 'resort'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://capekidnappers.com',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
    description: 'Dramatic clifftop course ranked among the world\'s best. Stunning ocean views.'
  },
  {
    id: '2',
    name: "Jack's Point",
    island: 'South',
    region: 'Queenstown',
    address: 'Jack\'s Point, Queenstown',
    lat: -45.0581,
    lng: 168.7977,
    price_min_nzd: 295,
    price_max_nzd: 395,
    tags: ['premium', 'view', 'resort'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://jackspoint.com',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
    description: 'Mountain and lake vistas. One of NZ\'s most scenic courses.'
  },
  {
    id: '3',
    name: "Kauri Cliffs",
    island: 'North',
    region: 'Bay of Islands',
    address: '145 Tepene Tablelands Road, Matauri Bay',
    lat: -35.0156,
    lng: 173.9736,
    price_min_nzd: 495,
    price_max_nzd: 695,
    tags: ['premium', 'view', 'links', 'resort'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://kauricliffs.com',
    image: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800',
    description: 'Clifftop holes overlooking the Pacific. World-class resort course.'
  },
  {
    id: '4',
    name: "Millbrook Resort",
    island: 'South',
    region: 'Queenstown',
    address: '1124 Malaghans Road, Arrowtown',
    lat: -44.9633,
    lng: 168.7842,
    price_min_nzd: 195,
    price_max_nzd: 295,
    tags: ['mid', 'resort', 'view'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://millbrook.co.nz',
    image: 'https://images.unsplash.com/photo-1591491034931-48d52e148d2e?w=800',
    description: '27 holes set among the Remarkables mountain range.'
  },
  {
    id: '5',
    name: "Gulf Harbour Country Club",
    island: 'North',
    region: 'Auckland',
    address: 'Gulf Harbour Drive, Whangaparaoa',
    lat: -36.6147,
    lng: 174.8028,
    price_min_nzd: 95,
    price_max_nzd: 145,
    tags: ['mid', 'city', 'view'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://gulfharbour.co.nz',
    image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
    description: 'Coastal course near Auckland with harbor views.'
  },
  {
    id: '6',
    name: "Clearwater Golf Club",
    island: 'South',
    region: 'Christchurch',
    address: '151 Clearwater Avenue, Christchurch',
    lat: -43.4527,
    lng: 172.5643,
    price_min_nzd: 125,
    price_max_nzd: 175,
    tags: ['mid', 'value', 'city'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://clearwatergolf.co.nz',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
    description: 'Championship course with lakes and mountains backdrop.'
  },
  {
    id: '7',
    name: "Paraparaumu Beach Golf Club",
    island: 'North',
    region: 'Wellington',
    address: '376 Kapiti Road, Paraparaumu Beach',
    lat: -40.9089,
    lng: 174.9858,
    price_min_nzd: 195,
    price_max_nzd: 295,
    tags: ['premium', 'links', 'local'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://paraparaumubeach.co.nz',
    image: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800',
    description: 'Classic links course. Consistently ranked in NZ top 5.'
  },
  {
    id: '8',
    name: "Terrace Downs",
    island: 'South',
    region: 'Canterbury',
    address: 'Coleridge Road, Windwhistle',
    lat: -43.4258,
    lng: 171.7031,
    price_min_nzd: 89,
    price_max_nzd: 129,
    tags: ['value', 'view', 'resort'],
    booking_url: 'https://example.com/booking',
    website_url: 'https://terracedowns.co.nz',
    image: 'https://images.unsplash.com/photo-1591491034931-48d52e148d2e?w=800',
    description: 'High country course with mountain and river views.'
  },
];

export const mockPlaces: Place[] = [
  // Cape Kidnappers places
  {
    id: 'p1',
    course_id: '1',
    category: 'stay',
    name: 'The Farm at Cape Kidnappers',
    address: '446 Clifton Road, Te Awanga',
    lat: -39.6504,
    lng: 177.0893,
    rating: 4.9,
    price_level: 4,
    phone: '+64 6 875 1900',
    website_url: 'https://capekidnappers.com',
    distance_km: 0.2
  },
  {
    id: 'p2',
    course_id: '1',
    category: 'restaurant',
    name: 'The Farm Restaurant',
    address: '446 Clifton Road, Te Awanga',
    lat: -39.6504,
    lng: 177.0893,
    rating: 4.8,
    price_level: 4,
    phone: '+64 6 875 1900',
    distance_km: 0.2
  },
  {
    id: 'p3',
    course_id: '1',
    category: 'market',
    name: 'New World Havelock North',
    address: 'Te Mata Road, Havelock North',
    lat: -39.6678,
    lng: 176.8778,
    rating: 4.2,
    price_level: 2,
    distance_km: 8.5
  },
  {
    id: 'p4',
    course_id: '1',
    category: 'golf_store',
    name: 'Pro Shop Cape Kidnappers',
    address: '446 Clifton Road, Te Awanga',
    lat: -39.6504,
    lng: 177.0893,
    rating: 4.9,
    price_level: 3,
    phone: '+64 6 875 1900',
    distance_km: 0.1
  },
  {
    id: 'p5',
    course_id: '1',
    category: 'tour_spot',
    name: 'Cape Kidnappers Gannet Colony',
    address: 'Clifton Road, Te Awanga',
    lat: -39.6482,
    lng: 177.0915,
    rating: 4.7,
    price_level: 0,
    distance_km: 0.5
  },
  
  // Jack's Point places
  {
    id: 'p6',
    course_id: '2',
    category: 'stay',
    name: 'Airbnb - Lake View Villa',
    address: 'Jack\'s Point, Queenstown',
    lat: -45.0581,
    lng: 168.7977,
    rating: 4.8,
    price_level: 3,
    distance_km: 0.8
  },
  {
    id: 'p7',
    course_id: '2',
    category: 'restaurant',
    name: 'The Clubhouse Restaurant',
    address: 'Jack\'s Point Golf Course',
    lat: -45.0581,
    lng: 168.7977,
    rating: 4.6,
    price_level: 3,
    phone: '+64 3 450 1030',
    distance_km: 0.1
  },
  {
    id: 'p8',
    course_id: '2',
    category: 'market',
    name: 'Fresh Choice Queenstown',
    address: 'Queenstown Town Centre',
    lat: -45.0312,
    lng: 168.6626,
    rating: 4.1,
    price_level: 2,
    distance_km: 12.3
  },
  {
    id: 'p9',
    course_id: '2',
    category: 'golf_store',
    name: 'Jack\'s Point Pro Shop',
    address: 'Jack\'s Point Golf Course',
    lat: -45.0581,
    lng: 168.7977,
    rating: 4.7,
    price_level: 3,
    distance_km: 0.1
  },
  {
    id: 'p10',
    course_id: '2',
    category: 'tour_spot',
    name: 'Queenstown Gondola',
    address: 'Brecon Street, Queenstown',
    lat: -45.0272,
    lng: 168.6586,
    rating: 4.8,
    price_level: 3,
    distance_km: 13.5
  },
];

export const mockRounds: Round[] = [
  {
    id: 'r1',
    course_id: '1',
    course_name: 'Cape Kidnappers',
    played_at: '2026-01-15T08:00:00Z',
    players: ['John Smith', 'Jane Doe'],
    tee_type: 'Blue',
    total_score: 84,
    front9_score: 42,
    back9_score: 42,
    putts_total: 32,
    notes: 'Amazing views! Windy on back 9.',
    media: [
      {
        id: 'm1',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
        thumbnail_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=200',
        caption: 'Hole 15 - stunning cliff view'
      }
    ]
  }
];

export const mockChallenges: Challenge[] = [
  {
    id: 'c1',
    type: 'ntp',
    title: { en: 'Nearest to the Pin', ko: '핀 근접 대회' },
    description: { 
      en: 'On a Par 3 hole, the player closest to the pin wins. Photo proof required.',
      ko: 'Par 3 홀에서 핀에 가장 가까운 플레이어가 승리. 사진 증거 필요.'
    },
    icon: '🎯',
    category: 'play'
  },
  {
    id: 'c2',
    type: 'view_shot',
    title: { en: 'View Shot Challenge', ko: '뷰 샷 챌린지' },
    description: { 
      en: 'Best shot with the most beautiful scenery. Photo quality is everything.',
      ko: '가장 아름다운 경치와 함께한 최고의 샷. 사진 품질이 전부.'
    },
    icon: '🏔',
    category: 'nature'
  },
  {
    id: 'c3',
    type: 'blowup',
    title: { en: 'Blow-Up Hole', ko: '블로우업 홀' },
    description: { 
      en: 'Worst score on a single hole. Double-par or worse = automatic nominee.',
      ko: '한 홀에서 최악의 스코어. 더블 파 이상 = 자동 후보.'
    },
    icon: '💣',
    category: 'fun'
  },
  {
    id: 'c4',
    type: 'iceman',
    title: { en: 'Ice Man Challenge', ko: '아이스맨 챌린지' },
    description: { 
      en: 'Calmest, cleanest, most composed play among holes played Par or better.',
      ko: 'Par 이하로 플레이한 홀 중 가장 차분하고 깔끔한 플레이.'
    },
    icon: '🧊',
    category: 'play'
  },
  {
    id: 'c5',
    type: 'wind_master',
    title: { en: 'Wind Master', ko: '바람의 마스터' },
    description: { 
      en: 'On a windy hole, any player who avoids OB earns a point.',
      ko: '바람 부는 홀에서 OB를 피한 모든 플레이어가 포인트 획득.'
    },
    icon: '🌬',
    category: 'nature'
  },
  {
    id: 'c6',
    type: 'sheep_rule',
    title: { en: 'Sheep Rule', ko: '양 규칙' },
    description: { 
      en: 'If sheep or cows spotted, next shot must be conservative. No aggressive drivers.',
      ko: '양이나 소를 발견하면 다음 샷은 보수적으로. 공격적인 드라이버 금지.'
    },
    icon: '🐑',
    category: 'fun'
  },
  {
    id: 'c7',
    type: 'gentleman',
    title: { en: 'Gentleman Hole', ko: '신사 홀' },
    description: { 
      en: 'For one hole: no swearing, no club throwing, no complaining.',
      ko: '한 홀 동안: 욕설 금지, 클럽 던지기 금지, 불평 금지.'
    },
    icon: '🎩',
    category: 'fun'
  },
  {
    id: 'c8',
    type: 'zen',
    title: { en: 'Zen Shot', ko: '젠 샷' },
    description: { 
      en: 'Before approach or putt: close eyes, deep breath for 3 seconds.',
      ko: '어프로치나 퍼트 전: 눈을 감고 3초간 심호흡.'
    },
    icon: '🧘',
    category: 'fun'
  },
  {
    id: 'c9',
    type: 'best_ball',
    title: { en: 'Best Ball Lite', ko: '베스트 볼 라이트' },
    description: { 
      en: 'Team score = best individual score on the hole. Low pressure, high teamwork.',
      ko: '팀 스코어 = 홀에서 최고의 개인 스코어. 낮은 압박감, 높은 팀워크.'
    },
    icon: '🤝',
    category: 'team'
  },
  {
    id: 'c10',
    type: 'titles',
    title: { en: "Today's Titles", ko: '오늘의 타이틀' },
    description: { 
      en: 'Awards: Driver of the Day, Mental Champion, Best View Award.',
      ko: '시상: 오늘의 드라이버, 멘탈 챔피언, 베스트 뷰 상.'
    },
    icon: '🏅',
    category: 'daily'
  },
];

export const mockTrips: Trip[] = [
  {
    id: 't1',
    name: 'NZ South Island Golf Trip',
    start_date: '2026-03-01',
    end_date: '2026-03-07',
    base_city: 'Queenstown',
    members: ['John Smith', 'Jane Doe', 'Mike Johnson'],
    invite_token: 'abc123xyz789',
    created_at: '2026-02-01T10:00:00Z'
  }
];
