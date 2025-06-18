'use client'  // Add this since we're using useState

import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import RoleSelector from '@/components/RoleSelector'
import GameBoard from '@/components/GameBoard'
import { GameBoardProvider } from '@/lib/contexts/GameBoardContext'
import { useGameBoard } from '@/lib/contexts/GameBoardContext'

function GameBoardWithParams({ role }: { role: 'giver' | 'guesser' }) {
  const searchParams = useSearchParams()
  const { loadBoardFromId } = useGameBoard()
  const boardId = searchParams.get('board')

  useEffect(() => {
    if (boardId) {
      loadBoardFromId(boardId)
    }
  }, [boardId, loadBoardFromId])

  return <GameBoard role={role} />
}

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<'giver' | 'guesser' | null>(null)

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Codenames Companion</h1>
      
      {!selectedRole ? (
        <RoleSelector onSelectRole={setSelectedRole} />
      ) : (
        <GameBoardProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <GameBoardWithParams role={selectedRole} />
          </Suspense>
        </GameBoardProvider>
      )}
    </main>
  )
}
