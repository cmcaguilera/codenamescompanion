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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-6 overflow-hidden relative">

        {/* Subtle dot-grid background — nods to the spy/grid theme */}
        <div
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center w-full max-w-xs">

          {/* Top color strip — the 5 squares of a key-card row */}
          <div className="flex gap-2 mb-8">
            {(['bg-red-600','bg-blue-600','bg-amber-200','bg-red-600','bg-blue-600'] as const).map((cls, i) => (
              <div key={i} className={`w-8 h-8 rounded-md ${cls} shadow-md`} />
            ))}
          </div>

          {/* Brand title */}
          <h1 className="text-5xl font-extrabold tracking-[0.1em] text-white uppercase leading-none text-center">
            Codenames
          </h1>

          {/* Red / blue split bar under the title */}
          <div className="flex w-full mt-3 rounded overflow-hidden h-[3px]">
            <div className="flex-1 bg-red-600" />
            <div className="flex-1 bg-blue-600" />
          </div>

          <p className="text-amber-400 font-bold tracking-[0.45em] uppercase text-sm mt-2 mb-10">
            Companion
          </p>

          {/* Section label */}
          <p className="text-slate-500 text-[11px] tracking-[0.3em] uppercase mb-4">
            — Choose your role —
          </p>

          {/* Role buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => handleRoleSelect('giver')}
              className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white rounded-xl py-4 px-6 transition-all duration-150 shadow-lg shadow-red-950/60 text-left"
            >
              <span className="block text-[10px] font-bold tracking-[0.35em] text-red-200 uppercase mb-0.5">
                Spymaster
              </span>
              <span className="text-lg font-extrabold tracking-wide">Clue Giver</span>
            </button>

            <button
              onClick={() => handleRoleSelect('guesser')}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white rounded-xl py-4 px-6 transition-all duration-150 shadow-lg shadow-blue-950/60 text-left"
            >
              <span className="block text-[10px] font-bold tracking-[0.35em] text-blue-200 uppercase mb-0.5">
                Field Agent
              </span>
              <span className="text-lg font-extrabold tracking-wide">Guesser</span>
            </button>
          </div>

          {/* Bottom color strip */}
          <div className="flex gap-2 mt-8">
            {(['bg-blue-600','bg-amber-200','bg-black','bg-red-600','bg-amber-200'] as const).map((cls, i) => (
              <div key={i} className={`w-8 h-8 rounded-md ${cls} shadow-md`} />
            ))}
          </div>

          {/* Creator credit */}
          <p className="text-slate-600 text-[11px] tracking-[0.2em] uppercase mt-8">
            Created by Connor Aguilera
          </p>
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
