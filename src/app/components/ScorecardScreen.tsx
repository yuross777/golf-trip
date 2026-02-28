import { useState, useEffect, useRef } from 'react';
import {
  Plus, Calendar, ArrowLeft, Save, Trash2, Users, ChevronRight, Loader2,
  Camera, Video, X, Play, ImageIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Course, mockCourses } from '../data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  collection, getDocs, deleteDoc, doc, query, orderBy, setDoc,
} from 'firebase/firestore';
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScoreVal  = '' | '-2' | '-1' | '0' | '1' | '2' | '3' | '4' | '5';
type DriverVal = '' | 'F' | 'R' | 'H' | 'O';
type SecondVal = '' | 'O' | 'F' | 'X';
type PuttVal   = '' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

interface HoleEntry { score: ScoreVal; driver: DriverVal; second: SecondVal; putt: PuttVal; }
interface PlayerCard { name: string; holes: HoleEntry[]; }

interface MediaItem {
  id:          string;
  type:        'photo' | 'video';
  storagePath: string;
  url:         string;
  holeIndex:   number;   // 0-17
  uploadedAt:  string;
}

interface SavedRound {
  id:         string;
  courseId:   string;
  courseName: string;
  playedAt:   string;
  teeType:    string;
  notes:      string;
  players:    PlayerCard[];
  media:      MediaItem[];
  createdAt:  string;
}

type AppView = 'list' | 'setup' | 'entry';

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyHole   = (): HoleEntry   => ({ score: '', driver: '', second: '', putt: '' });
const newCard     = (name: string): PlayerCard => ({
  name: name.trim() || 'Player',
  holes: Array.from({ length: 18 }, emptyHole),
});
const sumRange    = (holes: HoleEntry[], from: number, to: number) =>
  holes.slice(from, to).reduce((acc, h) => acc + (parseInt(h.score) || 0), 0);
const countFilled = (holes: HoleEntry[], from: number, to: number) =>
  holes.slice(from, to).filter(h => h.score !== '').length;
