'use client'  // Add this since we're using useState

import { useState } from 'react'
import RoleSelector from '@/components/RoleSelector'
import GameBoard from '@/components/GameBoard'

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<'giver' | 'guesser' | null>(null)

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Codenames Companion</h1>
      
      {!selectedRole ? (
        <RoleSelector onSelectRole={setSelectedRole} />
      ) : (
        <GameBoard role={selectedRole} />
      )}
    </main>
  )
}
