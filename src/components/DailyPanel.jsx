/**
 * DailyPanel.jsx — Daily Login Bonus + Daily Missions
 * Premium dark luxury UI, zero emoji, all SVG icons
 */
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDailyBonus } from '../hooks/useDailyBonus.js'
import { useCoins } from '../hooks/useCoins.js'

const panelStyles = `
  @keyframes dp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes dp-coin-pop {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.25) rotate(8deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes dp-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes dp-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(241,196,15,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(241,196,15,0); }
    100% { box-shadow: 0 0 0 0 rgba(241,196,15,0); }
  }
  @keyframes dp-bar-fill {
    from { width: 0%; }
  }
`

/* ── SVG Icons ── */
const IcoGift = ({ size = 22, color = '#F1C40F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
  </svg>
)
const IcoFlame = ({ size = 16, color = '#F1C40F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 17c1.38 0 2.5-1.12 2.5-2.5 0-1.5-1-2.5-2-3.5C10.5 9.5 10 8 10 7c0 0-2 1.5-2 4s.5 2.5.5 3.5z"/>
    <path d="M12 20a7 7 0 000-14c0 2-1 4-3 5.5-1.5 1.5-2 3-2 4.5a7 7 0 005 4z"/>
  </svg>
)
const IcoCoin = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#dpCoinGrad)" stroke="rgba(241,196,15,0.5)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(241,196,15,0.2)" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="rgba(100,65,0,0.9)" fontFamily="serif">₿</text>
    <defs>
      <radialGradient id="dpCoinGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE566"/>
        <stop offset="50%" stopColor="#F1C40F"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </radialGradient>
    </defs>
  </svg>
)
const IcoCheck = ({ size = 14, color = '#4ade80' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoCards = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="13" height="18" rx="2"/>
    <path d="M5 7h7M5 10.5h7M5 14h4"/>
    <rect x="9" y="7" width="13" height="18" rx="2" strokeOpacity="0.35"/>
  </svg>
)
const IcoTrophy = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 01-2-2V5h4"/><path d="M18 9h2a2 2 0 002-2V5h-4"/>
    <path d="M12 17c-2.8 0-5-2.2-5-5V5h10v7c0 2.8-2.2 5-5 5z"/>
    <path d="M12 17v3M8 21h8"/>
  </svg>
)
const IcoGlobe = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
)

const STREAK_REWARDS = [25, 25, 35, 35, 50, 50, 75]

function MissionIcon({ icon, color }) {
  const props = { size: 15, color }
  if (icon === 'trophy') return <IcoTrophy {...props} />
  if (icon === 'globe') return <IcoGlobe {...props} />
  return <IcoCards {...props} />
}

