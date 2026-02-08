import { useState } from 'react';
import { Plus, Calendar, Camera, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Round, Course, mockCourses, mockRounds } from '../data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ScorecardScreenProps {
  preselectedCourse?: Course;
  onClearPreselection?: () => void;
}

export function ScorecardScreen({ preselectedCourse, onClearPreselection }: ScorecardScreenProps) {
  const { t } = useLanguage();
  const [rounds, setRounds] = useState<Round[]>(mockRounds);
  const [isCreateOpen, setIsCreateOpen] = useState(!!preselectedCourse);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourse?.id || '');
  const [playDate, setPlayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [players, setPlayers] = useState(['']);
  const [teeType, setTeeType] = useState('White');
  const [totalScore, setTotalScore] = useState('');
  const [front9, setFront9] = useState('');
  const [back9, setBack9] = useState('');
  const [putts, setPutts] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const resetForm = () => {
    if (!preselectedCourse) {
      setSelectedCourseId('');
    }
    setPlayDate(format(new Date(), 'yyyy-MM-dd'));
    setPlayers(['']);
    setTeeType('White');
    setTotalScore('');
    setFront9('');
    setBack9('');
    setPutts('');
    setNotes('');
    setMediaFiles([]);
  };

  const handleSaveRound = () => {
    if (!selectedCourseId || !totalScore) {
      toast.error('Please select a course and enter a total score');
      return;
    }

    const course = mockCourses.find(c => c.id === selectedCourseId);
    if (!course) return;

    const newRound: Round = {
      id: `r${Date.now()}`,
      course_id: selectedCourseId,
      course_name: course.name,
      played_at: new Date(playDate).toISOString(),
      players: players.filter(p => p.trim()),
      tee_type: teeType,
      total_score: parseInt(totalScore),
      front9_score: front9 ? parseInt(front9) : undefined,
      back9_score: back9 ? parseInt(back9) : undefined,
      putts_total: putts ? parseInt(putts) : undefined,
      notes: notes,
      media: mediaFiles.map((file, idx) => ({
        id: `m${Date.now()}_${idx}`,
        type: file.type.startsWith('video/') ? 'video' : 'photo',
        url: URL.createObjectURL(file),
        thumbnail_url: URL.createObjectURL(file),
        caption: ''
      }))
    };

    setRounds([newRound, ...rounds]);
    setIsCreateOpen(false);
    resetForm();
    if (onClearPreselection) onClearPreselection();
    toast.success(t('savedSuccess'));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setMediaFiles([...mediaFiles, ...files]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const deleteRound = (roundId: string) => {
    setRounds(rounds.filter(r => r.id !== roundId));
    setSelectedRound(null);
    toast.success('Round deleted');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Create Button Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && onClearPreselection) {
            onClearPreselection();
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('createRound')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('createRound')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Course Selection */}
              <div>
                <Label>{t('selectCourse')}</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId} disabled={!!preselectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCourse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} - {course.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <Label>{t('date')}</Label>
                <Input
                  type="date"
                  value={playDate}
                  onChange={(e) => setPlayDate(e.target.value)}
                />
              </div>

              {/* Players */}
              <div>
                <Label>{t('players')}</Label>
                {players.map((player, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input
                      placeholder={`Player ${idx + 1}`}
                      value={player}
                      onChange={(e) => {
                        const newPlayers = [...players];
                        newPlayers[idx] = e.target.value;
                        setPlayers(newPlayers);
                      }}
                    />
                    {idx === players.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPlayers([...players, ''])}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Tee Type */}
              <div>
                <Label>{t('teeType')}</Label>
                <Select value={teeType} onValueChange={setTeeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="White">White</SelectItem>
                    <SelectItem value="Blue">Blue</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>{t('totalScore')}</Label>
                  <Input
                    type="number"
                    value={totalScore}
                    onChange={(e) => setTotalScore(e.target.value)}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label>{t('front9')}</Label>
                  <Input
                    type="number"
                    value={front9}
                    onChange={(e) => setFront9(e.target.value)}
                    placeholder="36"
                  />
                </div>
                <div>
                  <Label>{t('back9')}</Label>
                  <Input
                    type="number"
                    value={back9}
                    onChange={(e) => setBack9(e.target.value)}
                    placeholder="36"
                  />
                </div>
              </div>

              <div>
                <Label>{t('putts')}</Label>
                <Input
                  type="number"
                  value={putts}
                  onChange={(e) => setPutts(e.target.value)}
                  placeholder="32"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>{t('notes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about your round..."
                  rows={3}
                />
              </div>

              {/* Media Upload */}
              <div>
                <Label>{t('addMedia')}</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">{t('selectFiles')}</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {mediaFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          onClick={() => removeMediaFile(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleSaveRound} className="w-full">
                {t('saveRound')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rounds List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {rounds.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t('noResults')}</p>
            <p className="text-sm text-gray-400 mt-2">Start recording your golf rounds</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedRound(round)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{round.course_name}</h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(round.played_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">{round.total_score}</div>
                      <p className="text-xs text-gray-500">{round.tee_type} Tee</p>
                    </div>
                  </div>
                  
                  {round.front9_score && round.back9_score && (
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      <span>Front 9: {round.front9_score}</span>
                      <span>Back 9: {round.back9_score}</span>
                      {round.putts_total && <span>Putts: {round.putts_total}</span>}
                    </div>
                  )}
                  
                  {round.players.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      Players: {round.players.join(', ')}
                    </p>
                  )}
                  
                  {round.media.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {round.media.slice(0, 4).map((media) => (
                        <div key={media.id} className="w-16 h-16 rounded overflow-hidden">
                          <img
                            src={media.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {round.media.length > 4 && (
                        <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                          +{round.media.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Round Detail Dialog */}
      {selectedRound && (
        <Dialog open={!!selectedRound} onOpenChange={() => setSelectedRound(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRound.course_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-4 bg-green-50 rounded-lg">
                <div className="text-5xl font-bold text-green-600 mb-1">
                  {selectedRound.total_score}
                </div>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedRound.played_at), 'MMMM dd, yyyy')}
                </p>
              </div>

              {selectedRound.front9_score && selectedRound.back9_score && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">{selectedRound.front9_score}</div>
                    <div className="text-xs text-gray-600">{t('front9')}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">{selectedRound.back9_score}</div>
                    <div className="text-xs text-gray-600">{t('back9')}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold">{selectedRound.putts_total || '-'}</div>
                    <div className="text-xs text-gray-600">{t('putts')}</div>
                  </div>
                </div>
              )}

              {selectedRound.players.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t('players')}</h4>
                  <p className="text-sm text-gray-700">{selectedRound.players.join(', ')}</p>
                </div>
              )}

              {selectedRound.notes && (
                <div>
                  <h4 className="font-semibold mb-2">{t('notes')}</h4>
                  <p className="text-sm text-gray-700">{selectedRound.notes}</p>
                </div>
              )}

              {selectedRound.media.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Media</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRound.media.map((media) => (
                      <div key={media.id} className="aspect-square rounded overflow-hidden">
                        <img
                          src={media.url}
                          alt={media.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  {t('editScore')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this round?')) {
                      deleteRound(selectedRound.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('deleteRound')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}