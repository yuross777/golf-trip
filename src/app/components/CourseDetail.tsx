import { ArrowLeft, Heart, ExternalLink, MapPin, Phone, Navigation, Star } from 'lucide-react';
import { Course, Place, mockPlaces } from '../data/mockData';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getProxiedPlacePhotoUrl } from '../utils/photoProxy';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
  onSave: (courseId: string) => void;
  isSaved: boolean;
  onStartScorecard: (course: Course) => void;
}

export function CourseDetail({ course, onBack, onSave, isSaved, onStartScorecard }: CourseDetailProps) {
  const { t } = useLanguage();

  const places = mockPlaces.filter(p => p.course_id === course.id);
  const stays = places.filter(p => p.category === 'stay');
  const restaurants = places.filter(p => p.category === 'restaurant');
  const markets = places.filter(p => p.category === 'market');
  const golfStores = places.filter(p => p.category === 'golf_store' || p.category === 'golf_market');
  const tourSpots = places.filter(p => p.category === 'tour_spot');

  const openGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${course.lat},${course.lng}&travelmode=driving`,
      '_blank'
    );
  };

  const openAirbnbSearch = () => {
    window.open(
      `https://www.airbnb.com/s/${encodeURIComponent(course.region)}/homes`,
      '_blank'
    );
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(course.address);
    toast.success(t('copiedToClipboard'));
  };

  const PlaceItem = ({ place }: { place: Place }) => (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex-1">
        <h4 className="font-medium">{place.name}</h4>
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{place.rating}</span>
            </div>
          )}
          <span>•</span>
          <span>{place.distance_km} {t('distanceKm')}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{place.address}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
            '_blank'
          )}
        >
          <Navigation className="w-4 h-4" />
        </Button>
        {place.phone && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`tel:${place.phone}`, '_blank')}
          >
            <Phone className="w-4 h-4" />
          </Button>
        )}
        {place.website_url && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(place.website_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header Image */}
      <div className="relative h-64">
        <img 
          src={getProxiedPlacePhotoUrl(course.image)}
           alt={course.name}
           className="w-full h-full object-cover"
         />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            className="bg-white/90 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('back')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSave(course.id)}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>

        {/* Course Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold text-white mb-1">{course.name}</h1>
          <div className="flex items-center text-white/90 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{course.region}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/20 text-white backdrop-blur-sm capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={openGoogleMaps} className="bg-green-600 hover:bg-green-700">
            <Navigation className="w-4 h-4 mr-2" />
            {t('openInMaps')}
          </Button>
          <Button onClick={() => onStartScorecard(course)} variant="outline">
            {t('startScorecard')}
          </Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="w-full justify-start overflow-x-auto bg-white border-b border-gray-200 rounded-none px-4">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="stays">{t('stays')}</TabsTrigger>
            <TabsTrigger value="food">{t('food')}</TabsTrigger>
            <TabsTrigger value="shopping">{t('shopping')}</TabsTrigger>
            <TabsTrigger value="tour">{t('tour')}</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="p-4 space-y-4 m-0">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-2">{t('location')}</h3>
                <p className="text-sm text-gray-600 mb-2">{course.address}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {course.lat.toFixed(4)}, {course.lng.toFixed(4)}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyAddress}>
                    {t('copyAddress')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={openGoogleMaps}>
                    {t('openMap')}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-2">{t('price')}</h3>
                <p className="text-2xl font-bold text-green-700">
                  NZD ${course.price_min_nzd} - ${course.price_max_nzd}
                </p>
                <p className="text-xs text-gray-500 mt-1">Prices vary by season</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700">{course.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="stays" className="p-4 space-y-4 m-0">
              <Button onClick={openAirbnbSearch} className="w-full" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('openAirbnbSearch')}
              </Button>
              
              <div>
                <h3 className="font-semibold mb-3">{t('nearbyStays')}</h3>
                <div className="space-y-3">
                  {stays.length > 0 ? (
                    stays.map(place => <PlaceItem key={place.id} place={place} />)
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">{t('noResults')}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="food" className="p-4 space-y-4 m-0">
              <h3 className="font-semibold mb-3">{t('nearbyRestaurants')}</h3>
              <div className="space-y-3">
                {restaurants.length > 0 ? (
                  restaurants.map(place => <PlaceItem key={place.id} place={place} />)
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">{t('noResults')}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="shopping" className="p-4 space-y-4 m-0">
              <div>
                <h3 className="font-semibold mb-3">{t('golfStores')}</h3>
                <div className="space-y-3 mb-6">
                  {golfStores.length > 0 ? (
                    golfStores.map(place => <PlaceItem key={place.id} place={place} />)
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">{t('noResults')}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">{t('nearbyMarkets')}</h3>
                <div className="space-y-3">
                  {markets.length > 0 ? (
                    markets.map(place => <PlaceItem key={place.id} place={place} />)
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">{t('noResults')}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tour" className="p-4 space-y-4 m-0">
              <h3 className="font-semibold mb-3">{t('nearbyAttractions')}</h3>
              <div className="space-y-3">
                {tourSpots.length > 0 ? (
                  tourSpots.map(place => <PlaceItem key={place.id} place={place} />)
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">{t('noResults')}</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
