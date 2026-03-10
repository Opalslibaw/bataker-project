// src/pages/Leaderboard.jsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { useCoins } from '../hooks/useCoins.js'

const lbStyles = `
  @keyframes lb-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lb-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(241,196,15,0.4); }
    50%       { box-shadow: 0 0 18px rgba(241,196,15,0.8); }
  }
  @keyframes lb-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes lb-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
`

const CoinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" fill="url(#lbCoinGrad)" stroke="rgba(241,196,15,0.5)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(241,196,15,0.25)" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="rgba(120,80,0,0.9)" fontFamily="serif">₿</text>
    <defs>
      <radialGradient id="lbCoinGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE566"/>
        <stop offset="50%" stopColor="#F1C40F"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </radialGradient>
    </defs>
  </svg>
)

const RANK_STYLES = {
  1: { color: '#FFD700', glow: 'rgba(255,215,0,0.6)',  bg: 'rgba(255,215,0,0.1)',  label: '👑', border: 'rgba(255,215,0,0.4)'  },
  2: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.5)', bg: 'rgba(192,192,192,0.08)', label: '⬡', border: 'rgba(192,192,192,0.3)' },
  3: { color: '#CD7F32', glow: 'rgba(205,127,50,0.5)',  bg: 'rgba(205,127,50,0.08)', label: '⬡', border: 'rgba(205,127,50,0.3)'  },
}

// Crown SVG for rank 1
const IconCrown = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M4 20L2 8l5 4 5-6 5 6 5-4-2 12z" fill={color} fillOpacity="0.2"/>
  </svg>
)

// Medal SVG
const IconMedal = ({ color }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="14" r="7" fill={color} fillOpacity="0.15"/>
    <path d="M9 3h6l1 5H8L9 3z"/>
    <path d="M9 8l3 3 3-3" strokeOpacity="0.6"/>
  </svg>
)

function RankBadge({ rank }) {
  if (rank === 1) return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ background: 'rgba(255,215,0,0.15)', border: '1.5px solid rgba(255,215,0,0.5)', animation: 'lb-pulse 2.5s ease-in-out infinite' }}>
      <IconCrown color="#FFD700" />
    </div>
  )
  if (rank <= 3) {
    const s = RANK_STYLES[rank]
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
        <IconMedal color={s.color} />
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ background: 'rgba(241,196,15,0.06)', border: '1px solid rgba(241,196,15,0.15)' }}>
      <span className="text-xs font-bold" style={{ color: 'rgba(241,196,15,0.55)' }}>#{rank}</span>
    </div>
  )
}

