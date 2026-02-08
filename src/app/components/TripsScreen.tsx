import { useState } from 'react';
import { Plus, Users, Calendar, MapPin, Share2, Copy, QrCode as QrCodeIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trip, mockTrips } from '../data/mockData';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function TripsScreen() {
  const { t } = useLanguage();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Form state
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseCity, setBaseCity] = useState('');

  const resetForm = () => {
    setTripName('');
    setStartDate('');
    setEndDate('');
    setBaseCity('');
  };

  const handleCreateTrip = () => {
    if (!tripName || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTrip: Trip = {
      id: `t${Date.now()}`,
      name: tripName,
      start_date: startDate,
      end_date: endDate,
      base_city: baseCity,
      members: ['You'],
      invite_token: Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString()
    };

    setTrips([newTrip, ...trips]);
    setIsCreateOpen(false);
    resetForm();
    toast.success(t('savedSuccess'));
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/trip/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(t('copiedToClipboard'));
  };

  const regenerateInviteLink = (tripId: string) => {
    const newToken = Math.random().toString(36).substring(2, 15);
    setTrips(trips.map(t => 
      t.id === tripId ? { ...t, invite_token: newToken } : t
    ));
    toast.success('Invite link regenerated');
  };

  const TripCard = ({ trip }: { trip: Trip }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedTrip(trip)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{trip.name}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              {format(new Date(trip.start_date), 'MMM dd')} - {format(new Date(trip.end_date), 'MMM dd, yyyy')}
            </span>
          </div>
          {trip.base_city && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{trip.base_city}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-1" />
          <span>{trip.members.length} {t('members')}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTrip(trip);
            setShowInviteDialog(true);
          }}
        >
          <Share2 className="w-4 h-4 mr-1" />
          {t('inviteFriends')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Create Button Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('createTrip')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createTrip')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>{t('tripName')}</Label>
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="NZ Golf Adventure"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('startDate')}</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('endDate')}</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>{t('baseCity')}</Label>
                <Input
                  value={baseCity}
                  onChange={(e) => setBaseCity(e.target.value)}
                  placeholder="Auckland / Queenstown"
                />
              </div>

              <Button onClick={handleCreateTrip} className="w-full">
                {t('createTrip')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trips List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t('noResults')}</p>
            <p className="text-sm text-gray-400 mt-2">Create your first golf trip</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      {/* Trip Detail Dialog */}
      {selectedTrip && !showInviteDialog && (
        <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTrip.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center text-sm text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {format(new Date(selectedTrip.start_date), 'MMM dd, yyyy')} - {format(new Date(selectedTrip.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                {selectedTrip.base_city && (
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedTrip.base_city}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">{t('members')}</h4>
                <div className="space-y-2">
                  {selectedTrip.members.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-700">
                          {member.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm">{member}</span>
                      {idx === 0 && (
                        <Badge variant="secondary" className="text-xs ml-auto">Owner</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('inviteFriends')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite Dialog */}
      {selectedTrip && showInviteDialog && (
        <Dialog open={showInviteDialog} onOpenChange={(open) => {
          setShowInviteDialog(open);
          if (!open) setSelectedTrip(null);
        }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('inviteFriends')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share this link or QR code with your friends to invite them to {selectedTrip.name}
              </p>

              <Tabs defaultValue="link" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="link" className="flex-1">
                    {t('inviteLink')}
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="flex-1">
                    {t('qrCode')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="link" className="space-y-3 mt-4">
                  <div>
                    <Label>{t('inviteLink')}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        readOnly
                        value={`${window.location.origin}/invite/trip/${selectedTrip.invite_token}`}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyInviteLink(selectedTrip.invite_token)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                    <p className="mb-1">
                      <strong>{t('expiresOn')}:</strong> {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => regenerateInviteLink(selectedTrip.id)}
                  >
                    {t('regenerateLink')}
                  </Button>
                </TabsContent>

                <TabsContent value="qr" className="mt-4">
                  <div className="flex justify-center p-8 bg-white border border-gray-200 rounded-lg">
                    <QRCodeSVG
                      value={`${window.location.origin}/invite/trip/${selectedTrip.invite_token}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-3">
                    Scan this QR code to join the trip
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}