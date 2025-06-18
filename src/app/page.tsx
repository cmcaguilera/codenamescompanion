'use client'  // Add this since we're using useState

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GameBoard from '@/components/GameBoard'
import { GameBoardProvider } from '@/lib/contexts/GameBoardContext'

export default function Home() {
  const [role, setRole] = useState<'giver' | 'guesser' | null>(null)
  const router = useRouter()

  // Load role from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const roleParam = params.get('role')
    
    // Only set role from URL if it's a valid role
    if (roleParam === 'giver' || roleParam === 'guesser') {
      setRole(roleParam)
    }
  }, [])

  const handleRoleSelect = (selectedRole: 'giver' | 'guesser') => {
    setRole(selectedRole)
    
    // Update URL with role parameter
    const params = new URLSearchParams(window.location.search)
    params.set('role', selectedRole)
    router.push(`?${params.toString()}`, { scroll: false })
    
    console.log('Role selected:', selectedRole)
  }

  if (role === null) {
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

  return (
    <GameBoardProvider>
      <GameBoard role={role} />
    </GameBoardProvider>
  )
}
