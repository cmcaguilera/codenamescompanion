'use client'

interface RoleSelectorProps {
  onSelectRole: (role: 'giver' | 'guesser') => void;
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Select your role:</h2>
      <div className="flex gap-4">
        <button
          onClick={() => onSelectRole('giver')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Clue Giver
        </button>
        <button
          onClick={() => onSelectRole('guesser')}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Guesser
        </button>
      </div>
    </div>
  )
} 