import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev)
  }

  return { isDark, toggleDarkMode }
}

