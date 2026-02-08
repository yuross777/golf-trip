import { useState } from 'react';
import { Trophy, Camera, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { mockChallenges, Challenge } from '../data/mockData';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface ChallengeResult {
  challengeId: string;
  winner: string;
  proof_url?: string;
  notes: string;
  completed_at: string;
}

export function ChallengesScreen() {
  const { t, language } = useLanguage();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeResult[]>([]);
  
  // Form state
  const [winner, setWinner] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  const categoryFilters = [
    { id: 'all', label: { en: 'All', ko: '전체' } },
    { id: 'play', label: { en: 'Play Based', ko: '플레이 기반' } },
    { id: 'nature', label: { en: 'Nature', ko: '자연' } },
    { id: 'fun', label: { en: 'Fun', ko: '재미' } },
    { id: 'team', label: { en: 'Team', ko: '팀' } },
    { id: 'daily', label: { en: 'Daily', ko: '데일리' } },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredChallenges = mockChallenges.filter(
    c => activeCategory === 'all' || c.category === activeCategory
  );

  const handleRecordResult = () => {
    if (!selectedChallenge || !winner) {
      toast.error('Please enter a winner name');
      return;
    }

    const result: ChallengeResult = {
      challengeId: selectedChallenge.id,
      winner,
      proof_url: proofFile ? URL.createObjectURL(proofFile) : undefined,
      notes: resultNotes,
      completed_at: new Date().toISOString()
    };

    setCompletedChallenges([result, ...completedChallenges]);
    setSelectedChallenge(null);
    setWinner('');
    setResultNotes('');
    setProofFile(null);
    toast.success('Challenge result recorded!');
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const isCompleted = completedChallenges.some(c => c.challengeId === challenge.id);
    
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedChallenge(challenge)}
      >
        <div className="flex items-start gap-3">
          <div className="text-4xl">{challenge.icon}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold">{challenge.title[language]}</h3>
              {isCompleted && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {challenge.description[language]}
            </p>
            <Badge variant="secondary" className="text-xs capitalize">
              {challenge.category}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const CompletedChallengeCard = ({ result }: { result: ChallengeResult }) => {
    const challenge = mockChallenges.find(c => c.id === result.challengeId);
    if (!challenge) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{challenge.icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{challenge.title[language]}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Winner: {result.winner}</span>
            </div>
            {result.notes && (
              <p className="text-sm text-gray-600 mb-2">{result.notes}</p>
            )}
            {result.proof_url && (
              <div className="mt-2">
                <img
                  src={result.proof_url}
                  alt="Proof"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(result.completed_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="active" className="h-full flex flex-col">
          <TabsList className="w-full justify-start bg-white border-b border-gray-200 rounded-none px-4">
            <TabsTrigger value="active">{t('activeChallenges')}</TabsTrigger>
            <TabsTrigger value="completed">
              {t('completedChallenges')} ({completedChallenges.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="active" className="p-4 space-y-4 m-0 pb-20">
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categoryFilters.map(cat => (
                  <Badge
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label[language]}
                  </Badge>
                ))}
              </div>

              {/* Challenge Cards */}
              <div className="space-y-3">
                {filteredChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="p-4 space-y-4 m-0 pb-20">
              {completedChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {language === 'en' 
                      ? 'No completed challenges yet' 
                      : '아직 완료된 챌린지가 없습니다'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {language === 'en'
                      ? 'Start playing and record your challenge results!'
                      : '플레이를 시작하고 챌린지 결과를 기록하세요!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedChallenges.map((result, idx) => (
                    <CompletedChallengeCard key={idx} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Challenge Detail Dialog */}
      {selectedChallenge && (
        <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">{selectedChallenge.icon}</span>
                {selectedChallenge.title[language]}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  {selectedChallenge.description[language]}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">{t('recordResult')}</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label>
                      {language === 'en' ? 'Winner Name' : '승자 이름'}
                    </Label>
                    <Input
                      value={winner}
                      onChange={(e) => setWinner(e.target.value)}
                      placeholder={language === 'en' ? 'Enter winner name' : '승자 이름 입력'}
                    />
                  </div>

                  <div>
                    <Label>{t('uploadProof')}</Label>
                    <div className="mt-2">
                      <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {language === 'en' ? 'Upload photo proof' : '사진 증거 업로드'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setProofFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {proofFile && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(proofFile)}
                          alt="Proof preview"
                          className="w-full h-48 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>{t('notes')}</Label>
                    <Textarea
                      value={resultNotes}
                      onChange={(e) => setResultNotes(e.target.value)}
                      placeholder={language === 'en' ? 'Add notes about this challenge...' : '챌린지에 대한 메모 추가...'}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleRecordResult} className="w-full">
                    {t('submit')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}