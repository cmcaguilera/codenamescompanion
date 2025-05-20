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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">You are the {role}</h2>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleColorCycle(index)}
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
            <input
              type="text"
              value={card.word}
              onChange={(e) => handleWordChange(index, e.target.value)}
              className={`
                w-full text-center bg-transparent font-medium
                ${card.color === 'black' || card.color === 'blue' || card.color === 'red' ? 'text-white' : 'text-black'}
                focus:outline-none
              `}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type word..."
            />
          </div>
        ))}
      </div>
      
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