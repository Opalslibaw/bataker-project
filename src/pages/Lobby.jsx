import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMultiplayer } from '../hooks/useMultiplayer.js'
import { useCoins } from '../hooks/useCoins.js'

// ── SVG Icons
const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconKey = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IconBot = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="17"/><line x1="16" y1="15" x2="16" y2="17"/>
  </svg>
)
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IconSpin = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IconCoin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#lobbyGrad)" stroke="rgba(241,196,15,0.5)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(241,196,15,0.2)" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="rgba(100,65,0,0.9)" fontFamily="serif">₿</text>
    <defs>
      <radialGradient id="lobbyGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE566"/>
        <stop offset="50%" stopColor="#F1C40F"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </radialGradient>
    </defs>
  </svg>
)
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 01-2-2V5h4"/>
    <path d="M18 9h2a2 2 0 002-2V5h-4"/>
    <path d="M12 17c-2.8 0-5-2.2-5-5V5h10v7c0 2.8-2.2 5-5 5z"/>
    <path d="M12 17v3M8 21h8"/>
  </svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconFlame = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
  </svg>
)

const lobbyStyles = `
  @keyframes lb-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lb-pulse-dot {
    0%, 100% { box-shadow: 0 0 4px #4ade80; }
    50%       { box-shadow: 0 0 14px #4ade80; }
  }
  @keyframes lb-coin-float {
    0%, 100% { transform: translateY(0px) rotate(-8deg); }
    50%       { transform: translateY(-6px) rotate(8deg); }
  }
  @keyframes lb-glow-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(241,196,15,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(241,196,15,0); }
  }
  .lb-bet-selected {
    animation: lb-glow-ring 1.8s ease-in-out infinite;
  }
`

/* Bet tiers dengan flavor text */
const BET_TIERS = [
  { amount: 0,   label: 'Gratis',  sub: 'Tanpa risiko',      color: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.04)', icon: <IconShield /> },
  { amount: 50,  label: '50',      sub: 'Pemula',            color: '#4ade80',               border: 'rgba(74,222,128,0.35)', bg: 'rgba(74,222,128,0.06)',  icon: <IconFlame /> },
  { amount: 100, label: '100',     sub: 'Standar',           color: '#F1C40F',               border: 'rgba(241,196,15,0.4)', bg: 'rgba(241,196,15,0.07)',  icon: <IconFlame /> },
  { amount: 250, label: '250',     sub: 'Berani',            color: '#f97316',               border: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.07)',  icon: <IconFlame /> },
  { amount: 500, label: '500',     sub: 'All-in',            color: '#e74c3c',               border: 'rgba(231,76,60,0.45)', bg: 'rgba(231,76,60,0.08)',   icon: <IconTrophy /> },
]