const genId       = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r${Date.now()}-${Math.random().toString(36).slice(2)}`;

const SCORE_OPTIONS: ScoreVal[] = ['-2', '-1', '0', '1', '2', '3', '4', '5'];
const MAX_PHOTOS  = 10;
const MAX_VIDEOS  = 10;

const roundsCol = (uid: string) => collection(db, 'users', uid, 'rounds');

const COL_LABEL = 34;
const COL_TOTAL = 38;

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScorecardScreenProps {
  preselectedCourse?: Course | null;
  onClearPreselection?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ScorecardScreen({ preselectedCourse, onClearPreselection }: ScorecardScreenProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [view,          setView]          = useState<AppView>(preselectedCourse ? 'setup' : 'list');
  const [savedRounds,   setSavedRounds]   = useState<SavedRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [saving,        setSaving]        = useState(false);

  // 수정 중인 라운드 ID (null이면 신규)
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  // 신규/편집 공통 라운드 ID (Storage 경로용)
  const [currentRoundId, setCurrentRoundId] = useState<string>('');

  // 폼 상태
  const [courseId,    setCourseId]    = useState(preselectedCourse?.id ? String(preselectedCourse.id) : '');
  const [playDate,    setPlayDate]    = useState(format(new Date(), 'yyyy-MM-dd'));
  const [players,     setPlayers]     = useState<string[]>(['']);
  const [teeType,     setTeeType]     = useState('White');
  const [notes,       setNotes]       = useState('');
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);

  // 미디어
  const [media,               setMedia]               = useState<MediaItem[]>([]);
  const [showMediaManager,    setShowMediaManager]    = useState(false);
  const [selectedHole,        setSelectedHole]        = useState<number | null>(null);
  const [previewItem,         setPreviewItem]         = useState<MediaItem | null>(null);
  const [uploadingHole,  setUploadingHole]  = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Firestore: 라운드 목록 로드 ───────────────────────────────────────────

  useEffect(() => {
    if (!user) { setLoadingRounds(false); return; }
    setLoadingRounds(true);
    const q = query(roundsCol(user.uid), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then(snapshot => {
        const rounds = snapshot.docs.map(d => {
          const data = d.data();
          return { ...data, id: d.id, media: data.media ?? [] } as SavedRound;
        });
        setSavedRounds(rounds);
      })
      .catch(err => { console.error('라운드 로드 실패:', err); toast.error('라운드 목록을 불러오지 못했습니다'); })
      .finally(() => setLoadingRounds(false));
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const resetForm = () => {
    if (!preselectedCourse) setCourseId('');
    setPlayDate(format(new Date(), 'yyyy-MM-dd'));
    setPlayers(['']);
    setTeeType('White');
    setNotes('');
    setPlayerCards([]);
    setMedia([]);
    setEditingRoundId(null);
    setCurrentRoundId('');
    setShowMediaManager(false);
  };

  const handleOpenRound = (round: SavedRound) => {
    setCourseId(round.courseId);
    setPlayDate(format(new Date(round.playedAt), 'yyyy-MM-dd'));
    setTeeType(round.teeType);
    setNotes(round.notes);
    setPlayerCards(round.players);
    setPlayers(round.players.map(p => p.name));
    setMedia(round.media ?? []);
    setEditingRoundId(round.id);
    setCurrentRoundId(round.id);
    setView('entry');
  };

  const handleStartEntry = () => {
    if (!courseId) { toast.error('코스를 선택해주세요'); return; }
    const valid = players.filter(p => p.trim());
    if (valid.length === 0) { toast.error('플레이어를 입력해주세요'); return; }
    const newRoundId = genId();
    setCurrentRoundId(newRoundId);
    setPlayerCards(valid.map(newCard));
    setView('entry');
  };

  const updateHole = (pIdx: number, hIdx: number, field: keyof HoleEntry, val: string) => {
    setPlayerCards(prev =>
      prev.map((pc, i) =>
        i !== pIdx ? pc : {
          ...pc,
          holes: pc.holes.map((h, j) => j !== hIdx ? h : { ...h, [field]: val }),
        }
      )
    );
  };

  const handleSave = async () => {
    if (!user) { toast.error('로그인이 필요합니다'); return; }
    setSaving(true);
    const course    = mockCourses.find(c => String(c.id) === courseId);
    const roundId   = currentRoundId || genId();
    const roundData = {
      courseId,
      courseName: course?.name ?? courseId,
      playedAt:   new Date(playDate).toISOString(),
      teeType,
      notes,
      players:    playerCards,
      media,
      createdAt:  editingRoundId
        ? (savedRounds.find(r => r.id === editingRoundId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid, 'rounds', roundId), roundData);
      const saved: SavedRound = { ...roundData, id: roundId };
      if (editingRoundId) {
        setSavedRounds(prev => prev.map(r => r.id === editingRoundId ? saved : r));
        toast.success('라운드가 수정되었습니다');
      } else {
        setSavedRounds(prev => [saved, ...prev]);
        toast.success('라운드가 저장되었습니다');
      }
      resetForm();
      setView('list');
      if (onClearPreselection) onClearPreselection();
    } catch (err) {
      console.error('저장 실패:', err);
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm('이 라운드를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'rounds', id));
      setSavedRounds(prev => prev.filter(r => r.id !== id));
      if (editingRoundId === id) { resetForm(); setView('list'); }
      toast.success('삭제되었습니다');
    } catch (err) {
      console.error('삭제 실패:', err);
      toast.error('삭제에 실패했습니다');
    }
  };

  // ── Media upload / delete ─────────────────────────────────────────────────

  const holePhotos = (hIdx: number) => media.filter(m => m.holeIndex === hIdx && m.type === 'photo');
  const holeVideos = (hIdx: number) => media.filter(m => m.holeIndex === hIdx && m.type === 'video');
  const totalPhotos = media.filter(m => m.type === 'photo').length;
  const totalVideos = media.filter(m => m.type === 'video').length;

  const handleMediaUpload = async (hIdx: number, file: File, type: 'photo' | 'video') => {
    if (!user || !currentRoundId) { toast.error('라운드를 먼저 저장해주세요'); return; }
    if (type === 'photo' && totalPhotos >= MAX_PHOTOS) { toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 가능합니다`); return; }
    if (type === 'video' && totalVideos >= MAX_VIDEOS) { toast.error(`동영상은 최대 ${MAX_VIDEOS}개까지 가능합니다`); return; }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('파일은 10MB 이하만 가능합니다');
      return;
    }

    setUploadingHole(hIdx);
    setUploadProgress(0);

    const ext      = file.name.split('.').pop() ?? (type === 'photo' ? 'jpg' : 'mp4');
    const itemId   = genId();
    const path     = `users/${user.uid}/rounds/${currentRoundId}/holes/${hIdx}/${itemId}.${ext}`;
    const sRef     = storageRef(storage, path);
    const task     = uploadBytesResumable(sRef, file);

    task.on('state_changed',
      snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      err  => { console.error('업로드 실패:', err); toast.error('업로드에 실패했습니다'); setUploadingHole(null); },
      async () => {
        const url        = await getDownloadURL(sRef);
        const newItem: MediaItem = { id: itemId, type, storagePath: path, url, holeIndex: hIdx, uploadedAt: new Date().toISOString() };
        const newMedia   = [...media, newItem];
        setMedia(newMedia);
        // Firestore에도 즉시 반영
        if (editingRoundId || currentRoundId) {
          const roundId = editingRoundId ?? currentRoundId;
          const existing = savedRounds.find(r => r.id === roundId);
          if (existing) {
            await setDoc(doc(db, 'users', user.uid, 'rounds', roundId), { ...existing, media: newMedia }).catch(console.error);
          }
        }
        toast.success('업로드 완료');
        setUploadingHole(null);
      }
    );
  };

  const handleMediaDelete = async (item: MediaItem) => {
    if (!user) return;
    try {
      await deleteObject(storageRef(storage, item.storagePath));
    } catch { /* 이미 삭제된 파일 무시 */ }
    const newMedia = media.filter(m => m.id !== item.id);
    setMedia(newMedia);
    const roundId  = editingRoundId ?? currentRoundId;
    const existing = savedRounds.find(r => r.id === roundId);
    if (existing && roundId) {
      await setDoc(doc(db, 'users', user.uid, 'rounds', roundId), { ...existing, media: newMedia }).catch(console.error);
    }
    toast.success('삭제되었습니다');
  };

  // ── Scorecard table ───────────────────────────────────────────────────────

  const HoleSection = ({
    playerIdx, playerCard, from, to, label,
  }: { playerIdx: number; playerCard: PlayerCard; from: number; to: number; label: string }) => {
    const indices      = Array.from({ length: to - from }, (_, i) => from + i);
    const sectionTotal = sumRange(playerCard.holes, from, to);
    const filled       = countFilled(playerCard.holes, from, to);
    const tdBase       = 'border border-gray-200 text-center p-0';

    return (
      <div className="w-full">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: COL_LABEL }} />
            {indices.map(i => <col key={i} />)}
            <col style={{ width: COL_TOTAL }} />
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-green-800 border border-green-700 text-white text-[9px] py-1.5" />
              {indices.map(i => (
                <th key={i} className="bg-green-800 border border-green-700 text-white text-[10px] font-bold py-1.5">
                  {i + 1}
                </th>
              ))}
              <th className="bg-green-950 border border-green-900 text-yellow-300 text-[9px] font-black py-1.5">
                {label}
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Score */}
            <tr className="bg-white">
              <td className={`sticky left-0 z-10 bg-green-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-8 text-[9px] font-black text-green-700">Sc</div>
              </td>
              {indices.map(i => {
                const sv      = playerCard.holes[i].score;
                const scColor = sv === '-2' ? 'text-blue-600' : sv === '-1' ? 'text-sky-500' :
                  sv === '0' ? 'text-green-700' : sv === '1' ? 'text-gray-700' :
                  sv !== '' ? 'text-red-600' : 'text-gray-300';
                const scLabel = sv === '' ? '·' : sv === '0' ? 'E' : sv;
                return (
                  <td key={i} className={tdBase}>
                    <div className="relative flex items-center justify-center h-8">
                      <span className={`pointer-events-none text-[11px] font-black ${scColor}`}>{scLabel}</span>
                      <select
                        value={sv}
                        onChange={e => updateHole(playerIdx, i, 'score', e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        <option value="">·</option>
                        {SCORE_OPTIONS.map(v => (
                          <option key={v} value={v}>{v === '0' ? 'E' : v}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                );
              })}
              <td className={`bg-amber-50 font-black text-[12px] ${tdBase} ${sectionTotal < 0 ? 'text-blue-600' : sectionTotal > 0 ? 'text-red-600' : 'text-green-700'}`}>
                <div className="flex items-center justify-center h-8">
                  {filled > 0 ? sectionTotal === 0 ? 'E' : sectionTotal > 0 ? `+${sectionTotal}` : sectionTotal : '—'}
                </div>
              </td>
            </tr>

            {/* Driver */}
            <tr>
              <td className={`sticky left-0 z-10 bg-blue-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-blue-700">D</div>
              </td>
              {indices.map(i => {
                const dv = playerCard.holes[i].driver;
                return (
                  <td key={i} className={`bg-blue-50/20 ${tdBase}`}>
                    <div className="relative flex items-center justify-center h-6">
                      <span className="pointer-events-none text-[10px] font-semibold text-blue-700">{dv || '·'}</span>
                      <select value={dv} onChange={e => updateHole(playerIdx, i, 'driver', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        <option value="">·</option>
                        <option value="F">F = {t('dFairway')}</option>
                        <option value="R">R = {t('dRough')}</option>
                        <option value="H">H = {t('dHazard')}</option>
                        <option value="O">O = {t('dOB')}</option>
                      </select>
                    </div>
                  </td>
                );
              })}
              <td className={`bg-blue-50/20 ${tdBase}`} />
            </tr>

            {/* Second shot */}
            <tr>
              <td className={`sticky left-0 z-10 bg-purple-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-purple-700">S</div>
              </td>
              {indices.map(i => {
                const sv2 = playerCard.holes[i].second;
                return (
                  <td key={i} className={`bg-purple-50/20 ${tdBase}`}>
                    <div className="relative flex items-center justify-center h-6">
                      <span className="pointer-events-none text-[10px] font-semibold text-purple-700">{sv2 || '·'}</span>
                      <select value={sv2} onChange={e => updateHole(playerIdx, i, 'second', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        <option value="">·</option>
                        <option value="O">O = {t('sOnGreen')}</option>
                        <option value="F">F = {t('sFairway')}</option>
                        <option value="X">X = {t('sMiss')}</option>
                      </select>
                    </div>
                  </td>
                );
              })}
              <td className={`bg-purple-50/20 ${tdBase}`} />
            </tr>

            {/* Putt */}
            <tr>
              <td className={`sticky left-0 z-10 bg-red-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-red-600">P</div>
              </td>
              {indices.map(i => {
                const pv = playerCard.holes[i].putt;
                return (
                  <td key={i} className={`bg-red-50/20 ${tdBase}`}>
                    <div className="relative flex items-center justify-center h-6">
                      <span className="pointer-events-none text-[10px] font-semibold text-red-600">{pv || '·'}</span>
                      <select value={pv} onChange={e => updateHole(playerIdx, i, 'putt', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                        <option value="">·</option>
                        {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={String(n)}>{n}</option>)}
                      </select>
                    </div>
                  </td>
                );
              })}
              <td className={`bg-red-50/20 ${tdBase}`} />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ── Player section ────────────────────────────────────────────────────────

  const PlayerSection = ({ playerIdx, playerCard }: { playerIdx: number; playerCard: PlayerCard }) => {
    const front       = sumRange(playerCard.holes, 0, 9);
    const back        = sumRange(playerCard.holes, 9, 18);
    const total       = front + back;
    const frontFilled = countFilled(playerCard.holes, 0, 9);
    const backFilled  = countFilled(playerCard.holes, 9, 18);
    const totalFilled = frontFilled + backFilled;
    const scoreLabel  = (val: number, filled: number) =>
      filled === 0 ? '—' : val === 0 ? 'E' : val > 0 ? `+${val}` : String(val);

    return (
      <div>
        <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[11px] font-black">{playerIdx + 1}</div>
            <span className="font-bold text-sm">{playerCard.name}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-400">전반 <span className={`font-bold ${frontFilled > 0 && front < 0 ? 'text-blue-400' : frontFilled > 0 && front > 0 ? 'text-red-400' : 'text-white'}`}>{scoreLabel(front, frontFilled)}</span></span>
            <span className="text-gray-400">후반 <span className={`font-bold ${backFilled > 0 && back < 0 ? 'text-blue-400' : backFilled > 0 && back > 0 ? 'text-red-400' : 'text-white'}`}>{scoreLabel(back, backFilled)}</span></span>
            <span className="text-gray-400">합계 <span className={`font-black ${totalFilled > 0 && total < 0 ? 'text-blue-300' : totalFilled > 0 && total === 0 ? 'text-green-400' : totalFilled > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{scoreLabel(total, totalFilled)}</span></span>
          </div>
        </div>
        <HoleSection playerIdx={playerIdx} playerCard={playerCard} from={0} to={9}  label="FRONT" />
        <div className="h-2 bg-gray-100 border-y border-gray-200" />
        <HoleSection playerIdx={playerIdx} playerCard={playerCard} from={9} to={18} label="BACK" />
      </div>
    );
  };

  // ── Media Manager Sheet (홀 선택) ────────────────────────────────────────

  const MediaManagerSheet = () => {
    const countMedia = (hIdx: number) => media.filter(m => m.holeIndex === hIdx).length;
    const hasMedia   = (hIdx: number) => media.some(m => m.holeIndex === hIdx);

    return (
      <Sheet open={showMediaManager} onOpenChange={setShowMediaManager}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          <SheetHeader className="pb-3 border-b border-gray-100">
            <SheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500" />
                사진 &amp; 동영상
              </span>
              <span className="text-xs font-normal text-gray-400">
                사진 {totalPhotos}/{MAX_PHOTOS} · 동영상 {totalVideos}/{MAX_VIDEOS}
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="py-4">
            <p className="text-[11px] text-gray-400 mb-3">홀을 탭해서 사진/동영상을 추가하세요</p>
            <div className="grid grid-cols-9 gap-2">
              {Array.from({ length: 18 }, (_, i) => {
                const cnt     = countMedia(i);
                const active  = hasMedia(i);
                const loading = uploadingHole === i;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedHole(i); setShowMediaManager(false); }}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-bold transition-all active:scale-95 ${
                      active
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                      <>
                        <span>{i + 1}</span>
                        {cnt > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                            {cnt}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // ── Media Sheet (per-hole) ────────────────────────────────────────────────

  const MediaSheet = () => {
    if (selectedHole === null) return null;
    const hIdx   = selectedHole;
    const photos = holePhotos(hIdx);
    const videos = holeVideos(hIdx);
    const uploading = uploadingHole === hIdx;

    return (
      <Sheet open={selectedHole !== null} onOpenChange={open => { if (!open) setSelectedHole(null); }}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-3 border-b border-gray-100">
            <SheetTitle className="flex items-center gap-2">
              <span>Hole {hIdx + 1}</span>
              <span className="text-sm font-normal text-gray-400">사진 & 동영상</span>
            </SheetTitle>
          </SheetHeader>

          {/* 업로드 버튼 */}
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading || totalPhotos >= MAX_PHOTOS}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-7 h-7 text-green-600" />
              <span className="text-sm font-semibold text-gray-700">사진 추가</span>
              <span className="text-[10px] text-gray-400">{totalPhotos}/{MAX_PHOTOS}장 · 최대 10MB</span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading || totalVideos >= MAX_VIDEOS}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Video className="w-7 h-7 text-blue-600" />
              <span className="text-sm font-semibold text-gray-700">동영상 추가</span>
              <span className="text-[10px] text-gray-400">{totalVideos}/{MAX_VIDEOS}개 · 최대 10MB</span>
            </button>
          </div>

          {/* 업로드 진행 */}
          {uploading && (
            <div className="mb-4 px-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>업로드 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* 사진 썸네일 */}
          {photos.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> 사진 {photos.length}장
              </p>
              <div className="grid grid-cols-3 gap-2">
                {photos.map(item => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={e => { e.stopPropagation(); handleMediaDelete(item); }}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 동영상 썸네일 */}
          {videos.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Play className="w-3 h-3" /> 동영상 {videos.length}개
              </p>
              <div className="grid grid-cols-3 gap-2">
                {videos.map(item => (
                  <div key={item.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-50" muted preload="metadata" />
                    <div className="relative z-10 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleMediaDelete(item); }}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 z-20"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length === 0 && videos.length === 0 && !uploading && (
            <div className="text-center py-8 text-gray-400">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">이 홀에 사진/동영상이 없습니다</p>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={photoInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleMediaUpload(hIdx, file, 'photo');
              e.target.value = '';
            }}
          />
          <input
            ref={videoInputRef} type="file" accept="video/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleMediaUpload(hIdx, file, 'video');
              e.target.value = '';
            }}
          />
        </SheetContent>
      </Sheet>
    );
  };

  // ── Media Preview Overlay ────────────────────────────────────────────────

  const MediaPreview = () => {
    if (!previewItem) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black flex flex-col"
        onClick={() => setPreviewItem(null)}
      >
        {/* 상단 툴바 */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <span className="text-white/60 text-sm">
            {previewItem.type === 'photo' ? '사진' : '동영상'} · Hole {(previewItem.holeIndex ?? 0) + 1}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { handleMediaDelete(previewItem); setPreviewItem(null); }}
              className="flex items-center gap-1.5 text-red-400 text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
            <button onClick={() => setPreviewItem(null)} className="text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 미디어 영역 */}
        <div className="flex-1 flex items-center justify-center p-2" onClick={e => e.stopPropagation()}>
          {previewItem.type === 'photo' ? (
            <img
              src={previewItem.url}
              className="max-w-full max-h-full object-contain rounded-lg"
              alt=""
            />
          ) : (
            <video
              src={previewItem.url}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full rounded-lg"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            />
          )}
        </div>

        {/* 하단 힌트 */}
        <div className="py-4 text-center flex-shrink-0">
          <p className="text-white/30 text-xs">
            {previewItem.type === 'photo' ? '탭해서 닫기' : ''}
          </p>
        </div>
      </div>
    );
  };

  // ── Legend ────────────────────────────────────────────────────────────────

  const Legend = () => (
    <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex-shrink-0">
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500">
        <span><span className="font-bold text-green-700">Sc</span>: -2=Eagle -1=Birdie E=Par +1=Bogey…</span>
        <span><span className="font-bold text-blue-600">D</span>: F={t('dFairway')} R={t('dRough')} H={t('dHazard')} O={t('dOB')}</span>
        <span><span className="font-bold text-purple-600">S</span>: O={t('sOnGreen')} F={t('sFairway')} X={t('sMiss')}</span>
        <span><span className="font-bold text-red-600">P</span>: Putts</span>
      </div>
    </div>
  );

  // ── View: List ────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold text-gray-900 text-lg">스코어카드</h2>
          <Button size="sm" onClick={() => setView('setup')}>
            <Plus className="w-4 h-4 mr-1.5" />새 라운드
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {loadingRounds ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
          ) : savedRounds.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-14 h-14 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">기록된 라운드가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">새 라운드를 시작해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRounds.map(round => {
                const first      = round.players[0];
                const ft         = first ? sumRange(first.holes, 0, 9)    : 0;
                const bk         = first ? sumRange(first.holes, 9, 18)   : 0;
                const tot        = ft + bk;
                const ftFilled   = first ? countFilled(first.holes, 0, 9)  : 0;
                const bkFilled   = first ? countFilled(first.holes, 9, 18) : 0;
                const totFilled  = ftFilled + bkFilled;
                const mediaCount = round.media?.length ?? 0;
                const scoreLabel = (val: number, filled: number) =>
                  filled === 0 ? '—' : val === 0 ? 'E' : val > 0 ? `+${val}` : String(val);
                return (
                  <div key={round.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                    onClick={() => handleOpenRound(round)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{round.courseName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(round.playedAt), 'yyyy년 MM월 dd일')} · {round.teeType} Tee
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-2xl font-black ${totFilled > 0 && tot < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                            {scoreLabel(tot, totFilled)}
                          </div>
                          <div className="text-[10px] text-gray-400 tracking-wide">TOTAL</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleDelete(round.id); }} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {(ftFilled > 0 || bkFilled > 0) && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>전반 {scoreLabel(ft, ftFilled)}</span>
                        <span>후반 {scoreLabel(bk, bkFilled)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{round.players.map(p => p.name).join(', ')}</span>
                      </div>
                      {mediaCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Camera className="w-3 h-3" />
                          <span>{mediaCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── View: Setup ───────────────────────────────────────────────────────────

  if (view === 'setup') {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => { setView('list'); resetForm(); if (onClearPreselection) onClearPreselection(); }} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-gray-900">새 라운드 설정</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32">
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('selectCourse')}</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={!!preselectedCourse}>
              <SelectTrigger><SelectValue placeholder="코스를 선택하세요" /></SelectTrigger>
              <SelectContent>
                {mockCourses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name} · {c.region}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('date')}</Label>
            <Input type="date" value={playDate} onChange={e => setPlayDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('teeType')}</Label>
            <Select value={teeType} onValueChange={setTeeType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['White', 'Blue', 'Red', 'Black'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('players')}</Label>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input placeholder={`Player ${idx + 1}`} value={p} onChange={e => { const next = [...players]; next[idx] = e.target.value; setPlayers(next); }} />
                  {players.length > 1 && (
                    <Button variant="outline" size="icon" onClick={() => setPlayers(players.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {players.length < 6 && (
                <Button variant="outline" size="sm" onClick={() => setPlayers([...players, ''])}>
                  <Plus className="w-4 h-4 mr-1.5" />플레이어 추가
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('notes')}</Label>
            <Input placeholder="메모 (선택)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10">
          <Button className="w-full h-12 text-base font-bold" onClick={handleStartEntry}>
            스코어 입력 시작<ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── View: Entry ───────────────────────────────────────────────────────────

  const courseName = mockCourses.find(c => String(c.id) === courseId)?.name ?? courseId;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-green-800 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <button onClick={() => { setView('list'); resetForm(); if (onClearPreselection) onClearPreselection(); }} className="flex items-center gap-1 text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" /><span className="text-xs">목록</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-bold">{courseName}</div>
          <div className="text-[10px] text-white/60">{playDate} · {teeType} Tee</div>
        </div>
        <div className="flex items-center gap-2">
          {/* 📷 카메라 버튼 */}
          <button
            onClick={() => setShowMediaManager(true)}
            className="relative flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>사진/동영상</span>
            {media.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-400 text-white text-[9px] rounded-full flex items-center justify-center font-black">
                {media.length}
              </span>
            )}
          </button>
          {/* 💾 저장 버튼 */}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            저장
          </button>
        </div>
      </div>

      <Legend />

      {/* Scorecard + Media Rail */}
      <div className="flex-1 overflow-y-auto">
        {playerCards.map((pc, pIdx) => (
          <div key={pIdx}>
            <PlayerSection playerIdx={pIdx} playerCard={pc} />
            {pIdx < playerCards.length - 1 && <div className="h-4 bg-gray-200 border-y border-gray-300" />}
          </div>
        ))}

        <div className="h-20" />
      </div>

      <MediaManagerSheet />
      <MediaSheet />
      <MediaPreview />
    </div>
  );
}
