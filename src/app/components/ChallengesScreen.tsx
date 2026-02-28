import { useState, useEffect, useRef } from 'react';
import { Trophy, Camera, CheckCircle, Loader2, Play } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { mockChallenges, Challenge } from '../data/mockData';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ChallengeResult {
  id?: string;
  challengeId: string;
  winner: string;
  proof_url?: string;
  proof_type?: 'photo' | 'video';
  notes: string;
  completed_at: string;
}

export function ChallengesScreen() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [winner, setWinner] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofMediaType, setProofMediaType] = useState<'photo' | 'video' | null>(null);

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

  // Load challenge results from Firestore
  useEffect(() => {
    if (!user) { setLoadingResults(false); return; }
    const q = query(
      collection(db, 'users', user.uid, 'challengeResults'),
      orderBy('completed_at', 'desc')
    );
    getDocs(q)
      .then(snapshot => {
        const results = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ChallengeResult));
        setCompletedChallenges(results);
      })
      .catch(err => console.error('챌린지 결과 로드 실패:', err))
      .finally(() => setLoadingResults(false));
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('파일은 10MB 이하만 가능합니다');
      e.target.value = '';
      return;
    }
    const isVideo = file.type.startsWith('video/');
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(file);
    setProofPreviewUrl(URL.createObjectURL(file));
    setProofMediaType(isVideo ? 'video' : 'photo');
    e.target.value = '';
  };

  const closeDialog = () => {
    setSelectedChallenge(null);
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(null);
    setProofPreviewUrl(null);
    setProofMediaType(null);
    setWinner('');
    setResultNotes('');
  };

  const handleRecordResult = async () => {
    if (!selectedChallenge || !winner.trim()) {
      toast.error(language === 'en' ? 'Please enter a winner name' : '승자 이름을 입력해주세요');
      return;
    }

    let proof_url: string | undefined;
    let proof_type: 'photo' | 'video' | undefined;

    if (proofFile && user) {
      setUploading(true);
      setUploadProgress(0);
      try {
        const ext  = proofFile.name.split('.').pop() ?? (proofFile.type.startsWith('video/') ? 'mp4' : 'jpg');
        const path = `users/${user.uid}/challenges/${selectedChallenge.id}/${Date.now()}.${ext}`;
        const sRef = storageRef(storage, path);
        const task = uploadBytesResumable(sRef, proofFile);

        await new Promise<void>((resolve, reject) => {
          task.on(
            'state_changed',
            snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            async () => {
              proof_url  = await getDownloadURL(sRef);
              proof_type = proofFile.type.startsWith('video/') ? 'video' : 'photo';
              resolve();
            }
          );
        });
      } catch (err) {
        console.error('업로드 실패:', err);
        toast.error('파일 업로드에 실패했습니다');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const resultData: Omit<ChallengeResult, 'id'> = {
      challengeId: selectedChallenge.id,
      winner: winner.trim(),
      proof_url,
      proof_type,
      notes: resultNotes,
      completed_at: new Date().toISOString(),
    };

    try {
      if (user) {
        const docRef = await addDoc(
          collection(db, 'users', user.uid, 'challengeResults'),
          resultData
        );
        setCompletedChallenges(prev => [{ ...resultData, id: docRef.id }, ...prev]);
      } else {
        setCompletedChallenges(prev => [resultData, ...prev]);
      }
      toast.success(language === 'en' ? 'Challenge result recorded!' : '챌린지 결과가 기록되었습니다!');
      closeDialog();
    } catch (err) {
      console.error('저장 실패:', err);
      toast.error('저장에 실패했습니다');
    }
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
              {isCompleted && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-600 mb-2">{challenge.description[language]}</p>
            <Badge variant="secondary" className="text-xs capitalize">{challenge.category}</Badge>
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
            {result.notes && <p className="text-sm text-gray-600 mb-2">{result.notes}</p>}
            {result.proof_url && (
              <div className="mt-2">
                {result.proof_type === 'video' ? (
                  <div className="relative">
                    <video
                      src={result.proof_url}
                      controls
                      playsInline
                      className="w-full rounded"
                      style={{ maxHeight: '240px' }}
                    />
                  </div>
                ) : (
                  <img src={result.proof_url} alt="Proof" className="w-full h-48 object-cover rounded" />
                )}
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
              <div className="space-y-3">
                {filteredChallenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="p-4 space-y-4 m-0 pb-20">
              {loadingResults ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : completedChallenges.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {language === 'en' ? 'No completed challenges yet' : '아직 완료된 챌린지가 없습니다'}
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
                    <CompletedChallengeCard key={result.id ?? idx} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Challenge Detail Dialog */}
      {selectedChallenge && (
        <Dialog open={!!selectedChallenge} onOpenChange={open => { if (!open) closeDialog(); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-3xl">{selectedChallenge.icon}</span>
                {selectedChallenge.title[language]}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{selectedChallenge.description[language]}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">{t('recordResult')}</h4>
                <div className="space-y-3">
                  <div>
                    <Label>{language === 'en' ? 'Winner Name' : '승자 이름'}</Label>
                    <Input
                      value={winner}
                      onChange={e => setWinner(e.target.value)}
                      placeholder={language === 'en' ? 'Enter winner name' : '승자 이름 입력'}
                    />
                  </div>

                  <div>
                    <Label>{t('uploadProof')}</Label>
                    <p className="text-[11px] text-gray-400 mt-0.5 mb-2">
                      {language === 'en' ? 'Photo or video · Max 10MB per file' : '사진 또는 동영상 · 파일당 최대 10MB'}
                    </p>
                    <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                      <div className="text-center">
                        <Camera className="w-7 h-7 mx-auto text-gray-400 mb-1.5" />
                        <span className="text-sm text-gray-600">
                          {proofFile ? proofFile.name : (language === 'en' ? 'Upload photo / video' : '사진 / 동영상 업로드')}
                        </span>
                        {!proofFile && (
                          <p className="text-[10px] text-gray-400 mt-0.5">최대 10MB</p>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {/* Preview */}
                    {proofPreviewUrl && proofMediaType === 'photo' && (
                      <div className="mt-2">
                        <img src={proofPreviewUrl} alt="Preview" className="w-full h-48 object-cover rounded" />
                      </div>
                    )}
                    {proofPreviewUrl && proofMediaType === 'video' && (
                      <div className="mt-2 relative bg-black rounded overflow-hidden">
                        <video
                          src={proofPreviewUrl}
                          controls
                          playsInline
                          className="w-full rounded"
                          style={{ maxHeight: '200px' }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-white" /> 동영상
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upload progress */}
                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>업로드 중...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>{t('notes')}</Label>
                    <Textarea
                      value={resultNotes}
                      onChange={e => setResultNotes(e.target.value)}
                      placeholder={language === 'en' ? 'Add notes about this challenge...' : '챌린지에 대한 메모 추가...'}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleRecordResult} className="w-full" disabled={uploading}>
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadProgress}%</>
                    ) : t('submit')}
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
