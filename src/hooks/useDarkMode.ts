import { useState, useEffect } from 'react'

/**
 * Manages the dark mode preference, persisting it to localStorage and
 * syncing the `dark` class on the document root element.
 * Returns the current dark mode state and a toggle function.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('darkMode', String(isDark))
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return { isDark, toggle }
}
