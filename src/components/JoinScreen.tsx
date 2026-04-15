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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-1 text-center text-black">
          You are the {role === 'giver' ? 'Giver' : 'Guesser'}
        </h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Start a new game or join an existing board</p>

        <button
          onClick={onStartFresh}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition mb-6"
        >
          Start New Game
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-400">or join a game</span>
          </div>
        </div>

        <div className="space-y-3">
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
            className="w-full p-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 text-black placeholder-gray-400 text-center text-lg tracking-widest font-mono uppercase"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={handleJoin}
            disabled={!code.trim() || loading}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Join Board'}
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-6 w-full text-gray-400 hover:text-gray-600 text-sm transition"
        >
          ← Back to role selection
        </button>
      </div>
    </div>
  )
}
