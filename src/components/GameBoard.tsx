'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameBoard } from '@/lib/contexts/GameBoardContext';

interface GameBoardProps {
  role: 'giver' | 'guesser';
}

type CardType = {
  word: string;
  color: 'white' | 'red' | 'blue' | 'beige' | 'black';
}

export default function GameBoard({ role }: GameBoardProps) {
  const { cards, setCards, notes, setNotes, resetBoard, shareBoard, boardId } = useGameBoard();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editColor, setEditColor] = useState<CardType['color']>('white');
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startTimer = () => {
    setTimeLeft(120);
    setTimerState('running');
  };
  const pauseTimer = () => setTimerState('paused');
  const resumeTimer = () => setTimerState('running');
  const cancelTimer = () => {
    setTimerState('idle');
    setTimeLeft(120);
  };
  const resetTimer = () => {
    setTimerState('idle');
    setTimeLeft(120);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleColorCycle = (index: number) => {
    setCards((currentCards: CardType[]) => {
      const newCards = [...currentCards];
      const colorCycle: CardType['color'][] = ['white', 'red', 'blue', 'beige', 'black'];
      const currentColorIndex = colorCycle.indexOf(newCards[index].color);
      const nextColorIndex = (currentColorIndex + 1) % colorCycle.length;
      newCards[index] = {
        ...newCards[index],
        color: colorCycle[nextColorIndex]
      };
      return newCards;
    });
  };

  const handleWordChange = (index: number, newWord: string) => {
    setCards((currentCards: CardType[]) => {
      const newCards = [...currentCards];
      newCards[index] = {
        ...newCards[index],
        word: newWord
      };
      return newCards;
    });
  };

  // Open card editor overlay
  const openCardEditor = (index: number) => {
    setSelectedCard(index);
    setEditWord(cards[index].word);
    setEditColor(cards[index].color);
  };

  // Save changes and close overlay
  const saveCardEdit = () => {
    if (selectedCard === null) return;
    setCards((currentCards: CardType[]) => {
      const newCards = [...currentCards];
      newCards[selectedCard] = {
        word: editWord,
        color: editColor,
      };
      return newCards;
    });
    setSelectedCard(null);
  };

  // Cancel edit (no save)
  const cancelEdit = () => {
    setSelectedCard(null);
  };

  const handleShare = async () => {
    try {
      await shareBoard();
      setShowShareModal(true);
    } catch (error) {
      console.error('Error sharing board:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 pt-4">
      <h2 className="text-xl font-semibold mb-4">You are the {role}</h2>
      <div className="grid grid-cols-5 gap-[2px] sm:gap-2 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => openCardEditor(index)}
            className={`
              aspect-square rounded-lg border-2 cursor-pointer
              flex items-center justify-center text-center
              p-1 sm:p-2
              ${card.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                card.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                card.color === 'black' ? 'bg-black hover:bg-gray-900' :
                card.color === 'beige' ? 'bg-amber-200 hover:bg-amber-300' :
                'bg-white hover:bg-gray-100'
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
            <span
              className={`w-full text-center font-medium select-none truncate leading-tight
                ${card.color === 'black' || card.color === 'blue' || card.color === 'red' ? 'text-white' : 'text-black'}
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

      {/* Overlay for editing card */}
      {selectedCard !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white w-11/12 max-w-sm rounded-xl p-6 shadow-lg relative flex flex-col gap-4">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={cancelEdit}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-2">Edit Card</h3>
            <label className="block mb-2 text-sm font-medium">Word</label>
            <input
              type="text"
              value={editWord}
              onChange={e => setEditWord(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:border-blue-500 text-black placeholder-black"
              maxLength={20}
              autoFocus
              placeholder="Word"
            />
            <label className="block mt-2 mb-1 text-sm font-medium">Color</label>
            <div className="flex gap-2 mb-2">
              {(['red', 'blue', 'beige', 'black'] as CardType['color'][]).map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-24 h-10 rounded-full border-2 flex items-center justify-center px-4
                    ${editColor === color ? 'ring-2 ring-blue-500' : ''}
                    ${color === 'red' ? 'bg-red-500' :
                      color === 'blue' ? 'bg-blue-500' :
                      color === 'black' ? 'bg-black' :
                      'bg-amber-200'}
                  `}
                  onClick={() => setEditColor(color)}
                  aria-label={color}
                >
                  {color === 'red' && <span className="text-black font-semibold">Red</span>}
                  {color === 'blue' && <span className="text-black font-semibold">Blue</span>}
                  {color === 'beige' && <span className="text-black font-semibold">Civilian</span>}
                  {color === 'black' && <span className="text-white font-semibold">Death</span>}
                  {editColor === color && <span className="absolute right-2 text-white text-lg">✓</span>}
                </button>
              ))}
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

      {/* Show notes textarea for both roles */}
      <div className="mt-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your clues and notes here..."
          className="w-full h-32 p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-black"
        />
      </div>

      {/* Countdown Timer UI */}
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
            <div className="text-3xl font-mono mb-2">{formatTime(timeLeft)}</div>
            <div className="flex gap-2">
              <button
                className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                onClick={pauseTimer}
              >Pause</button>
              <button
                className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
                onClick={cancelTimer}
              >Cancel</button>
            </div>
          </>
        )}
        {timerState === 'paused' && (
          <>
            <div className="text-3xl font-mono mb-2">{formatTime(timeLeft)}</div>
            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                onClick={resumeTimer}
              >Resume</button>
              <button
                className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400"
                onClick={cancelTimer}
              >Cancel</button>
            </div>
          </>
        )}
        {timerState === 'done' && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl font-bold text-red-600">Time&apos;s Up!</div>
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
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          New Game
        </button>
        <button
          onClick={handleShare}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Share Board
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-black">Share Board</h2>
            <p className="text-black mb-4 break-all">
              {`${window.location.origin}?board=${boardId}`}
            </p>
            <p className="text-black mb-6">Board URL has been copied to your clipboard!</p>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 