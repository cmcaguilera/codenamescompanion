'use client';

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

type CardType = {
  word: string;
  color: 'white' | 'red' | 'blue' | 'beige' | 'black';
};

interface GameBoardContextType {
  cards: CardType[];
  setCards: Dispatch<SetStateAction<CardType[]>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  resetBoard: () => void;
  shareBoard: () => Promise<void>;
  boardId: string | null;
  loadBoardFromId: (id: string) => Promise<void>;
}

const GameBoardContext = createContext<GameBoardContextType | undefined>(undefined);

export function GameBoardProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<CardType[]>(Array(25).fill({ word: '', color: 'white' }));
  const [notes, setNotes] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load board from URL parameter on mount
  useEffect(() => {
    const boardParam = searchParams.get('board');
    if (boardParam) {
      loadBoardFromId(boardParam);
    }
  }, [searchParams]);

  const loadBoardFromId = async (id: string) => {
    if (!db) return; // Skip if Firebase is not initialized
    
    try {
      const boardDoc = await getDoc(doc(db as Firestore, 'boards', id));
      if (boardDoc.exists()) {
        const data = boardDoc.data();
        setCards(data.cards);
        setNotes(data.notes);
        setBoardId(id);
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  };

  // Save board changes to Firestore
  useEffect(() => {
    const saveBoard = async () => {
      if (!db || !boardId) return; // Skip if Firebase is not initialized or no boardId
      
      try {
        await setDoc(doc(db as Firestore, 'boards', boardId), {
          cards,
          notes,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving board:', error);
      }
    };
    saveBoard();
  }, [cards, notes, boardId]);

  const resetBoard = () => {
    setCards(Array(25).fill({ word: '', color: 'white' }));
    setNotes('');
    setBoardId(null);
    router.push('/');
  };

  const shareBoard = async () => {
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    try {
      // If no boardId exists, create a new one
      if (!boardId) {
        const newBoardId = Math.random().toString(36).substring(2, 15);
        await setDoc(doc(db as Firestore, 'boards', newBoardId), {
          cards,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setBoardId(newBoardId);
      }

      // Create the share URL
      const shareUrl = `${window.location.origin}?board=${boardId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Update URL without reloading
      router.push(`?board=${boardId}`, { scroll: false });
      
      // Show success message
      alert('Board URL copied to clipboard!');
    } catch (error) {
      console.error('Error sharing board:', error);
      alert('Failed to share board. Please try again.');
    }
  };

  return (
    <GameBoardContext.Provider
      value={{
        cards,
        setCards,
        notes,
        setNotes,
        resetBoard,
        shareBoard,
        boardId,
        loadBoardFromId,
      }}
    >
      {children}
    </GameBoardContext.Provider>
  );
}

export function useGameBoard() {
  const context = useContext(GameBoardContext);
  if (context === undefined) {
    throw new Error('useGameBoard must be used within a GameBoardProvider');
  }
  return context;
} 