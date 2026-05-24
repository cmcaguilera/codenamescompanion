'use client'

import { useState } from 'react'
import { useGameBoard } from '@/lib/contexts/GameBoardContext'

interface JoinScreenProps {
  role: 'giver' | 'guesser'
  onStartFresh: () => void
  onJoined: () => void
  onBack: () => void
}

export default function JoinScreen({ role, onStartFresh, onJoined, onBack }: JoinScreenProps) {
  const { seedFromShareCode } = useGameBoard()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const found = await seedFromShareCode(code.trim())
    setLoading(false)
    if (found) {
      onJoined()
    } else {
      setError('Board not found. Check the code and try again.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleJoin()
  }

  const isGiver = role === 'giver'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-6 overflow-hidden relative">

      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">

        {/* Role badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-sm ${isGiver ? 'bg-red-600' : 'bg-blue-600'}`} />
          <span className={`text-xs font-bold tracking-[0.3em] uppercase ${isGiver ? 'text-red-400' : 'text-blue-400'}`}>
            {isGiver ? 'Spymaster' : 'Field Agent'}
          </span>
          <div className={`w-3 h-3 rounded-sm ${isGiver ? 'bg-red-600' : 'bg-blue-600'}`} />
        </div>

        <h1 className="text-3xl font-extrabold text-white uppercase tracking-wide text-center mb-1">
          {isGiver ? 'Clue Giver' : 'Guesser'}
        </h1>

        {/* Team-color divider */}
        <div className={`w-full h-[3px] rounded mt-2 mb-2 ${isGiver ? 'bg-red-600' : 'bg-blue-600'}`} />

        <p className="text-slate-500 text-xs tracking-[0.15em] uppercase mb-8 text-center">
          Start a new game or join an existing board
        </p>

        {/* Start New Game */}
        <button
          onClick={onStartFresh}
          className={`w-full text-white py-4 px-6 rounded-xl font-extrabold text-lg tracking-wide transition-all duration-150 active:scale-[0.97] shadow-lg mb-6 text-left ${
            isGiver
              ? 'bg-red-600 hover:bg-red-500 shadow-red-950/60'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/60'
          }`}
        >
          <span className="block text-[10px] font-bold tracking-[0.35em] opacity-60 uppercase mb-0.5">New session</span>
          Start New Game
        </button>

        {/* OR divider */}
        <div className="relative w-full mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-3 text-slate-500 text-xs tracking-widest uppercase">or join a game</span>
          </div>
        </div>

        {/* Code input + join */}
        <div className="space-y-3 w-full">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter board code (e.g. AB3X9K)"
            maxLength={6}
            className="w-full p-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-slate-600 text-center text-lg tracking-[0.4em] font-mono uppercase bg-slate-800"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={!code.trim() || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold tracking-wide hover:bg-blue-500 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Join Board'}
          </button>
        </div>

        {/* Back */}
        <button
          onClick={onBack}
          className="mt-8 text-slate-600 hover:text-slate-400 text-xs tracking-widest uppercase transition"
        >
          ← Back to role selection
        </button>

      </div>
    </div>
  )
}
