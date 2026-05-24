'use client'

import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { useGameBoard } from '@/lib/contexts/GameBoardContext';
import { CardType } from '@/lib/contexts/GameBoardContext';

interface GameBoardProps {
  role: 'giver' | 'guesser';
}

// Resize to max 1024px and convert to JPEG to keep payloads small and avoid format issues.
function compressImage(file: File, maxPx = 1024): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (file.size === 0) {
      reject(new Error('Selected file is empty. Please try again.'));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const [header, data] = dataUrl.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
      resolve({ data, mimeType });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. Please try a different photo.'));
    };
    img.src = objectUrl;
  });
}

async function callVisionApi(
  image: string,
  mimeType: string,
  type: 'words' | 'colors'
): Promise<string[]> {
  const res = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, mimeType, type }),
  });
  let json: { data?: string[]; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error('Unexpected server response — please try again.');
  }
  if (!res.ok) throw new Error(json.error ?? 'Vision API failed');
  return json.data as string[];
}

export default function GameBoard({ role }: GameBoardProps) {
  const { cards, setCards, notes, setNotes, resetBoard, generateShareCode } = useGameBoard();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editColor, setEditColor] = useState<CardType['color']>('white');
  const [editGuessed, setEditGuessed] = useState(false);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [timeLeft, setTimeLeft] = useState(120);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Vision scan state
  const [wordScanLoading, setWordScanLoading] = useState(false);
  const [colorScanLoading, setColorScanLoading] = useState(false);
  const [wordScanResult, setWordScanResult] = useState<string[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timerState === 'running') {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        setTimerState('done');
      }
    } else if (timerState === 'paused' || timerState === 'idle' || timerState === 'done') {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerState, timeLeft]);

  const startTimer = () => { setTimeLeft(120); setTimerState('running'); };
  const pauseTimer = () => setTimerState('paused');
  const resumeTimer = () => setTimerState('running');
  const cancelTimer = () => { setTimerState('idle'); setTimeLeft(120); };
  const resetTimer = () => { setTimerState('idle'); setTimeLeft(120); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const openCardEditor = (index: number) => {
    setSelectedCard(index);
    setEditWord(cards[index].word);
    setEditColor(cards[index].color);
    setEditGuessed(cards[index].guessed ?? false);
  };

  const saveCardEdit = () => {
    if (selectedCard === null) return;
    setCards((currentCards: CardType[]) => {
      const newCards = [...currentCards];
      newCards[selectedCard] = {
        word: editWord,
        color: editColor,
        guessed: editGuessed,
      };
      return newCards;
    });
    setSelectedCard(null);
  };

  const cancelEdit = () => setSelectedCard(null);

  const handleShare = async () => {
    setShareLoading(true);
    setShowShareModal(true);
    const code = await generateShareCode();
    setShareLoading(false);
    if (code) {
      setShareCode(code);
    } else {
      setShowShareModal(false);
      alert('Failed to generate share code. Please try again.');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      alert('Code copied!');
    } catch {
      // fallback: select the text
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}?board=${shareCode}&role=${role}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    } catch {
      // fallback
    }
  };

  // ── Vision: word scan ──────────────────────────────────────────────────────

  const handleWordFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanError(null);
    setWordScanLoading(true);
    try {
      const { data, mimeType } = await compressImage(file);
      const words = await callVisionApi(data, mimeType, 'words');
      setWordScanResult(words);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Word scan failed');
    } finally {
      setWordScanLoading(false);
    }
  };

  const confirmWordScan = () => {
    if (!wordScanResult) return;
    setCards((currentCards: CardType[]) =>
      currentCards.map((card, i) => ({
        ...card,
        word: wordScanResult[i] ?? card.word,
      }))
    );
    setWordScanResult(null);
  };

  // ── Vision: color scan ─────────────────────────────────────────────────────

  const handleColorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanError(null);
    setColorScanLoading(true);
    try {
      const { data, mimeType } = await compressImage(file);
      const colors = await callVisionApi(data, mimeType, 'colors');
      setCards((currentCards: CardType[]) =>
        currentCards.map((card, i) => ({
          ...card,
          color: (colors[i] as CardType['color']) ?? card.color,
        }))
      );
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Color scan failed');
    } finally {
      setColorScanLoading(false);
    }
  };

  // ── Quick-add: append color-filtered words to notes ──────────────────────
  const wordsOf = (color: CardType['color']) =>
    cards.filter(c => c.color === color && c.word.trim()).map(c => c.word.trim());

  const addColorToNotes = (color: CardType['color'], header: string) => {
    const list = `${header}\n${wordsOf(color).join('\n')}`;
    setNotes(prev => prev.trim() ? `${prev.trim()}\n\n${list}` : list);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 pt-4 pb-8">

      {/* Header row: role label + scan buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          You are the{' '}
          <span className={role === 'giver' ? 'text-red-400 font-extrabold' : 'text-blue-400 font-extrabold'}>
            {role}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Word scan button */}
          <button
            onClick={() => wordInputRef.current?.click()}
            disabled={wordScanLoading || colorScanLoading}
            title="Scan board words from photo"
            className="p-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-50 transition-colors"
            aria-label="Scan board words"
          >
            {wordScanLoading
              ? <span className="block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              : <Camera size={20} className="text-slate-300" />
            }
          </button>

          {/* Color map scan button — giver only */}
          {role === 'giver' && (
            <button
              onClick={() => colorInputRef.current?.click()}
              disabled={wordScanLoading || colorScanLoading}
              title="Scan color map from photo"
              className="p-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-50 transition-colors"
              aria-label="Scan color map"
            >
              {colorScanLoading
                ? <span className="block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                : (
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    <rect x="0" y="0" width="9" height="9" rx="1.5" fill="#ef4444" />
                    <rect x="11" y="0" width="9" height="9" rx="1.5" fill="#3b82f6" />
                    <rect x="0" y="11" width="9" height="9" rx="1.5" fill="#fde68a" />
                    <rect x="11" y="11" width="9" height="9" rx="1.5" fill="#111111" />
                  </svg>
                )
              }
            </button>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={wordInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleWordFileChange}
      />
      <input
        ref={colorInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleColorFileChange}
      />

      {/* Scan error banner */}
      {scanError && (
        <div className="mb-3 px-4 py-2 bg-red-950/50 border border-red-800 rounded-lg text-sm text-red-400 flex items-center justify-between">
          <span>{scanError}</span>
          <button onClick={() => setScanError(null)} className="ml-2 text-red-500 hover:text-red-300 font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-5 gap-[2px] sm:gap-2 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => openCardEditor(index)}
            className={`
              aspect-square rounded-lg border-2 cursor-pointer relative
              flex items-center justify-center text-center
              p-1 sm:p-2
              ${card.color === 'red' ? 'bg-red-500 hover:bg-red-600 border-red-600' :
                card.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 border-blue-600' :
                card.color === 'black' ? 'bg-black hover:bg-gray-900 border-gray-800' :
                card.color === 'beige' ? 'bg-amber-200 hover:bg-amber-300 border-amber-300' :
                'bg-slate-600 hover:bg-slate-500 border-slate-500'
              }
              transition-colors duration-200
              w-full
              min-h-[60px] min-w-[60px]
              sm:min-h-[80px] sm:min-w-[80px]
              md:min-h-[90px] md:min-w-[90px]
              lg:min-h-[100px] lg:min-w-[100px]
            `}
            style={{
              height: 'clamp(60px, 18vw, 120px)',
              width: 'clamp(60px, 18vw, 120px)',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
            }}
          >
            {/* Guessed overlay */}
            {card.guessed && (
              <div className="absolute inset-0 rounded-lg bg-gray-500 bg-opacity-70 flex items-center justify-center z-10">
                <span className="text-white text-xs font-bold select-none">✓</span>
              </div>
            )}
            <span
              className={`w-full text-center font-medium select-none truncate leading-tight
                ${card.color === 'beige' ? 'text-black' : 'text-white'}
              `}
              style={{
                fontSize: 'clamp(0.8rem, 4vw, 1.2rem)',
                wordBreak: 'break-word',
                whiteSpace: 'pre-line',
                lineHeight: 1.1,
                display: 'block',
                maxWidth: '100%',
                overflowWrap: 'break-word',
              }}
            >
              {card.word || <span className="opacity-40">Tap to edit</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Card Editor Overlay */}
      {selectedCard !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-slate-800 border border-slate-700 w-11/12 max-w-sm rounded-xl p-6 shadow-xl relative flex flex-col gap-4">
            <button
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-200 text-2xl font-bold"
              onClick={cancelEdit}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-2 text-white">Edit Card</h3>

            <label className="block mb-2 text-sm font-medium text-slate-300">Word</label>
            <input
              type="text"
              value={editWord}
              onChange={e => setEditWord(e.target.value)}
              className="w-full p-2 border border-slate-600 rounded-lg bg-slate-700 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
              maxLength={20}
              autoFocus
              placeholder="Word"
            />

            <label className="block mt-2 mb-1 text-sm font-medium text-slate-300">Color</label>
            <div className="flex gap-2 mb-2">
              {(['red', 'blue', 'beige', 'black'] as CardType['color'][]).map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-24 h-10 rounded-full border-2 flex items-center justify-center px-4
                    ${editColor === color ? 'ring-2 ring-blue-400' : ''}
                    ${color === 'red' ? 'bg-red-500 border-red-600' :
                      color === 'blue' ? 'bg-blue-500 border-blue-600' :
                      color === 'black' ? 'bg-black border-slate-600' :
                      'bg-amber-200 border-amber-300'}
                  `}
                  onClick={() => setEditColor(color)}
                  aria-label={color}
                >
                  {color === 'red' && <span className="text-white font-semibold">Red</span>}
                  {color === 'blue' && <span className="text-white font-semibold">Blue</span>}
                  {color === 'beige' && <span className="text-black font-semibold">Civilian</span>}
                  {color === 'black' && <span className="text-white font-semibold">Death</span>}
                </button>
              ))}
            </div>

            {/* Guessed toggle */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setEditGuessed(g => !g)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                  ${editGuessed ? 'bg-slate-400' : 'bg-slate-700'}`}
                aria-label="Toggle guessed"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${editGuessed ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
              <span className="text-sm font-medium text-slate-300">
                {editGuessed ? 'Marked as guessed' : 'Mark as guessed'}
              </span>
            </div>

            <button
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              onClick={saveCardEdit}
            >
              Save & Back
            </button>
          </div>
        </div>
      )}

      {/* Word Scan Confirmation Modal */}
      {wordScanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Detected Words</h3>
            <p className="text-sm text-slate-400">Review the words below. Tap Confirm to apply them to the board.</p>
            <div className="grid grid-cols-5 gap-1">
              {wordScanResult.map((word, i) => (
                <div
                  key={i}
                  className="bg-slate-700 rounded text-center text-xs font-medium py-1 px-0.5 truncate text-slate-200"
                  title={word}
                >
                  {word}
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setWordScanResult(null)}
                className="flex-1 border border-slate-600 text-slate-400 py-2 rounded-lg hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmWordScan}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-add words to notes — giver only */}
      {role === 'giver' && (
        <div className="mb-4">
        <p className="text-slate-500 text-xs tracking-wide mb-2">Add these cards to your notes:</p>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { color: 'blue',  label: 'Blue',      header: '--BLUE CARDS--',     active: 'bg-blue-600 hover:bg-blue-500' },
              { color: 'red',   label: 'Red',        header: '--RED CARDS--',      active: 'bg-red-600 hover:bg-red-500' },
              { color: 'black', label: 'Death',      header: '--DEATH CARD--',     active: 'bg-gray-900 hover:bg-gray-800 border border-slate-600' },
              { color: 'beige', label: 'Civilians',  header: '--CIVILIAN CARDS--', active: 'bg-amber-500 hover:bg-amber-400' },
            ] as { color: CardType['color']; label: string; header: string; active: string }[]
          ).map(({ color, label, header, active }) => {
            const enabled = wordsOf(color).length > 0;
            return (
              <button
                key={color}
                onClick={() => addColorToNotes(color, header)}
                disabled={!enabled}
                title={enabled ? `Add ${label} words to notes` : 'No words set for this color yet'}
                className={`py-2 px-1 rounded-lg text-xs font-bold tracking-wide transition-all duration-150 text-white ${
                  enabled ? `${active} active:scale-95` : 'bg-slate-700 opacity-30 cursor-not-allowed'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your clues and notes here..."
          className="w-full h-32 p-3 border-2 border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-white bg-slate-800 placeholder-slate-600"
        />
      </div>

      {/* Countdown Timer */}
      <div className="mt-2 flex flex-col items-center">
        {timerState === 'idle' && (
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            onClick={startTimer}
          >
            Start a 2 minute countdown
          </button>
        )}
        {timerState === 'running' && (
          <>
            <div className="text-3xl font-mono mb-2 text-white">{formatTime(timeLeft)}</div>
            <div className="flex gap-2">
              <button className="bg-amber-500 text-white px-4 py-1 rounded hover:bg-amber-600" onClick={pauseTimer}>Pause</button>
              <button className="bg-slate-700 text-slate-200 px-4 py-1 rounded hover:bg-slate-600" onClick={cancelTimer}>Cancel</button>
            </div>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <div className="text-3xl font-mono mb-2 text-white">{formatTime(timeLeft)}</div>
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700" onClick={resumeTimer}>Resume</button>
              <button className="bg-slate-700 text-slate-200 px-4 py-1 rounded hover:bg-slate-600" onClick={cancelTimer}>Cancel</button>
            </div>
          </>
        )}
        {timerState === 'done' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-bold text-red-400">Time&apos;s Up!</div>
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              onClick={resetTimer}
            >
              Start a 2 minute countdown
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center mb-4">
        <button
          onClick={resetBoard}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-semibold"
        >
          New Game
        </button>
        <button
          onClick={handleShare}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Share Board
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-white">Share Board</h2>

            {shareLoading ? (
              <div className="text-center text-slate-400 py-4">Generating code...</div>
            ) : (
              <>
                <p className="text-sm text-slate-400 mb-2">Board Code</p>
                <div className="bg-slate-700 rounded-xl p-4 text-center mb-3">
                  <span className="text-4xl font-mono font-bold tracking-widest text-white">{shareCode}</span>
                </div>
                <button
                  onClick={copyCode}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition mb-4"
                >
                  Copy Code
                </button>

                <p className="text-sm text-slate-400 mb-2">Or share full link</p>
                <p className="text-xs text-slate-500 break-all mb-2">
                  {typeof window !== 'undefined' ? `${window.location.origin}?board=${shareCode}&role=${role}` : ''}
                </p>
                <button
                  onClick={copyLink}
                  className="w-full bg-slate-700 text-slate-300 py-2 rounded-lg hover:bg-slate-600 transition mb-4"
                >
                  Copy Link
                </button>
              </>
            )}

            <button
              onClick={() => { setShowShareModal(false); setShareCode(''); }}
              className="w-full border border-slate-700 text-slate-500 py-2 rounded-lg hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
