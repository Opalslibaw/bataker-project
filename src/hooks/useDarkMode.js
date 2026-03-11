/**
 * useDarkMode.js — Enhanced dark/light mode
 * - Persists to localStorage
 * - Applies CSS variables ke :root untuk perubahan drastis di seluruh app
 * - Light mode: warm parchment/cream, gold accents
 * - Dark mode: deep black luxury (default)
 */
import { useEffect, useState } from 'react'

const DARK_VARS = {
  '--bg-base':        '#080503',
  '--bg-card':        'rgba(0,0,0,0.6)',
  '--bg-card-hover':  'rgba(0,0,0,0.75)',
  '--bg-header':      'rgba(0,0,0,0.82)',
  '--bg-overlay':     'rgba(0,0,0,0.52)',
  '--text-primary':   '#ffffff',
  '--text-secondary': 'rgba(255,255,255,0.65)',
  '--text-muted':     'rgba(255,255,255,0.3)',
  '--gold':           '#F1C40F',
  '--gold-dim':       'rgba(241,196,15,0.45)',
  '--gold-border':    'rgba(241,196,15,0.18)',
  '--gold-glow':      'rgba(241,196,15,0.3)',
  '--accent-red':     '#e74c3c',
  '--accent-purple':  '#8e44ad',
  '--orb-1':          'rgba(192,57,43,0.18)',
  '--orb-2':          'rgba(142,68,173,0.14)',
  '--orb-3':          'rgba(241,196,15,0.06)',
  '--border-subtle':  'rgba(241,196,15,0.1)',
  '--shadow-card':    '0 0 70px rgba(0,0,0,0.75)',
  '--scrollbar-bg':   'rgba(0,0,0,0.2)',
  '--scrollbar-thumb':'rgba(241,196,15,0.2)',
}

const LIGHT_VARS = {
  '--bg-base':        '#f5efe0',
  '--bg-card':        'rgba(255,248,230,0.92)',
  '--bg-card-hover':  'rgba(255,248,230,1)',
  '--bg-header':      'rgba(245,235,200,0.96)',
  '--bg-overlay':     'rgba(255,248,230,0.88)',
  '--text-primary':   '#1a0f00',
  '--text-secondary': 'rgba(30,15,0,0.7)',
  '--text-muted':     'rgba(30,15,0,0.4)',
  '--gold':           '#b8860b',
  '--gold-dim':       'rgba(184,134,11,0.55)',
  '--gold-border':    'rgba(184,134,11,0.3)',
  '--gold-glow':      'rgba(184,134,11,0.25)',
  '--accent-red':     '#c0392b',
  '--accent-purple':  '#7d3c98',
  '--orb-1':          'rgba(192,57,43,0.08)',
  '--orb-2':          'rgba(142,68,173,0.06)',
  '--orb-3':          'rgba(184,134,11,0.1)',
  '--border-subtle':  'rgba(184,134,11,0.2)',
  '--shadow-card':    '0 4px 40px rgba(100,60,0,0.15)',
  '--scrollbar-bg':   'rgba(184,134,11,0.08)',
  '--scrollbar-thumb':'rgba(184,134,11,0.25)',
}

function applyVars(vars) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('kartu-batak-theme')
      if (saved !== null) return saved === 'dark'
    } catch {}
    return true // default dark
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
      applyVars(DARK_VARS)
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      applyVars(LIGHT_VARS)
    }
    try { localStorage.setItem('kartu-batak-theme', isDark ? 'dark' : 'light') } catch {}
  }, [isDark])

  const toggleDarkMode = () => setIsDark(prev => !prev)

  return { isDark, toggleDarkMode }
}