function formatCountdown(ms) {
  if (!ms) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}j ${m}m`
}

export function DailyPanel({ userId }) {
  const { bonusState, missions, loading, claimResult, claimDailyBonus, claimMissionReward } = useDailyBonus(userId)
  const { balance, loadBalance } = useCoins(userId)
  const [timeLeft, setTimeLeft] = useState('')
  const [missionClaimed, setMissionClaimed] = useState(null)

  // Countdown timer
  useEffect(() => {
    if (!bonusState?.nextIn) return
    let remaining = bonusState.nextIn
    const tick = setInterval(() => {
      remaining -= 1000
      if (remaining <= 0) { clearInterval(tick); setTimeLeft('') }
      else setTimeLeft(formatCountdown(remaining))
    }, 1000)
    setTimeLeft(formatCountdown(remaining))
    return () => clearInterval(tick)
  }, [bonusState?.nextIn])

  const handleClaim = async () => {
    const result = await claimDailyBonus()
    if (result) loadBalance?.()
  }

  const handleMissionClaim = async (id) => {
    const reward = await claimMissionReward(id)
    if (reward) {
      setMissionClaimed({ id, reward })
      loadBalance?.()
      setTimeout(() => setMissionClaimed(null), 2500)
    }
  }

  const streak = bonusState?.streak ?? 0
  const streakDays = Array.from({ length: 7 }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{panelStyles}</style>

      {/* ── DAILY BONUS CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'relative', overflow: 'hidden', borderRadius: 20,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(241,196,15,0.2)',
          boxShadow: bonusState?.canClaim ? '0 0 40px rgba(241,196,15,0.08)' : 'none',
          padding: '20px 20px 18px',
        }}>
        {/* Top shimmer */}
        <div style={{
          position: 'absolute', inset: '0 0 auto', height: 1,
          background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.7),transparent)',
          backgroundSize: '200% 100%', animation: 'dp-shimmer 4s linear infinite',
        }}/>
        {/* Glow orb */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(241,196,15,0.1),transparent 70%)', pointerEvents: 'none' }}/>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ animation: bonusState?.canClaim ? 'dp-float 2.5s ease-in-out infinite' : 'none' }}>
            <IcoGift size={22} color={bonusState?.canClaim ? '#F1C40F' : 'rgba(241,196,15,0.35)'} />
          </div>
          <div>
            <p style={{ fontFamily: 'Cinzel,serif', fontSize: 13, fontWeight: 700, color: '#F1C40F', margin: 0 }}>Login Harian</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 1 }}>
              {bonusState?.canClaim ? `+${STREAK_REWARDS[Math.min(streak, STREAK_REWARDS.length - 1)]} koin menantimu` : `Reset dalam ${timeLeft || '…'}`}
            </p>
          </div>
          {streak > 1 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              borderRadius: 9999, padding: '3px 10px',
              background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)' }}>
              <IcoFlame size={12} color='#F1C40F'/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#F1C40F', fontFamily: 'Cinzel,serif' }}>{streak}x</span>
            </div>
          )}
        </div>

        {/* Streak days row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {streakDays.map(day => {
            const done = day <= streak
            const isCurrent = day === streak + 1 && bonusState?.canClaim
            return (
              <div key={day} style={{
                flex: 1, borderRadius: 10, padding: '6px 4px', textAlign: 'center',
                background: done ? 'rgba(241,196,15,0.12)' : isCurrent ? 'rgba(241,196,15,0.06)' : 'rgba(255,255,255,0.03)',
                border: done ? '1px solid rgba(241,196,15,0.4)' : isCurrent ? '1px solid rgba(241,196,15,0.25)' : '1px solid rgba(255,255,255,0.06)',
                animation: isCurrent ? 'dp-pulse-ring 2s ease-in-out infinite' : 'none',
              }}>
                <p style={{ fontSize: 9, color: done ? '#F1C40F' : 'rgba(255,255,255,0.3)', margin: 0, fontFamily: 'Cinzel,serif' }}>Hari</p>
                <p style={{ fontSize: 11, fontWeight: 800, color: done ? '#F1C40F' : isCurrent ? 'rgba(241,196,15,0.6)' : 'rgba(255,255,255,0.2)', margin: 0 }}>{day}</p>
                <p style={{ fontSize: 9, color: done ? 'rgba(241,196,15,0.7)' : 'rgba(255,255,255,0.2)', margin: 0 }}>+{STREAK_REWARDS[day - 1]}</p>
              </div>
            )
          })}
        </div>

        {/* Claim button */}
        <motion.button
          onClick={handleClaim}
          disabled={!bonusState?.canClaim || loading}
          whileHover={bonusState?.canClaim ? { scale: 1.02, boxShadow: '0 0 30px rgba(241,196,15,0.35)' } : {}}
          whileTap={bonusState?.canClaim ? { scale: 0.97 } : {}}
          style={{
            width: '100%', padding: '11px', borderRadius: 12, border: 'none', cursor: bonusState?.canClaim ? 'pointer' : 'default',
            fontFamily: 'Cinzel,serif', fontSize: 13, fontWeight: 700,
            background: bonusState?.canClaim
              ? 'linear-gradient(135deg,rgba(241,196,15,0.2),rgba(241,196,15,0.1))'
              : 'rgba(255,255,255,0.04)',
            border: bonusState?.canClaim ? '1px solid rgba(241,196,15,0.45)' : '1px solid rgba(255,255,255,0.08)',
            color: bonusState?.canClaim ? '#F1C40F' : 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
            backgroundSize: bonusState?.canClaim ? '200% 100%' : undefined,
            animation: bonusState?.canClaim ? 'dp-shimmer 3s linear infinite' : 'none',
          }}>
          {bonusState?.canClaim ? (
            <><IcoCoin size={15}/> Ambil Bonus Harian</>
          ) : (
            <><IcoCheck size={13}/> Sudah Diklaim Hari Ini</>
          )}
        </motion.button>

        {/* Claim result flash */}
        <AnimatePresence>
          {claimResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -6 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: 20, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.88)', gap: 8,
              }}>
              <motion.div style={{ animation: 'dp-coin-pop 0.5s ease-out' }}>
                <IcoCoin size={40}/>
              </motion.div>
              <p style={{ fontFamily: 'Cinzel,serif', fontSize: 26, fontWeight: 900, color: '#F1C40F', margin: 0,
                textShadow: '0 0 30px rgba(241,196,15,0.8)' }}>+{claimResult.coins}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                {claimResult.isStreak ? `Streak ${claimResult.streak} hari!` : 'Bonus login diklaim!'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── DAILY MISSIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          borderRadius: 20, background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden',
        }}>
        {/* Header */}
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoTrophy size={15} color='rgba(241,196,15,0.7)'/>
          <p style={{ fontFamily: 'Cinzel,serif', fontSize: 12, fontWeight: 700,
            color: 'rgba(241,196,15,0.8)', margin: 0, letterSpacing: '0.1em' }}>Misi Harian</p>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>RESET BESOK</span>
        </div>

        {/* Mission list */}
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {missions.length === 0 ? (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '12px 0' }}>Memuat misi…</p>
          ) : missions.map((m, idx) => {
            const pct = Math.min((m.progress / m.target) * 100, 100)
            const done = m.progress >= m.target
            const claimed = m.claimed
            const missionColor = m.icon === 'trophy' ? '#F1C40F' : m.icon === 'globe' ? '#a78bfa' : '#4ade80'
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06 }}
                style={{
                  borderRadius: 14, padding: '12px 14px',
                  background: claimed ? 'rgba(39,174,96,0.06)' : done ? 'rgba(241,196,15,0.05)' : 'rgba(255,255,255,0.03)',
                  border: claimed ? '1px solid rgba(39,174,96,0.2)' : done ? '1px solid rgba(241,196,15,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgba(${m.icon==='trophy'?'241,196,15':m.icon==='globe'?'167,139,250':'74,222,128'},0.1)`,
                    border: `1px solid rgba(${m.icon==='trophy'?'241,196,15':m.icon==='globe'?'167,139,250':'74,222,128'},0.2)`,
                    flexShrink: 0 }}>
                    <MissionIcon icon={m.icon} color={missionColor}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: claimed ? 'rgba(255,255,255,0.4)' : '#fff',
                      margin: 0, fontFamily: 'Cinzel,serif', letterSpacing: '0.03em',
                      textDecoration: claimed ? 'line-through' : 'none' }}>{m.label}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0, marginTop: 1 }}>{m.desc}</p>
                  </div>
                  {/* Reward badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, borderRadius: 9999,
                    padding: '3px 8px', background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.2)',
                    flexShrink: 0 }}>
                    <IcoCoin size={11}/>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#F1C40F' }}>{m.reward}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: claimed ? 0 : 8 }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.22,1,0.36,1] }}
                    style={{
                      height: '100%', borderRadius: 9999,
                      background: claimed ? 'rgba(74,222,128,0.5)' : `linear-gradient(90deg,${missionColor}80,${missionColor})`,
                      boxShadow: done ? `0 0 8px ${missionColor}80` : 'none',
                    }}/>
                </div>

                {/* Progress text + claim btn */}
                {!claimed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: done ? missionColor : 'rgba(255,255,255,0.3)' }}>
                      {m.progress}/{m.target}
                      {done && ' — Selesai!'}
                    </span>
                    {done && (
                      <motion.button
                        onClick={() => handleMissionClaim(m.id)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        style={{
                          borderRadius: 8, padding: '4px 12px', border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg,rgba(241,196,15,0.25),rgba(241,196,15,0.12))',
                          border: '1px solid rgba(241,196,15,0.4)',
                          color: '#F1C40F', fontSize: 10, fontWeight: 700, fontFamily: 'Cinzel,serif',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                        <IcoCoin size={10}/> Ambil
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Mission claimed flash */}
        <AnimatePresence>
          {missionClaimed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
                zIndex: 999, borderRadius: 14, padding: '12px 20px',
                background: 'rgba(0,0,0,0.95)', border: '1px solid rgba(241,196,15,0.4)',
                boxShadow: '0 0 30px rgba(241,196,15,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <IcoCoin size={18}/>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#F1C40F', fontWeight: 700 }}>
                +{missionClaimed.reward} Koin
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>misi selesai!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
