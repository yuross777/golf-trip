import { useState, useEffect } from 'react';
import { Plus, Calendar, ArrowLeft, Save, Trash2, Users, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Course, mockCourses } from '../data/mockData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

type ScoreVal  = '' | '-2' | '-1' | '0' | '1' | '2' | '3' | '4' | '5';
type DriverVal = '' | 'F' | 'R' | 'H' | 'O';
type SecondVal = '' | 'O' | 'F' | 'X';
type PuttVal   = '' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

interface HoleEntry {
  score:  ScoreVal;
  driver: DriverVal;
  second: SecondVal;
  putt:   PuttVal;
}

interface PlayerCard {
  name:  string;
  holes: HoleEntry[]; // 0-based: index 0 = hole 1, index 17 = hole 18
}

interface SavedRound {
  id:         string;
  courseId:   string;
  courseName: string;
  playedAt:   string;
  teeType:    string;
  notes:      string;
  players:    PlayerCard[];
  createdAt:  string;
}

type AppView = 'list' | 'setup' | 'entry' | 'detail';

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyHole = (): HoleEntry => ({ score: '', driver: '', second: '', putt: '' });
const newCard   = (name: string): PlayerCard => ({
  name:  name.trim() || 'Player',
  holes: Array.from({ length: 18 }, emptyHole),
});

const sumRange = (holes: HoleEntry[], from: number, to: number) =>
  holes.slice(from, to).reduce((acc, h) => acc + (parseInt(h.score) || 0), 0);

const countFilled = (holes: HoleEntry[], from: number, to: number) =>
  holes.slice(from, to).filter(h => h.score !== '').length;

const SCORE_OPTIONS: ScoreVal[] = ['-2', '-1', '0', '1', '2', '3', '4', '5'];

// Firestore path helper
const roundsCol = (uid: string) => collection(db, 'users', uid, 'rounds');

// ── Column sizing (fixed cols only — hole cols fill remaining width) ──────────

const COL_LABEL = 34;   // sticky left label column (px) — fixed
const COL_TOTAL = 38;   // Front / Back total column (px) — fixed

