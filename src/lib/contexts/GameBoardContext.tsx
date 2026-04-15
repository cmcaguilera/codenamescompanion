'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase/firebase';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

export type CardType = {
  word: string;
  color: 'white' | 'red' | 'blue' | 'beige' | 'black';
  guessed?: boolean;
};

interface GameBoardContextType {
  cards: CardType[];
  setCards: Dispatch<SetStateAction<CardType[]>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  resetBoard: () => void;
  generateShareCode: () => Promise<string | null>;
  seedFromShareCode: (code: string) => Promise<boolean>;
  boardId: string | null;
}

const GameBoardContext = createContext<GameBoardContextType | undefined>(undefined);

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LOCAL_STORAGE_KEY = 'codenames_board_id';

function generateBoardId(): string {
  return Array.from({ length: 12 }, () => Math.random().toString(36)[2]).join('');
}

function generateShortCode(): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

const EMPTY_CARDS: CardType[] = Array(25).fill(null).map(() => ({ word: '', color: 'white' }));

export function GameBoardProvider({ children }: { children: ReactNode }) {
  const [cards, setCardsState] = useState<CardType[]>(EMPTY_CARDS);
  const [notes, setNotesState] = useState('');
  const [boardId, setBoardId] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // On mount: restore board from URL param or localStorage
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const boardParam = params.get('board');

        if (boardParam) {
          await loadBoardById(boardParam);
          return;
        }

        const savedId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedId) {
          await loadBoardById(savedId);
        }
      } catch (err) {
        console.error('Error restoring board on mount:', err);
      }
    };

    init();
  }, []);

  // Debounced auto-save whenever cards/notes change and boardId is set
  useEffect(() => {
    if (!boardId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveBoard(boardId, cards, notes);
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cards, notes, boardId]);

  async function loadBoardById(id: string) {
    if (!db) return;
    try {
      const snap = await getDoc(doc(db as Firestore, 'boards', id));
      if (snap.exists()) {
        const data = snap.data();
        setCardsState(data.cards || EMPTY_CARDS);
        setNotesState(data.notes || '');
        setBoardId(id);
        localStorage.setItem(LOCAL_STORAGE_KEY, id);
      }
    } catch (err) {
      console.error('Error loading board:', err);
    }
  }

  async function saveBoard(id: string, currentCards: CardType[], currentNotes: string) {
    if (!db) return;
    try {
      await setDoc(doc(db as Firestore, 'boards', id), {
        cards: currentCards,
        notes: currentNotes,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error('Error saving board:', err);
    }
  }

  // Wrapped setters: create boardId on first edit if one doesn't exist yet
  const setCards: Dispatch<SetStateAction<CardType[]>> = (value) => {
    setCardsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      ensureBoardId(next, notes);
      return next;
    });
  };

  const setNotes: Dispatch<SetStateAction<string>> = (value) => {
    setNotesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      ensureBoardId(cards, next);
      return next;
    });
  };

  // Creates a boardId on first edit and immediately saves to Firestore
  function ensureBoardId(currentCards: CardType[], currentNotes: string) {
    if (boardId) return;
    if (!db) return;

    const newId = generateBoardId();
    setBoardId(newId);
    localStorage.setItem(LOCAL_STORAGE_KEY, newId);

    setDoc(doc(db as Firestore, 'boards', newId), {
      cards: currentCards,
      notes: currentNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.error('Error creating board:', err));
  }

  const generateShareCode = async (): Promise<string | null> => {
    if (!db) {
      console.error('Firebase not initialized — check NEXT_PUBLIC_FIREBASE_* env vars');
      return null;
    }

    const code = generateShortCode();
    try {
      const writePromise = setDoc(doc(db as Firestore, 'boards', code), {
        cards,
        notes,
        isSnapshot: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore write timed out — check Firebase project setup')), 8000)
      );
      await Promise.race([writePromise, timeoutPromise]);
      return code;
    } catch (err) {
      console.error('Error generating share code:', err);
      return null;
    }
  };

  const seedFromShareCode = async (code: string): Promise<boolean> => {
    if (!db) return false;

    try {
      const snap = await getDoc(doc(db as Firestore, 'boards', code.toUpperCase().trim()));
      if (!snap.exists()) return false;

      const data = snap.data();
      setCardsState(data.cards || EMPTY_CARDS);
      setNotesState(data.notes || '');
      // Don't set boardId yet — will be created on first edit
      setBoardId(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return true;
    } catch (err) {
      console.error('Error seeding from share code:', err);
      return false;
    }
  };

  const resetBoard = () => {
    setCardsState(EMPTY_CARDS);
    setNotesState('');
    setBoardId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/');
  };

  return (
    <GameBoardContext.Provider
      value={{
        cards,
        setCards,
        notes,
        setNotes,
        resetBoard,
        generateShareCode,
        seedFromShareCode,
        boardId,
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
