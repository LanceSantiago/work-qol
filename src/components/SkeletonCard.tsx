interface Props {
  lines?: number
}

export default function SkeletonCard({ lines = 2 }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 ${i === 0 ? 'w-full' : 'w-3/4'}`}
        />
      ))}
    </div>
  )
}
