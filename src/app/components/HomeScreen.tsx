import { useState, useMemo, useRef } from 'react';
import { Search, SlidersHorizontal, Plus, Heart, Upload, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { CourseCard } from './CourseCard';
import { Course } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { toast } from 'sonner';

interface HomeScreenProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  savedCourses: Set<string>;
  onSaveCourse: (courseId: string) => void;
  onCourseAdded: (course: Course) => void;
}

const ALL_TAGS = ['view', 'links', 'resort', 'city', 'local'];

export function HomeScreen({ courses, onCourseClick, savedCourses, onSaveCourse, onCourseAdded }: HomeScreenProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchQuery,       setSearchQuery]       = useState('');
  const [selectedIsland,    setSelectedIsland]    = useState<string>('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>('all');
  const [selectedTags,      setSelectedTags]      = useState<Set<string>>(new Set());
  const [sortBy,            setSortBy]            = useState<string>('recommended');
  const [priceRange,        setPriceRange]        = useState<[number, number]>([0, 700]);
  const [showLikedOnly,     setShowLikedOnly]     = useState(false);
  const [showMoreFilters,   setShowMoreFilters]   = useState(false);

  // ── Add Course Sheet ──────────────────────────────────────────────────────
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form, setForm] = useState({
    name: '', island: 'North' as 'North' | 'South',
    region: '', address: '', phone: '',
    price_min_nzd: '', price_max_nzd: '',
    website_url: '', booking_url: '', description: '',
    tags: [] as string[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const islands    = ['all', 'north', 'south'];
  const priceTiers = ['all', 'value', 'mid', 'premium'];
  const sortOptions = ['recommended', 'priceLow', 'nearest'];

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) newTags.delete(tag); else newTags.add(tag);
    setSelectedTags(newTags);
  };

  const toggleFormTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    if (showLikedOnly) {
      filtered = filtered.filter(c => savedCourses.has(String(c.id)));
    }
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedIsland !== 'all') {
      filtered = filtered.filter(c => c.island.toLowerCase() === selectedIsland);
    }
    if (selectedPriceTier !== 'all') {
      filtered = filtered.filter(c => c.tags.includes(selectedPriceTier));
    }
    if (selectedTags.size > 0) {
      filtered = filtered.filter(c =>
        Array.from(selectedTags).some(tag => c.tags.includes(tag))
      );
    }
    filtered = filtered.filter(c =>
      c.price_min_nzd >= priceRange[0] && c.price_max_nzd <= priceRange[1]
    );
    if (sortBy === 'priceLow') {
      filtered.sort((a, b) => a.price_min_nzd - b.price_min_nzd);
    }
    return filtered;
  }, [courses, searchQuery, selectedIsland, selectedPriceTier, selectedTags, sortBy, priceRange, showLikedOnly, savedCourses]);

  // ── Add Course ────────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('이미지는 10MB 이하만 가능합니다'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({ name: '', island: 'North', region: '', address: '', phone: '',
      price_min_nzd: '', price_max_nzd: '', website_url: '', booking_url: '',
      description: '', tags: [] });
    setImageFile(null);
    setImagePreview('');
  };

  const handleAddCourse = async () => {
    if (!user) { toast.error('로그인이 필요합니다'); return; }
    if (!form.name.trim() || !form.region.trim() || !form.address.trim()) {
      toast.error('코스명, 지역, 주소는 필수입니다'); return;
    }
    if (!form.price_min_nzd || !form.price_max_nzd) {
      toast.error('가격 범위를 입력해주세요'); return;
    }
    setSaving(true);
    try {
      let imageUrl = '';
      // 이미지 업로드 (선택)
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const storageRef = ref(storage, `course-images/temp-${Date.now()}.${ext}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const courseData = {
        name:          form.name.trim(),
        island:        form.island,
        region:        form.region.trim(),
        address:       form.address.trim(),
        phone:         form.phone.trim(),
        price_min_nzd: Number(form.price_min_nzd),
        price_max_nzd: Number(form.price_max_nzd),
        website_url:   form.website_url.trim(),
        booking_url:   form.booking_url.trim() || null,
        description:   form.description.trim(),
        tags:          form.tags,
        image:         imageUrl,
        rating:        0,
        review_count:  0,
        userAdded:     true,
        addedBy:       user.uid,
        createdAt:     new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      const newCourse: Course = { ...courseData, id: docRef.id };
      onCourseAdded(newCourse);
      toast.success('코스가 등록되었습니다');
      setShowAddCourse(false);
      resetForm();
    } catch (err) {
      console.error('코스 등록 실패:', err);
      toast.error('등록에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Filters Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        {/* Search + Add button */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddCourse(true)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1" />
              코스 추가
            </Button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="space-y-2">
          {/* Island + Like Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {islands.map(island => (
              <Badge
                key={island}
                variant={selectedIsland === island ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedIsland(island)}
              >
                {t(island)}
              </Badge>
            ))}
            <Badge
              variant={showLikedOnly ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${showLikedOnly ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}`}
              onClick={() => setShowLikedOnly(v => !v)}
            >
              <Heart className={`w-3 h-3 ${showLikedOnly ? 'fill-white' : ''}`} />
              좋아요
            </Badge>
          </div>

          {/* Price Tier Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {priceTiers.map(tier => (
              <Badge
                key={tier}
                variant={selectedPriceTier === tier ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedPriceTier(tier)}
              >
                {t(tier)}
              </Badge>
            ))}
          </div>

          {/* Tags and More Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ALL_TAGS.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.has(tag) ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleTag(tag)}
              >
                {t(tag)}
              </Badge>
            ))}
            <Button variant="outline" size="sm" onClick={() => setShowMoreFilters(true)}>
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              {t('moreFilters')}
            </Button>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-2 text-xs text-gray-400">
          {showLikedOnly ? `좋아요 코스 ${filteredCourses.length}개` : `${filteredCourses.length}개 코스`}
        </div>
      </div>

      {/* Course Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">{t('noResults')}</p>
            {showLikedOnly && (
              <p className="text-sm text-gray-400 mt-1">좋아요한 코스가 없습니다</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onCardClick={onCourseClick}
                onSave={onSaveCourse}
                isSaved={savedCourses.has(String(course.id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── More Filters Sheet ─────────────────────────────────────────────── */}
      <Sheet open={showMoreFilters} onOpenChange={setShowMoreFilters}>
        <SheetContent side="bottom" className="h-[400px]">
          <SheetHeader>
            <SheetTitle>{t('moreFilters')}</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('price')}: NZD ${priceRange[0]} - ${priceRange[1]}
              </label>
              <Slider
                min={0} max={700} step={50}
                value={priceRange}
                onValueChange={v => setPriceRange(v as [number, number])}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{t('sort')}</label>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map(option => (
                  <Badge
                    key={option}
                    variant={sortBy === option ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSortBy(option)}
                  >
                    {t(option)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Add Course Sheet ──────────────────────────────────────────────── */}
      <Sheet open={showAddCourse} onOpenChange={open => { if (!open) { setShowAddCourse(false); resetForm(); } }}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-gray-100">
            <SheetTitle className="text-lg">새 코스 등록</SheetTitle>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {/* 이미지 업로드 */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">코스 사진 (선택)</Label>
              {imagePreview ? (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">사진 업로드</span>
                </button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1 block">코스명 *</Label>
                <Input
                  placeholder="예: Akarana Golf Club"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-1 block">섬 *</Label>
                  <Select
                    value={form.island}
                    onValueChange={v => setForm(p => ({ ...p, island: v as 'North' | 'South' }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North">North Island</SelectItem>
                      <SelectItem value="South">South Island</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1 block">지역 *</Label>
                  <Input
                    placeholder="예: Auckland"
                    value={form.region}
                    onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">주소 *</Label>
                <Input
                  placeholder="예: 40 Akarana Ave, Auckland"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            {/* 가격 */}
            <div>
              <Label className="text-sm font-semibold mb-1 block">그린피 (NZD) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number" placeholder="최소" min={0}
                  value={form.price_min_nzd}
                  onChange={e => setForm(p => ({ ...p, price_min_nzd: e.target.value }))}
                />
                <span className="text-gray-400">~</span>
                <Input
                  type="number" placeholder="최대" min={0}
                  value={form.price_max_nzd}
                  onChange={e => setForm(p => ({ ...p, price_max_nzd: e.target.value }))}
                />
              </div>
            </div>

            {/* 연락처 */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1 block">전화번호</Label>
                <Input
                  placeholder="예: +64 9 555 1234"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1 block">웹사이트</Label>
                <Input
                  placeholder="https://..."
                  value={form.website_url}
                  onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1 block">예약 링크</Label>
                <Input
                  placeholder="https://..."
                  value={form.booking_url}
                  onChange={e => setForm(p => ({ ...p, booking_url: e.target.value }))}
                />
              </div>
            </div>

            {/* 태그 */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">태그</Label>
              <div className="flex flex-wrap gap-2">
                {['value', 'mid', 'premium', 'view', 'links', 'resort', 'city', 'local'].map(tag => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => toggleFormTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 설명 */}
            <div>
              <Label className="text-sm font-semibold mb-1 block">코스 설명</Label>
              <textarea
                placeholder="코스에 대한 간단한 설명을 입력하세요..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            {/* 저장 버튼 */}
            <Button
              className="w-full h-12 text-base font-bold"
              onClick={handleAddCourse}
              disabled={saving}
            >
              {saving ? '등록 중...' : '코스 등록'}
            </Button>

            <div className="h-4" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
