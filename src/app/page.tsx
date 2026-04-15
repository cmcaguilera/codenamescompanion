'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GameBoard from '@/components/GameBoard'
import { GameBoardProvider } from '@/lib/contexts/GameBoardContext'
import JoinScreen from '@/components/JoinScreen'

type Step = 'role' | 'join' | 'game'

export default function Home() {
  const [step, setStep] = useState<Step>('role')
  const [role, setRole] = useState<'giver' | 'guesser' | null>(null)
  const router = useRouter()

  // If URL has a ?board= param, skip straight to game
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('board') && params.get('role')) {
      const roleParam = params.get('role')
      if (roleParam === 'giver' || roleParam === 'guesser') {
        setRole(roleParam)
        setStep('game')
      }
    }
  }, [])

  const handleRoleSelect = (selectedRole: 'giver' | 'guesser') => {
    setRole(selectedRole)
    setStep('join')
  }

  const handleStartFresh = () => {
    setStep('game')
  }

  const handleJoined = () => {
    setStep('game')
  }

  const handleBack = () => {
    setRole(null)
    setStep('role')
  }

  if (step === 'role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-black">Select Your Role</h1>
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect('giver')}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              I am the Giver
            </button>
            <button
              onClick={() => handleRoleSelect('guesser')}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              I am the Guesser
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'join' && role) {
    return (
      <GameBoardProvider>
        <JoinScreen
          role={role}
          onStartFresh={handleStartFresh}
          onJoined={handleJoined}
          onBack={handleBack}
        />
      </GameBoardProvider>
    )
  }

  return (
    <GameBoardProvider>
      <GameBoard role={role!} />
    </GameBoardProvider>
  )
}
