'use client'

import { useState } from 'react';

interface GameBoardProps {
  role: 'giver' | 'guesser';
}

type CardType = {
  word: string;
  color: 'white' | 'red' | 'blue' | 'beige' | 'black';
}

export default function GameBoard({ role }: GameBoardProps) {
  // Initialize 25 empty cards
  const [cards, setCards] = useState<CardType[]>(
    Array(25).fill({ word: '', color: 'white' })
  );
  const [notes, setNotes] = useState('');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editColor, setEditColor] = useState<CardType['color']>('white');

  const handleColorCycle = (index: number) => {
    setCards(currentCards => {
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
    setCards(currentCards => {
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
    setCards(currentCards => {
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">You are the {role}</h2>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => openCardEditor(index)}
            className={`
              aspect-[4/3] p-2 rounded-lg border-2 cursor-pointer
              flex items-center justify-center text-center
              ${card.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                card.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                card.color === 'black' ? 'bg-black hover:bg-gray-900' :
                card.color === 'beige' ? 'bg-amber-200 hover:bg-amber-300' :
                'bg-white hover:bg-gray-100'
              }
              transition-colors duration-200
            `}
          >
            <span
              className={`w-full text-center font-medium select-none
                ${card.color === 'black' || card.color === 'blue' || card.color === 'red' ? 'text-white' : 'text-black'}
              `}
              style={{ pointerEvents: 'none' }}
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

      {role === 'giver' && (
        <div className="mt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your clues and notes here..."
            className="w-full h-32 p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-black"
          />
        </div>
      )}
    </div>
  )
} 