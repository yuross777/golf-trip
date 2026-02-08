import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CourseCard } from './CourseCard';
import { Course, mockCourses } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Slider } from './ui/slider';

interface HomeScreenProps {
  onCourseClick: (course: Course) => void;
  savedCourses: Set<string>;
  onSaveCourse: (courseId: string) => void;
}

export function HomeScreen({ onCourseClick, savedCourses, onSaveCourse }: HomeScreenProps) {
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIsland, setSelectedIsland] = useState<string>('all');
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 700]);

  const islands = ['all', 'north', 'south'];
  const priceTiers = ['all', 'value', 'mid', 'premium'];
  const tags = ['view', 'links', 'resort', 'city', 'local'];
  const sortOptions = ['recommended', 'priceLow', 'nearest'];

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const filteredCourses = useMemo(() => {
    let filtered = [...mockCourses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.region.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Island filter
    if (selectedIsland !== 'all') {
      filtered = filtered.filter(course => 
        course.island.toLowerCase() === selectedIsland
      );
    }

    // Price tier filter
    if (selectedPriceTier !== 'all') {
      filtered = filtered.filter(course =>
        course.tags.includes(selectedPriceTier)
      );
    }

    // Tags filter
    if (selectedTags.size > 0) {
      filtered = filtered.filter(course =>
        Array.from(selectedTags).some(tag => course.tags.includes(tag))
      );
    }

    // Price range filter
    filtered = filtered.filter(course =>
      course.price_min_nzd >= priceRange[0] && course.price_max_nzd <= priceRange[1]
    );

    // Sort
    if (sortBy === 'priceLow') {
      filtered.sort((a, b) => a.price_min_nzd - b.price_min_nzd);
    }

    return filtered;
  }, [searchQuery, selectedIsland, selectedPriceTier, selectedTags, sortBy, priceRange]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Filters Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Quick Filters */}
        <div className="space-y-2">
          {/* Island Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {islands.map((island) => (
              <Badge
                key={island}
                variant={selectedIsland === island ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedIsland(island)}
              >
                {t(island)}
              </Badge>
            ))}
          </div>

          {/* Price Tier Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {priceTiers.map((tier) => (
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
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.has(tag) ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleTag(tag)}
              >
                {t(tag)}
              </Badge>
            ))}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  {t('moreFilters')}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px]">
                <SheetHeader>
                  <SheetTitle>{t('moreFilters')}</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {t('price')}: NZD ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <Slider
                      min={0}
                      max={700}
                      step={50}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="w-full"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('sort')}</label>
                    <div className="flex flex-wrap gap-2">
                      {sortOptions.map((option) => (
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
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('noResults')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onCardClick={onCourseClick}
                onSave={onSaveCourse}
                isSaved={savedCourses.has(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}