// ── Props ──────────────────────────────────────────────────────────────────────

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
  const [selectedRound, setSelectedRound] = useState<SavedRound | null>(null);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [saving,        setSaving]        = useState(false);

  // Setup form
  const [courseId, setCourseId] = useState(preselectedCourse?.id ?? '');
  const [playDate, setPlayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [players,  setPlayers]  = useState<string[]>(['']);
  const [teeType,  setTeeType]  = useState('White');
  const [notes,    setNotes]    = useState('');

  // Entry cards
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);

  // ── Firestore: 라운드 목록 로드 ───────────────────────────────────────────

  useEffect(() => {
    if (!user) { setLoadingRounds(false); return; }
    setLoadingRounds(true);
    const q = query(roundsCol(user.uid), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then(snapshot => {
        const rounds = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as SavedRound));
        setSavedRounds(rounds);
      })
      .catch(err => {
        console.error('라운드 로드 실패:', err);
        toast.error('라운드 목록을 불러오지 못했습니다');
      })
      .finally(() => setLoadingRounds(false));
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const resetSetup = () => {
    if (!preselectedCourse) setCourseId('');
    setPlayDate(format(new Date(), 'yyyy-MM-dd'));
    setPlayers(['']);
    setTeeType('White');
    setNotes('');
    setPlayerCards([]);
  };

  const handleStartEntry = () => {
    if (!courseId) { toast.error('코스를 선택해주세요'); return; }
    const valid = players.filter(p => p.trim());
    if (valid.length === 0) { toast.error('플레이어를 입력해주세요'); return; }
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
    const course = mockCourses.find(c => c.id === courseId);
    const roundData = {
      courseId,
      courseName: course?.name ?? '',
      playedAt:   new Date(playDate).toISOString(),
      teeType,
      notes,
      players:    playerCards,
      createdAt:  new Date().toISOString(),
    };
    try {
      const docRef = await addDoc(roundsCol(user.uid), roundData);
      const newRound: SavedRound = { ...roundData, id: docRef.id };
      setSavedRounds(prev => [newRound, ...prev]);
      toast.success('라운드가 저장되었습니다');
      resetSetup();
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
      if (selectedRound?.id === id) { setSelectedRound(null); setView('list'); }
      toast.success('삭제되었습니다');
    } catch (err) {
      console.error('삭제 실패:', err);
      toast.error('삭제에 실패했습니다');
    }
  };

  // ── Shared: Scorecard table (editable or read-only) ───────────────────────

  const HoleSection = ({
    playerIdx,
    playerCard,
    from,
    to,
    label,
    readOnly = false,
  }: {
    playerIdx: number;
    playerCard: PlayerCard;
    from: number;
    to: number;
    label: string;
    readOnly?: boolean;
  }) => {
    const indices      = Array.from({ length: to - from }, (_, i) => from + i);
    const sectionTotal = sumRange(playerCard.holes, from, to);
    const filled       = countFilled(playerCard.holes, from, to);

    const tdBase = 'border border-gray-200 text-center p-0';

    return (
      <div className="w-full">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: 'fixed' }}
        >
          <colgroup>
            <col style={{ width: COL_LABEL }} />
            {indices.map(i => <col key={i} />)}
            <col style={{ width: COL_TOTAL }} />
          </colgroup>

          {/* Hole number header */}
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
              {indices.map(i => (
                <td key={i} className={tdBase}>
                  {readOnly ? (
                    <div className={`flex items-center justify-center h-8 text-[12px] font-black ${
                      playerCard.holes[i].score === ''    ? 'text-gray-300' :
                      playerCard.holes[i].score === '-2'  ? 'text-blue-600' :
                      playerCard.holes[i].score === '-1'  ? 'text-sky-500'  :
                      playerCard.holes[i].score === '0'   ? 'text-green-700':
                      playerCard.holes[i].score === '1'   ? 'text-gray-700' :
                                                            'text-red-600'
                    }`}>
                      {playerCard.holes[i].score === '' ? '—' :
                       playerCard.holes[i].score === '0' ? 'E' :
                       Number(playerCard.holes[i].score) > 0 ? `+${playerCard.holes[i].score}` :
                       playerCard.holes[i].score}
                    </div>
                  ) : (
                    <select
                      value={playerCard.holes[i].score}
                      onChange={e => updateHole(playerIdx, i, 'score', e.target.value)}
                      className={`w-full h-8 text-center text-[11px] font-black bg-transparent outline-none cursor-pointer ${
                        playerCard.holes[i].score === '-2' ? 'text-blue-600' :
                        playerCard.holes[i].score === '-1' ? 'text-sky-500'  :
                        playerCard.holes[i].score === '0'  ? 'text-green-700':
                        playerCard.holes[i].score === '1'  ? 'text-gray-700' :
                        playerCard.holes[i].score !== ''   ? 'text-red-600'  : 'text-gray-400'
                      }`}
                    >
                      <option value="">·</option>
                      {SCORE_OPTIONS.map(v => (
                        <option key={v} value={v}>
                          {v === '0' ? 'E' : Number(v) > 0 ? `+${v}` : v}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              ))}
              <td className={`bg-amber-50 font-black text-[12px] ${tdBase} ${
                sectionTotal < 0 ? 'text-blue-600' : sectionTotal > 0 ? 'text-red-600' : 'text-green-700'
              }`}>
                <div className="flex items-center justify-center h-8">
                  {filled > 0
                    ? sectionTotal === 0 ? 'E'
                      : sectionTotal > 0 ? `+${sectionTotal}`
                      : sectionTotal
                    : '—'}
                </div>
              </td>
            </tr>

            {/* Driver */}
            <tr>
              <td className={`sticky left-0 z-10 bg-blue-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-blue-700">D</div>
              </td>
              {indices.map(i => (
                <td key={i} className={`bg-blue-50/20 ${tdBase}`}>
                  {readOnly ? (
                    <div className="flex items-center justify-center h-6 text-[10px] font-semibold text-blue-700">
                      {playerCard.holes[i].driver || '·'}
                    </div>
                  ) : (
                    <select
                      value={playerCard.holes[i].driver}
                      onChange={e => updateHole(playerIdx, i, 'driver', e.target.value)}
                      className="w-full h-6 text-center text-[10px] font-semibold bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">·</option>
                      <option value="F">F</option>
                      <option value="R">R</option>
                      <option value="H">H</option>
                      <option value="O">O</option>
                    </select>
                  )}
                </td>
              ))}
              <td className={`bg-blue-50/20 ${tdBase}`} />
            </tr>

            {/* Second shot */}
            <tr>
              <td className={`sticky left-0 z-10 bg-purple-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-purple-700">S</div>
              </td>
              {indices.map(i => (
                <td key={i} className={`bg-purple-50/20 ${tdBase}`}>
                  {readOnly ? (
                    <div className="flex items-center justify-center h-6 text-[10px] font-semibold text-purple-700">
                      {playerCard.holes[i].second || '·'}
                    </div>
                  ) : (
                    <select
                      value={playerCard.holes[i].second}
                      onChange={e => updateHole(playerIdx, i, 'second', e.target.value)}
                      className="w-full h-6 text-center text-[10px] font-semibold bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">·</option>
                      <option value="O">O</option>
                      <option value="F">F</option>
                      <option value="X">X</option>
                    </select>
                  )}
                </td>
              ))}
              <td className={`bg-purple-50/20 ${tdBase}`} />
            </tr>

            {/* Putt */}
            <tr>
              <td className={`sticky left-0 z-10 bg-red-50 ${tdBase}`}>
                <div className="flex items-center justify-center h-6 text-[9px] font-black text-red-600">P</div>
              </td>
              {indices.map(i => (
                <td key={i} className={`bg-red-50/20 ${tdBase}`}>
                  {readOnly ? (
                    <div className="flex items-center justify-center h-6 text-[10px] font-semibold text-red-600">
                      {playerCard.holes[i].putt || '·'}
                    </div>
                  ) : (
                    <select
                      value={playerCard.holes[i].putt}
                      onChange={e => updateHole(playerIdx, i, 'putt', e.target.value)}
                      className="w-full h-6 text-center text-[10px] font-semibold bg-transparent outline-none cursor-pointer"
                    >
                      <option value="">·</option>
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <option key={n} value={String(n)}>{n}</option>
                      ))}
                    </select>
                  )}
                </td>
              ))}
              <td className={`bg-red-50/20 ${tdBase}`} />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // ── Player section (name header + front/back tables) ──────────────────────

  const PlayerSection = ({
    playerIdx,
    playerCard,
    readOnly = false,
  }: {
    playerIdx: number;
    playerCard: PlayerCard;
    readOnly?: boolean;
  }) => {
    const front       = sumRange(playerCard.holes, 0, 9);
    const back        = sumRange(playerCard.holes, 9, 18);
    const total       = front + back;
    const frontFilled = countFilled(playerCard.holes, 0, 9);
    const backFilled  = countFilled(playerCard.holes, 9, 18);
    const totalFilled = frontFilled + backFilled;

    const scoreLabel = (val: number, filled: number) =>
      filled === 0 ? '—' : val === 0 ? 'E' : val > 0 ? `+${val}` : String(val);

    return (
      <div>
        {/* Player name + summary bar */}
        <div className="flex items-center justify-between bg-gray-800 text-white px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[11px] font-black">
              {playerIdx + 1}
            </div>
            <span className="font-bold text-sm">{playerCard.name}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-400">
              전반 <span className={`font-bold ${frontFilled > 0 && front < 0 ? 'text-blue-400' : frontFilled > 0 && front > 0 ? 'text-red-400' : 'text-white'}`}>
                {scoreLabel(front, frontFilled)}
              </span>
            </span>
            <span className="text-gray-400">
              후반 <span className={`font-bold ${backFilled > 0 && back < 0 ? 'text-blue-400' : backFilled > 0 && back > 0 ? 'text-red-400' : 'text-white'}`}>
                {scoreLabel(back, backFilled)}
              </span>
            </span>
            <span className="text-gray-400">
              합계 <span className={`font-black ${
                totalFilled > 0 && total < 0 ? 'text-blue-300' :
                totalFilled > 0 && total === 0 ? 'text-green-400' :
                totalFilled > 0 ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {scoreLabel(total, totalFilled)}
              </span>
            </span>
          </div>
        </div>

        {/* Front 9 */}
        <HoleSection playerIdx={playerIdx} playerCard={playerCard} from={0} to={9} label="FRONT" readOnly={readOnly} />

        {/* Divider */}
        <div className="h-2 bg-gray-100 border-y border-gray-200" />

        {/* Back 9 */}
        <HoleSection playerIdx={playerIdx} playerCard={playerCard} from={9} to={18} label="BACK" readOnly={readOnly} />
      </div>
    );
  };

  // ── Legend bar ────────────────────────────────────────────────────────────

  const Legend = () => (
    <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex-shrink-0">
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500">
        <span><span className="font-bold text-green-700">Sc</span>: -2=이글 -1=버디 E=파 +1=보기 +2=더블…</span>
        <span><span className="font-bold text-blue-600">D</span>: F=페어웨이 R=러프 H=해저드 O=OB</span>
        <span><span className="font-bold text-purple-600">S</span>: O=온그린 F=페어웨이 X=미스</span>
        <span><span className="font-bold text-red-600">P</span>: 퍼트수</span>
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
            <Plus className="w-4 h-4 mr-1.5" />
            새 라운드
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {loadingRounds ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : savedRounds.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-14 h-14 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">기록된 라운드가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">새 라운드를 시작해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRounds.map(round => {
                const first = round.players[0];
                const ft    = first ? sumRange(first.holes, 0, 9)  : 0;
                const bk    = first ? sumRange(first.holes, 9, 18) : 0;
                const tot   = ft + bk;
                const ftFilled = first ? countFilled(first.holes, 0, 9)  : 0;
                const bkFilled = first ? countFilled(first.holes, 9, 18) : 0;
                const totFilled = ftFilled + bkFilled;
                const scoreLabel = (val: number, filled: number) =>
                  filled === 0 ? '—' : val === 0 ? 'E' : val > 0 ? `+${val}` : String(val);
                return (
                  <div
                    key={round.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                    onClick={() => { setSelectedRound(round); setView('detail'); }}
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
                          <div className={`text-2xl font-black ${
                            totFilled > 0 && tot < 0 ? 'text-blue-600' :
                            totFilled > 0 && tot === 0 ? 'text-green-600' :
                            'text-green-600'
                          }`}>
                            {scoreLabel(tot, totFilled)}
                          </div>
                          <div className="text-[10px] text-gray-400 tracking-wide">TOTAL</div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(round.id); }}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        >
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

                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{round.players.map(p => p.name).join(', ')}</span>
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

  // ── View: Detail ──────────────────────────────────────────────────────────

  if (view === 'detail' && selectedRound) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-green-800 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => { setView('list'); setSelectedRound(null); }}
            className="flex items-center gap-1 text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">목록</span>
          </button>
          <div className="text-center">
            <div className="text-sm font-bold">{selectedRound.courseName}</div>
            <div className="text-[10px] text-white/60">
              {format(new Date(selectedRound.playedAt), 'yyyy년 MM월 dd일')} · {selectedRound.teeType} Tee
            </div>
          </div>
          <button
            onClick={() => { handleDelete(selectedRound.id); }}
            className="text-white/50 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <Legend />

        {/* All players read-only */}
        <div className="flex-1 overflow-y-auto">
          {selectedRound.players.map((pc, pIdx) => (
            <div key={pIdx}>
              <PlayerSection playerIdx={pIdx} playerCard={pc} readOnly={true} />
              {pIdx < selectedRound.players.length - 1 && (
                <div className="h-4 bg-gray-200 border-y border-gray-300" />
              )}
            </div>
          ))}
          {selectedRound.notes && (
            <div className="px-4 py-3 text-sm text-gray-600 bg-white border-t border-gray-100">
              <span className="font-semibold text-gray-700">메모: </span>{selectedRound.notes}
            </div>
          )}
          <div className="h-20" />
        </div>
      </div>
    );
  }

  // ── View: Setup ───────────────────────────────────────────────────────────

  if (view === 'setup') {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => { setView('list'); resetSetup(); if (onClearPreselection) onClearPreselection(); }}
            className="text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-gray-900">새 라운드 설정</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32">
          {/* Course */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('selectCourse')}</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={!!preselectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="코스를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {mockCourses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} · {c.region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('date')}</Label>
            <Input type="date" value={playDate} onChange={e => setPlayDate(e.target.value)} />
          </div>

          {/* Tee type */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('teeType')}</Label>
            <Select value={teeType} onValueChange={setTeeType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['White', 'Blue', 'Red', 'Black'].map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Players */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('players')}</Label>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder={`Player ${idx + 1}`}
                    value={p}
                    onChange={e => {
                      const next = [...players];
                      next[idx] = e.target.value;
                      setPlayers(next);
                    }}
                  />
                  {players.length > 1 && (
                    <Button variant="outline" size="icon"
                      onClick={() => setPlayers(players.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {players.length < 6 && (
                <Button variant="outline" size="sm" onClick={() => setPlayers([...players, ''])}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  플레이어 추가
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="mb-1.5 block text-sm font-semibold">{t('notes')}</Label>
            <Input placeholder="메모 (선택)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-10">
          <Button className="w-full h-12 text-base font-bold" onClick={handleStartEntry}>
            스코어 입력 시작
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ── View: Entry ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-green-800 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setView('setup')}
          className="flex items-center gap-1 text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">설정</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-bold">
            {mockCourses.find(c => c.id === courseId)?.name ?? ''}
          </div>
          <div className="text-[10px] text-white/60">{playDate} · {teeType} Tee</div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          저장
        </button>
      </div>

      <Legend />

      {/* All players stacked — vertical scroll */}
      <div className="flex-1 overflow-y-auto">
        {playerCards.map((pc, pIdx) => (
          <div key={pIdx}>
            <PlayerSection playerIdx={pIdx} playerCard={pc} readOnly={false} />
            {pIdx < playerCards.length - 1 && (
              <div className="h-4 bg-gray-200 border-y border-gray-300" />
            )}
          </div>
        ))}
        <div className="h-20" />
      </div>
    </div>
  );
}