function LeaderboardRow({ entry, index, isMe }) {
  const s = RANK_STYLES[entry.rank]
  const color = s?.color || (isMe ? '#a78bfa' : 'rgba(241,196,15,0.7)')

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3"
      style={{
        background: isMe
          ? 'linear-gradient(135deg,rgba(167,139,250,0.12),rgba(109,40,217,0.08))'
          : (s ? s.bg : 'rgba(0,0,0,0.35)'),
        border: isMe
          ? '1px solid rgba(167,139,250,0.4)'
          : (s ? `1px solid ${s.border}` : '1px solid rgba(241,196,15,0.1)'),
        boxShadow: s ? `0 0 20px ${s.glow}` : 'none',
      }}
    >
      {/* Top shimmer for top 3 */}
      {s && <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${s.glow},transparent)` }} />}

      {/* "Kamu" indicator */}
      {isMe && (
        <div className="absolute right-3 top-2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
          Kamu
        </div>
      )}

      <RankBadge rank={entry.rank} />

      {/* Avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
        style={{ border: `1.5px solid ${color}40`, background: 'rgba(30,10,60,0.8)' }}>
        {entry.avatar_url
          ? <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center text-lg">🃏</div>
        }
      </div>

      {/* Name + stats */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" style={{ color }}>
          {entry.username}
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(241,196,15,0.4)' }}>
          {entry.games_played} main · {entry.win_rate}% menang
        </p>
      </div>

      {/* Coin balance */}
      <div className="flex shrink-0 items-center gap-1.5">
        <CoinIcon size={16} />
        <span className="text-sm font-bold" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {Number(entry.coins).toLocaleString()}
        </span>
      </div>
    </motion.div>
  )
}

function TopThreeCard({ entry, position }) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' }
  const orders  = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }
  const s = RANK_STYLES[position]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center gap-2 ${orders[position]}`}
      style={{ animation: position === 1 ? 'lb-float 4s ease-in-out infinite' : 'none' }}
    >
      {/* Avatar */}
      <div className="relative">
        <div className="overflow-hidden rounded-full"
          style={{
            width: position === 1 ? 72 : 56,
            height: position === 1 ? 72 : 56,
            border: `2.5px solid ${s.color}`,
            boxShadow: `0 0 24px ${s.glow}, 0 0 48px ${s.glow}40`,
          }}>
          {entry.avatar_url
            ? <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center" style={{ background: 'rgba(30,10,60,0.9)', fontSize: position === 1 ? 28 : 22 }}>🃏</div>
          }
        </div>
        {position === 1 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <IconCrown color="#FFD700" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-bold truncate max-w-[80px]" style={{ color: s.color }}>{entry.username}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <CoinIcon size={12} />
          <span className="text-xs font-bold" style={{ color: s.color }}>{Number(entry.coins).toLocaleString()}</span>
        </div>
      </div>

      {/* Podium */}
      <div className={`w-16 ${heights[position]} rounded-t-xl flex items-end justify-center pb-2`}
        style={{
          background: `linear-gradient(180deg,${s.bg},rgba(0,0,0,0.4))`,
          border: `1px solid ${s.border}`,
          borderBottom: 'none',
          boxShadow: `0 -4px 20px ${s.glow}40`,
        }}>
        <span className="text-xl font-perpetua font-bold" style={{ color: s.color }}>{position}</span>
      </div>
    </motion.div>
  )
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const { fetchLeaderboard } = useCoins()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('coins') // 'coins' | 'wins'

  useEffect(() => {
    fetchLeaderboard().then(rows => {
      setData(rows)
      setLoading(false)
    })
  }, [])

  const sorted = [...data].sort((a, b) =>
    tab === 'coins' ? b.coins - a.coins : b.games_won - a.games_won
  ).map((r, i) => ({ ...r, rank: i + 1 }))

  const top3   = sorted.slice(0, 3)
  const rest   = sorted.slice(3)
  const myRank = sorted.find(r => r.id === user?.id)

  return (
    <section className="relative space-y-8">
      <style>{lbStyles}</style>

      {/* Ambient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 20% 0%,rgba(241,196,15,0.1) 0%,transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%,rgba(142,68,173,0.1) 0%,transparent 60%)',
        }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.5em]" style={{ color: 'rgba(241,196,15,0.45)' }}>Papan Peringkat</p>
        <h1 className="mt-1 font-perpetua text-4xl md:text-5xl"
          style={{ color: '#F1C40F', textShadow: '0 0 30px rgba(241,196,15,0.5)' }}>
          Leaderboard
        </h1>
      </motion.div>

      {/* My rank callout */}
      {myRank && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl px-5 py-4"
          style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.12),rgba(109,40,217,0.08))', border: '1px solid rgba(167,139,250,0.35)' }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.7),transparent)' }} />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(167,139,250,0.6)' }}>Posisi Kamu</p>
              <p className="font-perpetua text-2xl font-bold" style={{ color: '#a78bfa' }}>#{myRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(241,196,15,0.5)' }}>Total Koin</p>
              <div className="flex items-center justify-end gap-1.5">
                <CoinIcon size={16} />
                <span className="font-perpetua text-2xl font-bold" style={{ color: '#F1C40F' }}>
                  {Number(myRank.coins).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab switch */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="flex gap-2 rounded-2xl p-1"
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(241,196,15,0.12)' }}>
        {[['coins','Koin Terbanyak'],['wins','Menang Terbanyak']].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className="flex-1 rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              background: tab === key ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'transparent',
              color: tab === key ? '#fff' : 'rgba(241,196,15,0.5)',
              boxShadow: tab === key ? '0 0 20px rgba(142,68,173,0.5)' : 'none',
              cursor: 'pointer', border: 'none',
            }}>
            {label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(241,196,15,0.2)', borderTopColor: '#F1C40F', animation: 'lb-spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-3xl px-6 pb-6 pt-8"
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(241,196,15,0.12)' }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.5),transparent)' }} />
              <p className="mb-6 text-center text-[10px] uppercase tracking-[0.4em]" style={{ color: 'rgba(241,196,15,0.4)' }}>
                — Podium Utama —
              </p>
              <div className="flex items-end justify-center gap-4">
                {top3.map((entry, i) => (
                  <TopThreeCard key={entry.id} entry={entry} position={i === 0 ? 2 : i === 1 ? 1 : 3} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Rank list 4+ */}
          {rest.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: 'rgba(241,196,15,0.35)' }}>
                — Peringkat Selanjutnya —
              </p>
              <AnimatePresence mode="popLayout">
                {rest.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    isMe={entry.id === user?.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {data.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-perpetua text-2xl" style={{ color: 'rgba(241,196,15,0.3)' }}>Belum ada data</p>
              <p className="mt-2 text-xs" style={{ color: 'rgba(241,196,15,0.2)' }}>Jadilah yang pertama!</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
