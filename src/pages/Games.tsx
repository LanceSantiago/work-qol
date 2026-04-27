import { useState, useRef } from 'react'
import type { Game } from '../types/games'

const games: Game[] = [
  {
    id: 'saboteur',
    name: 'Saboteur',
    description:
      'A card-based hidden role game where miners try to dig a tunnel to gold while saboteurs secretly work to block their path.',
    imageUrl: '/saboteur.png',
    link: 'https://boardgamearena.com/gamepanel?game=saboteur',
  },
  {
    id: 'secret-hitler',
    name: 'Secret Hitler',
    description:
      "A social deduction game where liberals try to stop fascists from enacting policies — and finding Secret Hitler before it's too late.",
    imageUrl: '/secret-hitler.png',
    link: 'https://secret-hitler.online/',
  },
  {
    id: 'pico-park-2',
    name: 'Pico Park 2',
    description:
      'A cooperative puzzle-platformer where the whole team must work together to solve clever, chaotic challenges across hundreds of levels.',
    imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2644470/header.jpg',
    link: 'https://store.steampowered.com/app/2644470/PICO_PARK_2/',
    platform: 'steam',
  },
  {
    id: 'jackbox',
    name: 'Jackbox',
    description:
      'A collection of party games played from your phone — trivia, drawing, bluffing, and more. No controllers needed.',
    imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/331670/header.jpg',
    link: 'https://jackbox.tv/',
    platform: 'steam',
  },
  {
    id: 'starcraft-2',
    name: 'Starcraft 2',
    description:
      'A classic real-time strategy game where three alien races battle for galactic dominance across intense multiplayer matches.',
    imageUrl: '/starcraft-2.png',
    link: 'https://starcraft2.blizzard.com/en-us/',
  },
  {
    id: 'crusader-kings-3',
    name: 'Crusader Kings III',
    description:
      'A medieval dynasty simulator where you manage your royal bloodline, forge alliances, wage wars, and scheme your way to power.',
    imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1158310/header.jpg',
    link: 'https://store.steampowered.com/app/1158310/Crusader_Kings_III/',
    platform: 'steam',
  },
  {
    id: 'krunker',
    name: 'Krunker',
    description:
      'A fast-paced browser-based first-person shooter with a blocky art style, multiple classes, and no download required.',
    imageUrl: '/krunker.png',
    link: 'https://krunker.io/',
  },
  {
    id: 'among-us',
    name: 'Among Us',
    description:
      'A social deduction game where crewmates complete tasks on a spaceship while impostors secretly sabotage and eliminate them one by one.',
    imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/945360/header.jpg',
    link: 'https://apps.apple.com/us/app/among-us/id1351168404',
    platform: 'appstore',
  },
]

const SteamBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#1b2838] text-[#c7d5e0]">
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.662 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z" />
    </svg>
    Available on Steam
  </span>
)

const AppStoreBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-black text-white">
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
    Available on App Store
  </span>
)

function PlatformBadge({ platform }: { platform?: Game['platform'] }) {
  if (platform === 'steam') return <SteamBadge />
  if (platform === 'appstore') return <AppStoreBadge />
  return null
}

const ROLL_DURATION = 1200
const ROLL_INTERVAL = 80

export default function Games() {
  const [picked, setPicked] = useState<Game | null>(null)
  const [rolling, setRolling] = useState(false)
  const [displayGame, setDisplayGame] = useState<Game | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function pickRandom() {
    if (rolling) return
    setRolling(true)

    const final = games[Math.floor(Math.random() * games.length)]
    let ticks = 0
    const totalTicks = ROLL_DURATION / ROLL_INTERVAL

    intervalRef.current = setInterval(() => {
      ticks++
      const randomGame = games[Math.floor(Math.random() * games.length)]
      setDisplayGame(randomGame)

      if (ticks >= totalTicks) {
        clearInterval(intervalRef.current!)
        setDisplayGame(final)
        setPicked(final)
        setRolling(false)
      }
    }, ROLL_INTERVAL)
  }

  const shown = displayGame

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Games</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        A collection of games we&apos;ve played together as a team.
      </p>

      {/* Randomizer */}
      <div className="mb-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Game Randomizer</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Can&apos;t decide? Let fate choose.
            </p>
          </div>
          <button
            onClick={pickRandom}
            disabled={rolling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <svg
              className={`w-4 h-4 ${rolling ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 12c0-4.142-3.358-7.5-7.5-7.5S4.5 7.858 4.5 12s3.358 7.5 7.5 7.5"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25 19.5 12l-3 3.75" />
            </svg>
            {rolling ? 'Rolling...' : picked ? 'Roll Again' : 'Pick a Game'}
          </button>
        </div>

        {shown ? (
          <a
            href={shown.link}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'flex items-center gap-4 rounded-lg border p-4 transition-all',
              rolling
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 pointer-events-none'
                : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:shadow-sm cursor-pointer',
            ].join(' ')}
          >
            <img
              src={shown.imageUrl}
              alt={shown.name}
              className="w-24 h-16 object-cover rounded-md shrink-0"
            />
            <div className="flex flex-col gap-1 min-w-0">
              <span
                className={[
                  'font-semibold text-lg transition-all duration-75',
                  rolling
                    ? 'blur-[1px] text-gray-400 dark:text-gray-600'
                    : 'text-gray-900 dark:text-gray-100',
                ].join(' ')}
              >
                {shown.name}
              </span>
              <PlatformBadge platform={shown.platform} />
              {!rolling && (
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Click to play →
                </span>
              )}
            </div>
          </a>
        ) : (
          <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 text-sm">
            Hit the button to pick a random game
          </div>
        )}
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <a
            key={game.id}
            href={game.link}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'group flex flex-col rounded-xl border overflow-hidden hover:shadow-md transition-all',
              picked && !rolling && picked.id === game.id
                ? 'border-green-400 dark:border-green-600 bg-white dark:bg-gray-900 ring-2 ring-green-300 dark:ring-green-700'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700',
            ].join(' ')}
          >
            <div className="w-full h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img
                src={game.imageUrl}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {game.name}
              </h3>
              <PlatformBadge platform={game.platform} />
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {game.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
