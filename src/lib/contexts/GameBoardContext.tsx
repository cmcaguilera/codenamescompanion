'use client';

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
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

  // Load board from URL parameter on mount
  useEffect(() => {
    const loadBoardFromUrl = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const boardParam = params.get('board');
        if (boardParam) {
          console.log('Loading board from URL:', boardParam);
          await loadBoardFromId(boardParam);
        }
      } catch (error) {
        console.error('Error loading board from URL:', error);
      }
    };
    loadBoardFromUrl();
  }, []);

  const loadBoardFromId = async (id: string) => {
    if (!db) {
      console.error('Firebase is not initialized - db is null');
      return;
    }
    
    try {
      console.log('Fetching board data for ID:', id);
      const boardDoc = await getDoc(doc(db as Firestore, 'boards', id));
      if (boardDoc.exists()) {
        const data = boardDoc.data();
        console.log('Board data loaded:', data);
        setCards(data.cards || Array(25).fill({ word: '', color: 'white' }));
        setNotes(data.notes || '');
        setBoardId(id);
        console.log('Board loaded successfully:', id);
      } else {
        console.error('Board not found:', id);
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }
  };

  // Save board changes to Firestore
  useEffect(() => {
    const saveBoard = async () => {
      if (!db || !boardId) return;
      
      try {
        console.log('Saving board changes:', { boardId, cards, notes });
        await setDoc(doc(db as Firestore, 'boards', boardId), {
          cards,
          notes,
          updatedAt: new Date().toISOString(),
        });
        console.log('Board saved successfully:', boardId);
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
    
    // Clear the URL parameters and redirect to home
    router.push('/');
  };

  const shareBoard = async () => {
    console.log('shareBoard function called');
    if (!db) {
      console.error('Firebase is not initialized - db is null');
      return;
    }

    try {
      let currentBoardId = boardId;
      console.log('Current boardId:', currentBoardId);

      // If no boardId exists, create a new one
      if (!currentBoardId) {
        currentBoardId = Math.random().toString(36).substring(2, 15);
        console.log('Created new boardId:', currentBoardId);
        await setDoc(doc(db as Firestore, 'boards', currentBoardId), {
          cards,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setBoardId(currentBoardId);
        console.log('New board saved to Firebase');
      }

      // Get the current role from URL
      const params = new URLSearchParams(window.location.search);
      const currentRole = params.get('role') || 'giver';

      // Create the share URL with both board ID and role
      const shareUrl = `${window.location.origin}?board=${currentBoardId}&role=${currentRole}`;
      console.log('Share URL created:', shareUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      console.log('URL copied to clipboard');
      
      // Update URL without reloading
      router.push(`?board=${currentBoardId}&role=${currentRole}`, { scroll: false });
      console.log('URL updated in browser');
      
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