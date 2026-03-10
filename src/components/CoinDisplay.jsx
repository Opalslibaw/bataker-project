// src/components/CoinDisplay.jsx
// Coin badge untuk navbar — selalu visible saat login
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'

const coinStyles = `
  @keyframes cd-spin {
    0%   { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
  }
  @keyframes cd-glow-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(241,196,15,0.4), 0 0 16px rgba(241,196,15,0.15); }
    50%       { box-shadow: 0 0 16px rgba(241,196,15,0.75), 0 0 32px rgba(241,196,15,0.3); }
  }
  @keyframes cd-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    70%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  .cd-coin-spin { animation: cd-spin 0.6s ease-in-out; }
  .cd-pop       { animation: cd-pop 0.4s ease-out; }
`

/* SVG coin icon */
const CoinIcon = ({ size = 16, spinning = false }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none"
    className={spinning ? 'cd-coin-spin' : ''}
    style={{ display: 'block', flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" stroke="rgba(241,196,15,0.6)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(241,196,15,0.3)" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="rgba(120,80,0,0.9)" fontFamily="serif">₿</text>
    <defs>
      <radialGradient id="coinGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE566"/>
        <stop offset="50%" stopColor="#F1C40F"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </radialGradient>
    </defs>
  </svg>
)

export function CoinDisplay({ compact = false }) {
  const { profile } = useAuth()
  const [spinning, setSpinning] = useState(false)

  const coins = profile?.coins ?? 0

  const handleClick = () => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 650)
  }

  if (!profile) return null

  if (compact) {
    // Versi kecil untuk mobile navbar
    return (
      <>
        <style>{coinStyles}</style>
        <motion.div
          onClick={handleClick}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 cursor-pointer"
          style={{
            background: 'rgba(241,196,15,0.1)',
            border: '1px solid rgba(241,196,15,0.3)',
            animation: 'cd-glow-pulse 3s ease-in-out infinite',
          }}
        >
          <CoinIcon size={14} spinning={spinning} />
          <span className="text-xs font-bold" style={{ color: '#F1C40F', fontVariantNumeric: 'tabular-nums' }}>
            {coins.toLocaleString()}
          </span>
        </motion.div>
      </>
    )
  }

  return (
    <>
      <style>{coinStyles}</style>
      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className="relative flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer select-none"
        style={{
          background: 'linear-gradient(135deg,rgba(241,196,15,0.12),rgba(184,134,11,0.08))',
          border: '1px solid rgba(241,196,15,0.35)',
          animation: 'cd-glow-pulse 3s ease-in-out infinite',
        }}
      >
        {/* Shimmer top line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-full"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.6),transparent)' }} />

        <CoinIcon size={16} spinning={spinning} />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={coins}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-bold"
            style={{ color: '#F1C40F', fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}
          >
            {coins.toLocaleString()}
          </motion.span>
        </AnimatePresence>

        <span className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(241,196,15,0.55)' }}>
          koin
        </span>
      </motion.div>
    </>
  )
}
