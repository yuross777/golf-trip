import { Heart, MapPin } from 'lucide-react';
import { Course } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface CourseCardProps {
  course: Course;
  onCardClick: (course: Course) => void;
  onSave: (courseId: string) => void;
  isSaved: boolean;
}

export function CourseCard({ course, onCardClick, onSave, isSaved }: CourseCardProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => onCardClick(course)}>
        <img 
          src={course.image} 
          alt={course.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(course.id);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>
      
      <div className="p-4 cursor-pointer" onClick={() => onCardClick(course)}>
        <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{course.region}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {course.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs capitalize">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-green-700 font-semibold">
              NZD ${course.price_min_nzd} - ${course.price_max_nzd}
            </span>
          </div>
          <Button size="sm" variant="outline">
            {t('details')}
          </Button>
        </div>
      </div>
    </div>
  );
}