export function LobbyPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { createRoom, joinRoom, loading } = useMultiplayer()
  const { placeBet } = useCoins()

  const [mode, setMode]           = useState(null)
  const [joinCode, setJoinCode]   = useState('')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [betAmount, setBetAmount] = useState(0)
  const [formError, setFormError] = useState('')
  const [betError, setBetError]   = useState('')

  const username = profile?.username || user?.email?.split('@')[0] || 'Pemain'
  const coins    = profile?.coins ?? 0

  const handleBetSelect = (amount) => {
    setBetError('')
    if (amount > coins) {
      setBetError(`Saldo tidak cukup. Kamu punya ${coins.toLocaleString()} koin.`)
      return
    }
    setBetAmount(amount)
  }

  const handleCreate = async () => {
    setFormError(''); setBetError('')
    if (!user?.id) { setFormError('Sesi belum siap, coba lagi.'); return }
    if (betAmount > coins) { setFormError('Saldo koin tidak cukup untuk taruhan ini.'); return }

    const result = await createRoom({ userId: user.id, username, maxPlayers })
    if (!result.ok) { setFormError(result.message); return }

    // Pasang taruhan jika ada
    if (betAmount > 0) {
      await placeBet(result.room.id, betAmount)
    }

    navigate('/multiplayer', {
      state: { room: result.room, isHost: true, betAmount }
    })
  }

  const handleJoin = async () => {
    setFormError(''); setBetError('')
    if (!user?.id) { setFormError('Sesi belum siap, coba lagi.'); return }
    if (joinCode.length < 6) { setFormError('Masukkan kode room 6 karakter.'); return }

    const result = await joinRoom({ code: joinCode, userId: user.id, username })
    if (!result.ok) { setFormError(result.message); return }

    // Ikut taruhan room jika ada
    if (betAmount > 0) {
      if (betAmount > coins) { setFormError('Saldo koin tidak cukup untuk ikut taruhan.'); return }
      await placeBet(result.room.id, betAmount)
    }

    navigate('/multiplayer', {
      state: { room: result.room, isHost: false, betAmount }
    })
  }

  const MODES = [
    {
      key: 'create',
      icon: <IconPlus />,
      title: 'Buat Room',
      desc: 'Buat room baru, dapat kode unik, dan undang teman.',
      accentColor: '#8e44ad',
      accentRgb: '142,68,173',
      activeBg: 'linear-gradient(135deg,#1e0a3d,#3d1463,#5b1fa0)',
      activeBorder: 'rgba(142,68,173,0.7)',
      idleBorder: 'rgba(142,68,173,0.18)',
    },
    {
      key: 'join',
      icon: <IconKey />,
      title: 'Join Room',
      desc: 'Masukkan kode 6 karakter dari teman untuk bergabung.',
      accentColor: '#e74c3c',
      accentRgb: '192,57,43',
      activeBg: 'linear-gradient(135deg,#3d0a0a,#7b1010,#a93226)',
      activeBorder: 'rgba(192,57,43,0.7)',
      idleBorder: 'rgba(192,57,43,0.18)',
    },
  ]

  const selectedTier = BET_TIERS.find(t => t.amount === betAmount) || BET_TIERS[0]
  const potEstimate  = betAmount > 0 ? `~${(betAmount * maxPlayers).toLocaleString()}` : '0'

  return (
    <section className="relative space-y-7">
      <style>{lobbyStyles}</style>

      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 55% 45% at 5% 5%,rgba(142,68,173,0.14) 0%,transparent 55%), radial-gradient(ellipse 45% 45% at 95% 95%,rgba(192,57,43,0.12) 0%,transparent 55%), radial-gradient(ellipse 40% 30% at 50% 50%,rgba(241,196,15,0.03) 0%,transparent 70%)',
        }} />
      </div>

      {/* ── HEADER */}
      <motion.header initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-px w-5" style={{ background: 'rgba(241,196,15,0.45)' }} />
          <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.5)' }}>Multiplayer</p>
        </div>
        <h1 className="font-perpetua text-4xl md:text-5xl"
          style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.5), 0 0 60px rgba(241,196,15,0.15)' }}>
          Lobby
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Buat room baru atau masuk dengan kode dari teman.
        </p>
      </motion.header>

      {/* ── COIN BALANCE BANNER */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="relative overflow-hidden rounded-2xl px-5 py-3.5"
        style={{ background: 'linear-gradient(135deg,rgba(241,196,15,0.08),rgba(184,134,11,0.05))', border: '1px solid rgba(241,196,15,0.2)' }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.5),transparent)' }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'rgba(241,196,15,0.12)', border: '1px solid rgba(241,196,15,0.25)' }}>
              <IconCoin />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(241,196,15,0.5)' }}>Saldo Koinmu</p>
              <p className="font-perpetua text-xl font-bold" style={{ color: '#F1C40F' }}>
                {coins.toLocaleString()} <span className="text-sm font-normal" style={{ color: 'rgba(241,196,15,0.55)' }}>koin</span>
              </p>
            </div>
          </div>
          {betAmount > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="text-right">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(241,196,15,0.5)' }}>Taruhanmu</p>
              <p className="font-perpetua text-lg font-bold" style={{ color: selectedTier.color }}>
                {betAmount.toLocaleString()} koin
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── MODE CARDS */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid gap-4 sm:grid-cols-2">
        {MODES.map((item, i) => {
          const isActive = mode === item.key
          return (
            <motion.button key={item.key} type="button"
              onClick={() => { setMode(mode === item.key ? null : item.key); setFormError('') }}
              whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08 }}
              className="relative overflow-hidden rounded-2xl p-6 text-left"
              style={{
                background: isActive ? item.activeBg : 'rgba(0,0,0,0.5)',
                border: `1px solid ${isActive ? item.activeBorder : item.idleBorder}`,
                boxShadow: isActive ? `0 0 40px rgba(${item.accentRgb},0.35)` : 'none',
                cursor: 'pointer', transition: 'all 0.25s ease',
              }}>
              <motion.div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${item.accentRgb},${isActive ? '0.9' : '0.3'}),transparent)` }} />
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full"
                style={{ background: `radial-gradient(circle,rgba(${item.accentRgb},${isActive ? '0.2' : '0.06'}),transparent 70%)`, transition: 'all 0.3s' }} />
              <div className="relative">
                <motion.div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: isActive ? `rgba(${item.accentRgb},0.2)` : 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(${item.accentRgb},${isActive ? '0.5' : '0.2'})`,
                    color: isActive ? item.accentColor : 'rgba(241,196,15,0.5)',
                    boxShadow: isActive ? `0 0 16px rgba(${item.accentRgb},0.4)` : 'none',
                    transition: 'all 0.25s ease',
                  }}
                  animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {item.icon}
                </motion.div>
                <p className="font-perpetua text-xl" style={{ color: isActive ? '#fff' : '#f5d87a' }}>{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
                <AnimatePresence>
                  {isActive && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ color: item.accentColor }}>
                      <motion.span className="h-1.5 w-1.5 rounded-full" style={{ background: item.accentColor }}
                        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />
                      Dipilih <IconChevronRight />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── BET SECTION — muncul setelah mode dipilih */}
      <AnimatePresence>
        {mode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">

            {/* TARUHAN SECTION */}
            <div className="relative mb-4 overflow-hidden rounded-2xl p-5"
              style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(241,196,15,0.15)' }}>
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.4),transparent)' }} />

              {/* Header taruhan */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)', color: '#F1C40F' }}>
                    <IconTrophy />
                  </div>
                  <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>Taruhan Virtual</p>
                </div>
                {betAmount > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: `${selectedTier.bg}`, border: `1px solid ${selectedTier.border}`, color: selectedTier.color }}>
                    <IconCoin />
                    Pot ~{potEstimate} koin
                  </motion.div>
                )}
              </div>

              <p className="mb-4 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Pemenang mengambil seluruh pot koin. Gratis murni — tidak ada uang nyata.
              </p>

              {/* Bet tier cards */}
              <div className="grid grid-cols-5 gap-2">
                {BET_TIERS.map((tier) => {
                  const isSelected = betAmount === tier.amount
                  const cantAfford = tier.amount > 0 && tier.amount > coins
                  return (
                    <motion.button key={tier.amount} type="button"
                      onClick={() => handleBetSelect(tier.amount)}
                      whileHover={!cantAfford ? { y: -4, scale: 1.05 } : {}}
                      whileTap={!cantAfford ? { scale: 0.95 } : {}}
                      disabled={cantAfford}
                      className={`relative overflow-hidden rounded-xl py-3 px-2 text-center ${isSelected ? 'lb-bet-selected' : ''}`}
                      style={{
                        background: isSelected ? tier.bg : 'rgba(0,0,0,0.4)',
                        border: `1.5px solid ${isSelected ? tier.border : 'rgba(255,255,255,0.07)'}`,
                        cursor: cantAfford ? 'not-allowed' : 'pointer',
                        opacity: cantAfford ? 0.35 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? `0 0 20px ${tier.border}` : 'none',
                      }}>
                      {/* Selected shimmer */}
                      {isSelected && (
                        <motion.div className="pointer-events-none absolute inset-0"
                          style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.08) 50%,transparent 70%)' }}
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
                      )}
                      <div className="relative flex flex-col items-center gap-1">
                        <span style={{ color: isSelected ? tier.color : 'rgba(255,255,255,0.3)' }}>{tier.icon}</span>
                        <span className="text-xs font-black" style={{ color: isSelected ? tier.color : 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
                          {tier.amount === 0 ? '–' : tier.amount}
                        </span>
                        <span className="text-[8px] uppercase tracking-wide leading-none" style={{ color: isSelected ? tier.color : 'rgba(255,255,255,0.25)' }}>
                          {tier.sub}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Bet error */}
              <AnimatePresence>
                {betError && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>
                    <IconAlert /> {betError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pot info */}
              <AnimatePresence>
                {betAmount > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Taruhanmu', val: `${betAmount.toLocaleString()} koin`, color: selectedTier.color },
                      { label: 'Estimasi Pot', val: `${potEstimate} koin`, color: '#F1C40F' },
                      { label: 'Sisa Saldo', val: `${Math.max(0, coins - betAmount).toLocaleString()} koin`, color: 'rgba(255,255,255,0.6)' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl px-3 py-2.5 text-center"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(241,196,15,0.08)' }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(241,196,15,0.4)' }}>{item.label}</p>
                        <p className="text-xs font-bold" style={{ color: item.color }}>{item.val}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── FORM (Create / Join) */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl p-6"
              style={{
                border: `1px solid ${mode === 'create' ? 'rgba(142,68,173,0.28)' : 'rgba(192,57,43,0.28)'}`,
                background: 'rgba(0,0,0,0.6)',
              }}>
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: mode === 'create'
                  ? 'linear-gradient(90deg,transparent,rgba(142,68,173,0.8),transparent)'
                  : 'linear-gradient(90deg,transparent,rgba(192,57,43,0.8),transparent)' }} />
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
                style={{ background: mode === 'create'
                  ? 'radial-gradient(circle,rgba(142,68,173,0.12),transparent 70%)'
                  : 'radial-gradient(circle,rgba(192,57,43,0.12),transparent 70%)' }} />

              {/* CREATE */}
              {mode === 'create' && (
                <div className="relative space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(142,68,173,0.15)', border: '1px solid rgba(142,68,173,0.3)', color: '#a78bfa' }}>
                      <IconUsers />
                    </div>
                    <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>Pengaturan Room</p>
                  </div>

                  {/* Max players */}
                  <div>
                    <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: 'rgba(241,196,15,0.55)' }}>Maksimal Pemain</label>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5, 6].map((n) => (
                        <motion.button key={n} type="button" onClick={() => setMaxPlayers(n)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }}
                          className="relative overflow-hidden"
                          style={{
                            width: 48, height: 48, borderRadius: 12, fontSize: 15, fontWeight: 700,
                            border: `1px solid ${maxPlayers === n ? 'rgba(142,68,173,0.8)' : 'rgba(255,255,255,0.08)'}`,
                            background: maxPlayers === n ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'rgba(255,255,255,0.04)',
                            color: maxPlayers === n ? '#fff' : 'rgba(241,196,15,0.5)',
                            boxShadow: maxPlayers === n ? '0 0 18px rgba(142,68,173,0.6)' : 'none',
                            cursor: 'pointer', transition: 'all 0.18s ease',
                          }}>
                          {maxPlayers === n && (
                            <motion.span className="absolute inset-0"
                              style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.15) 50%,transparent 70%)' }}
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
                          )}
                          <span className="relative z-10">{n}</span>
                        </motion.button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Pilih 2–6 pemain. Host akan masuk otomatis.
                    </p>
                  </div>

                  {/* Username info */}
                  <div className="flex items-center gap-3 rounded-2xl p-3.5"
                    style={{ background: 'rgba(241,196,15,0.05)', border: '1px solid rgba(241,196,15,0.1)' }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.2)', color: '#F1C40F' }}>
                      <IconUser />
                    </div>
                    <div>
                      <p className="text-[10px]" style={{ color: 'rgba(241,196,15,0.5)' }}>Bermain sebagai</p>
                      <p className="text-sm font-semibold" style={{ color: '#F1C40F' }}>{username}</p>
                    </div>
                    <motion.span className="ml-auto h-2 w-2 rounded-full bg-green-400"
                      animate={{ boxShadow: ['0 0 4px #4ade80', '0 0 12px #4ade80', '0 0 4px #4ade80'] }}
                      transition={{ duration: 2, repeat: Infinity }} />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2 rounded-xl p-3 text-xs"
                        style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>
                        <IconAlert /> {formError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button type="button" onClick={handleCreate} disabled={loading}
                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 36px rgba(142,68,173,0.7)' } : {}}
                    whileTap={!loading ? { scale: 0.97 } : {}}
                    className="relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white"
                    style={{
                      background: loading ? 'rgba(142,68,173,0.25)' : 'linear-gradient(135deg,#3d1463,#5b1fa0,#8e44ad)',
                      border: loading ? '1px solid rgba(142,68,173,0.2)' : '1px solid rgba(142,68,173,0.5)',
                      boxShadow: loading ? 'none' : '0 0 24px rgba(142,68,173,0.5)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {!loading && (
                      <motion.span className="pointer-events-none absolute inset-0"
                        style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)' }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }} />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading
                        ? <><IconSpin /> Membuat Room...</>
                        : betAmount > 0
                          ? <><IconTrophy /> Buat Room · Taruhan {betAmount.toLocaleString()} Koin</>
                          : <><IconPlus /> Buat Room Sekarang</>
                      }
                    </span>
                  </motion.button>
                </div>
              )}

              {/* JOIN */}
              {mode === 'join' && (
                <div className="relative space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>
                      <IconKey />
                    </div>
                    <p className="font-perpetua text-lg" style={{ color: '#f5d87a' }}>Masukkan Kode Room</p>
                  </div>

                  {/* Code input */}
                  <div>
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="ABC123"
                      maxLength={6}
                      className="w-full rounded-2xl py-5 text-center text-4xl font-black tracking-[0.5em] outline-none"
                      style={{
                        background: 'rgba(0,0,0,0.55)',
                        border: `1px solid ${joinCode.length === 6 ? 'rgba(192,57,43,0.7)' : 'rgba(241,196,15,0.2)'}`,
                        color: '#F1C40F',
                        boxShadow: joinCode.length === 6 ? '0 0 20px rgba(192,57,43,0.3)' : 'none',
                        letterSpacing: '0.5em', transition: 'all 0.2s ease',
                      }}
                    />
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div key={i} className="rounded-full"
                          style={{
                            width: 6, height: 6,
                            background: i < joinCode.length ? '#F1C40F' : 'rgba(241,196,15,0.15)',
                            boxShadow: i < joinCode.length ? '0 0 6px rgba(241,196,15,0.6)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                          animate={i < joinCode.length ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.2 }} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-center text-[10px]" style={{ color: 'rgba(241,196,15,0.35)' }}>
                      {joinCode.length}/6 karakter
                    </p>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-start gap-2 rounded-xl p-3 text-xs"
                        style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', color: '#e74c3c' }}>
                        <IconAlert /> {formError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button type="button" onClick={handleJoin}
                    disabled={loading || joinCode.length < 6}
                    whileHover={!loading && joinCode.length === 6 ? { scale: 1.02, boxShadow: '0 0 36px rgba(192,57,43,0.7)' } : {}}
                    whileTap={!loading && joinCode.length === 6 ? { scale: 0.97 } : {}}
                    className="relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white"
                    style={{
                      background: loading || joinCode.length < 6 ? 'rgba(192,57,43,0.2)' : 'linear-gradient(135deg,#7b1010,#a93226,#e74c3c)',
                      border: `1px solid ${loading || joinCode.length < 6 ? 'rgba(192,57,43,0.15)' : 'rgba(192,57,43,0.5)'}`,
                      boxShadow: loading || joinCode.length < 6 ? 'none' : '0 0 24px rgba(192,57,43,0.5)',
                      cursor: loading || joinCode.length < 6 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}>
                    {!loading && joinCode.length === 6 && (
                      <motion.span className="pointer-events-none absolute inset-0"
                        style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.12) 50%,transparent 70%)' }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }} />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading
                        ? <><IconSpin /> Mencari Room...</>
                        : betAmount > 0
                          ? <><IconTrophy /> Join · Ikut Taruhan {betAmount.toLocaleString()} Koin</>
                          : <><IconKey /> Masuk ke Room</>
                      }
                    </span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOT BANNER */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-2xl p-4"
        style={{ border: '1px solid rgba(241,196,15,0.12)', background: 'rgba(0,0,0,0.45)' }}>
        <div className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.25),transparent)' }} />
        <div className="relative flex items-center gap-4">
          <motion.div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.2)', color: '#F1C40F' }}
            animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <IconBot />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'rgba(241,196,15,0.85)' }}>Main Lawan Bot</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Latihan sendiri melawan AI. Tidak perlu teman.</p>
          </div>
          <motion.button type="button" onClick={() => navigate('/game')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="relative shrink-0 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold"
            style={{ background: 'rgba(241,196,15,0.08)', color: 'rgba(241,196,15,0.85)', border: '1px solid rgba(241,196,15,0.22)', cursor: 'pointer' }}>
            <span className="flex items-center gap-1.5">Main <IconChevronRight /></span>
          </motion.button>
        </div>
      </motion.div>
    </section>
  )
}
