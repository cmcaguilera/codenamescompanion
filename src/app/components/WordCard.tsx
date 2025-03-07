interface WordCardProps {
  word: string
  color: 'red' | 'blue' | 'beige' | 'black'
  onWordChange: (word: string) => void
  onColorChange: () => void
  isEditable: boolean
}

export default function WordCard({
  word,
  color,
  onWordChange,
  onColorChange,
  isEditable,
}: WordCardProps) {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    beige: 'bg-amber-100',
    black: 'bg-gray-800',
  }

  return (
    <div
      className={`aspect-square p-1 rounded-lg cursor-pointer transition-colors ${
        colorClasses[color]
      }`}
      onClick={() => !isEditable && onColorChange()}
    >
      <input
        type="text"
        value={word}
        onChange={(e) => onWordChange(e.target.value)}
        disabled={!isEditable}
        className={`w-full h-full bg-transparent text-center outline-none text-sm sm:text-base font-medium ${
          color === 'black' ? 'text-white' : 'text-black'
        } ${isEditable ? 'cursor-text' : 'cursor-pointer'}`}
        placeholder={isEditable ? 'Enter word...' : ''}
      />
    </div>
  )
} 