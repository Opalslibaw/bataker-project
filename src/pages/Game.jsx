import { supabase } from '../lib/supabase.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useEffect, useReducer, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS = ['♠', '♥', '♦', '♣']
const RED_SUITS = ['♥', '♦']

function buildDeck() {
  const deck = []
  let id = 0
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ id: `${id++}`, rank, suit })
    }
  }
  deck.push({ id: 'JOKER', rank: 'JOKER', suit: '🃏' })
  return deck
}

function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function removePairs(hand) {
  const byRank = hand.reduce((acc, card) => {
    if (card.rank === 'JOKER') return acc
    acc[card.rank] = acc[card.rank] || []
    acc[card.rank].push(card)
    return acc
  }, {})
  const remaining = []
  Object.values(byRank).forEach((group) => {
    if (group.length % 2 === 1) remaining.push(group[0])
  })
  return [...remaining, ...hand.filter((c) => c.rank === 'JOKER')]
}

function nextActiveIndexLeft(players, fromIndex) {
  const total = players.length
  let idx = fromIndex
  for (let i = 0; i < total; i += 1) {
    idx = (idx - 1 + total) % total
    const p = players[idx]
    if (!p.out && p.hand.length > 0) return idx
  }
  return fromIndex
}

function rightNeighborIndex(players, fromIndex) {
  const total = players.length
  let idx = fromIndex
  for (let i = 0; i < total - 1; i += 1) {
    idx = (idx + 1) % total
    const p = players[idx]
    if (!p.out && p.hand.length > 0) return idx
  }
  return null
}

const initialState = { players: [], current: 0, status: 'idle', loserIndex: null, pairInfo: null, jokerInfo: null }

function gameReducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      const deck = shuffle(buildDeck())
      const players = Array.from({ length: 4 }, (_, i) => ({ id: i, name: i === 0 ? 'Kamu' : `Bot ${i}`, hand: [], out: false }))
      const copy = [...deck]
      let index = 0
      while (copy.length > 0) { players[index].hand.push(copy.pop()); index = (index + 1) % players.length }
      const withPairs = players.map((p) => { const cleaned = removePairs(p.hand); return { ...p, hand: cleaned, out: cleaned.length === 0 } })
      const active = withPairs.filter((p) => !p.out && p.hand.length > 0)
      if (active.length <= 1) return { players: withPairs, current: active.length === 1 ? withPairs.indexOf(active[0]) : 0, status: 'finished', loserIndex: active.length === 1 ? withPairs.indexOf(active[0]) : null }
      return { players: withPairs, current: 0, status: 'playing', loserIndex: null }
    }
    case 'DRAW': {
      if (state.status !== 'playing') return state
      const { players, current } = state
      const currentPlayer = players[current]
      if (!currentPlayer || currentPlayer.out || currentPlayer.hand.length === 0) return { ...state, current: nextActiveIndexLeft(players, current) }
      const neighbor = rightNeighborIndex(players, current)
      if (neighbor == null) return state
      const source = players[neighbor]
      if (source.hand.length === 0) return { ...state, current: nextActiveIndexLeft(players, current) }
      const isUser = currentPlayer.id === 0
      let chosenIndex
      if (isUser && typeof action.index === 'number') chosenIndex = Math.min(Math.max(action.index, 0), source.hand.length - 1)
      else if (!isUser) chosenIndex = Math.floor(Math.random() * source.hand.length)
      else return state
      const newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }))
      const newSource = newPlayers[neighbor], newTarget = newPlayers[current]
      const [card] = newSource.hand.splice(chosenIndex, 1)
      const beforeHand = [...newTarget.hand]
      const insertAt = typeof action.insertAt === 'number' ? action.insertAt : newTarget.hand.length
      newTarget.hand.splice(insertAt, 0, card)
      const createdPair = card.rank !== 'JOKER' && beforeHand.some((c) => c.rank === card.rank)
      newTarget.hand = removePairs(newTarget.hand)
      for (let i = 0; i < newPlayers.length; i += 1) { if (newPlayers[i].hand.length === 0) newPlayers[i].out = true }
      const stillActive = newPlayers.filter((p) => !p.out && p.hand.length > 0)
      if (stillActive.length === 1) {
        const loser = stillActive[0]
        const loserIndex = newPlayers.findIndex((p) => p.id === loser.id)
        return { players: newPlayers, current, status: 'finished', loserIndex, pairInfo: createdPair ? { playerId: newTarget.id, rank: card.rank } : null, jokerInfo: card.rank === 'JOKER' ? { playerId: newTarget.id } : null }
      }
      return { players: newPlayers, current: nextActiveIndexLeft(newPlayers, current), status: 'playing', loserIndex: null, pairInfo: createdPair ? { playerId: newTarget.id, rank: card.rank } : null, jokerInfo: card.rank === 'JOKER' ? { playerId: newTarget.id } : null }
    }
    case 'SHUFFLE_HAND': {
      const newPlayers = state.players.map((p) => ({ ...p, hand: [...p.hand] }))
      newPlayers[0].hand = shuffle(newPlayers[0].hand)
      return { ...state, players: newPlayers }
    }
    case 'SET_HAND_ORDER': {
      const newPlayers = state.players.map((p) => ({ ...p, hand: [...p.hand] }))
      newPlayers[0].hand = action.order
      return { ...state, players: newPlayers }
    }
    case 'CLEAR_PAIR_ANIM': return { ...state, pairInfo: null }
    case 'CLEAR_JOKER_ANIM': return { ...state, jokerInfo: null }
    default: return state
  }
}

/* ── STYLES ── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');

  @keyframes tableShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes orbFloat {
    0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
    50% { transform: translateY(-20px) scale(1.05); opacity: 0.65; }
  }
  @keyframes runeRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes cardGlow {
    0%, 100% { box-shadow: 0 0 18px rgba(241,196,15,0.45), 0 8px 32px rgba(0,0,0,0.8); }
    50% { box-shadow: 0 0 40px rgba(241,196,15,0.85), 0 0 70px rgba(241,196,15,0.2), 0 8px 32px rgba(0,0,0,0.8); }
  }
  @keyframes jokerPulse {
    0%, 100% { box-shadow: 0 0 24px rgba(192,57,43,0.65), 0 8px 32px rgba(0,0,0,0.8); }
    50% { box-shadow: 0 0 60px rgba(192,57,43,1), 0 0 100px rgba(192,57,43,0.3), 0 8px 32px rgba(0,0,0,0.8); }
  }
  @keyframes turnIndicator {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.65; transform: scale(0.97); }
  }
  @keyframes particleRise {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-60px) scale(0); }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: rgba(241,196,15,0.4); box-shadow: 0 0 0 0 rgba(241,196,15,0); }
    50% { border-color: rgba(241,196,15,0.9); box-shadow: 0 0 0 4px rgba(241,196,15,0.08); }
  }
  @keyframes shimmerLine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .game-card-hover {
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease !important;
  }
  .game-card-hover:hover {
    transform: translateY(-18px) scale(1.14) rotate(-2deg) !important;
    z-index: 10 !important;
    filter: brightness(1.05) !important;
  }
  .neighbor-card-hover {
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease !important;
  }
  .neighbor-card-hover:hover {
    transform: translateY(-22px) scale(1.18) !important;
    z-index: 10 !important;
    filter: brightness(1.08) !important;
  }
`

/* ── Card face ── */
function CardFace({ card, size = 'md', glow = false, selected = false, onClick, canClick = false }) {
  const isJoker = card.rank === 'JOKER'
  const isRed = RED_SUITS.includes(card.suit)
  const sizes = {
    sm: { w: 38, h: 54, rank: 10, suit: 11 },
    md: { w: 56, h: 78, rank: 15, suit: 15 },
    lg: { w: 68, h: 96, rank: 17, suit: 17 },
  }
  const s = sizes[size]

  return (
    <motion.div
      onClick={canClick ? onClick : undefined}
      className={canClick ? 'game-card-hover' : ''}
      whileTap={canClick ? { scale: 0.93 } : {}}
      style={{
        width: s.w, height: s.h, borderRadius: 10, flexShrink: 0,
        background: isJoker
          ? 'linear-gradient(145deg, #0d0020, #2a0050, #1a0035)'
          : selected
          ? 'linear-gradient(160deg, #fffef5, #fff8dc, #f5edd0)'
          : 'linear-gradient(160deg, #fdfaf0, #f7f0de, #ede0c0)',
        border: selected
          ? '2px solid #F1C40F'
          : isJoker ? '1.5px solid rgba(220,50,50,0.9)' : '1px solid rgba(190,160,100,0.6)',
        boxShadow: selected
          ? '0 0 30px rgba(241,196,15,1), 0 0 60px rgba(241,196,15,0.5), 0 8px 24px rgba(0,0,0,0.7)'
          : glow || isJoker
          ? '0 0 24px rgba(200,50,43,0.9), 0 0 48px rgba(200,50,43,0.3), 0 6px 20px rgba(0,0,0,0.7)'
          : '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
        cursor: canClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        padding: '5px 4px', position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        animation: isJoker ? 'jokerPulse 2s ease-in-out infinite' : selected ? 'cardGlow 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {/* Card texture overlay */}
      {!isJoker && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
          background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.015) 4px, rgba(0,0,0,0.015) 5px)',
        }} />
      )}
      {/* Corner fold */}
      {!isJoker && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
          background: 'linear-gradient(225deg, rgba(0,0,0,0.08) 50%, transparent 50%)',
          borderRadius: '0 0 9px 0', pointerEvents: 'none',
        }} />
      )}
      {/* Shimmer on selected */}
      {selected && (
        <motion.div style={{
          position: 'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
          background: 'linear-gradient(105deg,transparent 30%,rgba(241,196,15,0.18) 50%,transparent 70%)',
          backgroundSize: '200% 100%',
        }}
          animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
      )}

      {isJoker ? (
        <>
          <span style={{ fontSize: s.suit, alignSelf: 'flex-start', lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.8))' }}>🃏</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: s.rank + 6, lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(255,80,80,1))' }}>🃏</span>
            <span style={{ fontSize: 7, color: 'rgba(255,180,180,0.8)', letterSpacing: '0.2em', fontFamily: 'Cinzel, serif', textTransform: 'uppercase' }}>Joker</span>
          </div>
          <span style={{ fontSize: s.suit, alignSelf: 'flex-end', lineHeight: 1, transform: 'rotate(180deg)', filter: 'drop-shadow(0 0 6px rgba(255,100,100,0.8))' }}>🃏</span>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(200,50,50,0.25), transparent 70%)', borderRadius: 9, pointerEvents: 'none' }} />
        </>
      ) : (
        <>
          <div style={{ alignSelf: 'flex-start', lineHeight: 1, textAlign: 'left' }}>
            <div style={{ fontSize: s.rank, fontWeight: 800, color: isRed ? '#c0392b' : '#111827', lineHeight: 1, fontFamily: 'Cinzel, serif' }}>{card.rank}</div>
            <div style={{ fontSize: s.suit - 1, color: isRed ? '#c0392b' : '#111827', lineHeight: 1 }}>{card.suit}</div>
          </div>
          <div style={{ fontSize: s.suit + 6, color: isRed ? '#c0392b' : '#111827', lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>{card.suit}</div>
          <div style={{ alignSelf: 'flex-end', lineHeight: 1, textAlign: 'right', transform: 'rotate(180deg)' }}>
            <div style={{ fontSize: s.rank, fontWeight: 800, color: isRed ? '#c0392b' : '#111827', lineHeight: 1, fontFamily: 'Cinzel, serif' }}>{card.rank}</div>
            <div style={{ fontSize: s.suit - 1, color: isRed ? '#c0392b' : '#111827', lineHeight: 1 }}>{card.suit}</div>
          </div>
        </>
      )}
      {selected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(241,196,15,0.12)', borderRadius: 9, pointerEvents: 'none' }} />
      )}
    </motion.div>
  )
}

/* ── Card back ── */
function CardBack({ size = 'md', highlighted = false, selected = false, onClick, canClick = false }) {
  const sizes = { sm: { w: 38, h: 54 }, md: { w: 50, h: 72 }, lg: { w: 64, h: 88 } }
  const s = sizes[size]
  return (
    <motion.div
      onClick={canClick ? onClick : undefined}
      className={canClick ? 'neighbor-card-hover' : ''}
      whileTap={canClick ? { scale: 0.93 } : {}}
      style={{
        width: s.w, height: s.h, borderRadius: 10, flexShrink: 0,
        background: selected
          ? 'linear-gradient(145deg, #2a0a50, #4a1a80, #2a0a50)'
          : 'linear-gradient(145deg, #140830, #26105a, #1c0c40)',
        border: selected ? '2px solid #F1C40F' : highlighted ? '1.5px solid rgba(200,60,60,0.8)' : '1px solid rgba(120,60,200,0.5)',
        boxShadow: selected
          ? '0 0 32px rgba(241,196,15,1), 0 0 70px rgba(241,196,15,0.45), 0 10px 24px rgba(0,0,0,0.8)'
          : highlighted
          ? '0 0 22px rgba(200,60,60,0.6), 0 0 44px rgba(200,60,60,0.15), 0 6px 18px rgba(0,0,0,0.7)'
          : '0 4px 16px rgba(0,0,0,0.6)',
        cursor: canClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        animation: highlighted && !selected ? 'borderPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Ornate back pattern */}
      <div style={{ position: 'absolute', inset: 5, borderRadius: 6, border: '1px solid rgba(241,196,15,0.35)' }} />
      <div style={{
        position: 'absolute', inset: 8, borderRadius: 4,
        background: 'repeating-linear-gradient(45deg, rgba(241,196,15,0.06) 0px, rgba(241,196,15,0.06) 2px, transparent 2px, transparent 8px)',
      }} />
      {/* Center diamond */}
      <div style={{
        width: 20, height: 20, border: '1px solid rgba(241,196,15,0.45)',
        transform: 'rotate(45deg)', position: 'relative', zIndex: 1,
        background: 'rgba(241,196,15,0.06)',
        boxShadow: '0 0 8px rgba(241,196,15,0.15)',
      }}>
        <div style={{ position: 'absolute', inset: 3, border: '1px solid rgba(241,196,15,0.3)', background: 'rgba(241,196,15,0.04)' }} />
      </div>
      {/* Shimmer sweep on hover (canClick) */}
      {canClick && (
        <motion.div style={{
          position: 'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
          background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.06) 50%,transparent 70%)',
          backgroundSize: '200% 100%',
        }}
          animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
      )}
      {selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(241,196,15,0.14)', borderRadius: 9 }} />}
      {highlighted && !selected && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'linear-gradient(135deg, rgba(200,60,60,0.1), transparent)' }} />
      )}
    </motion.div>
  )
}

/* ── Premium Bot SVG Avatars ── */
const BotAvatars = [
  // I — Skull / The Reaper
  ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 017 7c0 3.5-2 5.5-2 7H7c0-1.5-2-3.5-2-7a7 7 0 017-7z"/>
      <path d="M9 17v2a1 1 0 001 1h4a1 1 0 001-1v-2"/>
      <line x1="9" y1="12" x2="9" y2="12" strokeWidth="2.5"/>
      <line x1="15" y1="12" x2="15" y2="12" strokeWidth="2.5"/>
    </svg>
  ),
  // II — Mask / The Phantom
  ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 3 6 3 10v4c0 2 1 4 3 5l2 1h8l2-1c2-1 3-3 3-5v-4c0-4-3.5-8-9-8z"/>
      <path d="M9 13c0 0 1 1.5 3 1.5s3-1.5 3-1.5"/>
      <path d="M7 10h2M15 10h2"/>
    </svg>
  ),
  // III — Crown / The Emperor
  ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l3-8 4 5 2-9 2 9 4-5 3 8H3z"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </svg>
  ),
]

// Safe exit icon — checkmark in circle, clean
const IconSafeExit = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)

/* ── Bot player ── */
function BotPlayer({ player, isCurrent }) {
  const BotAvatar = BotAvatars[Math.min(player.id - 1, BotAvatars.length - 1)] || BotAvatars[0]
  const avatarColor = player.out
    ? 'rgba(241,196,15,0.18)'
    : isCurrent
    ? '#F1C40F'
    : 'rgba(241,196,15,0.55)'

  return (
    <motion.div
      animate={{
        boxShadow: isCurrent
          ? '0 0 50px rgba(241,196,15,0.55), 0 0 100px rgba(241,196,15,0.18), inset 0 0 24px rgba(241,196,15,0.06)'
          : '0 4px 20px rgba(0,0,0,0.5)',
        borderColor: isCurrent ? 'rgba(241,196,15,0.85)' : 'rgba(241,196,15,0.12)',
        scale: isCurrent ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        borderRadius: 18, padding: '14px 18px', minWidth: 130,
        background: 'linear-gradient(145deg, rgba(5,2,15,0.97), rgba(15,5,35,0.92))',
        border: '1px solid rgba(241,196,15,0.12)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Top shimmer — animated when active */}
      <motion.div
        animate={isCurrent ? { x: ['-100%', '200%'] } : { x: '-100%' }}
        transition={isCurrent ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : {}}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(241,196,15,0.9), transparent)',
        }} />
      {/* Corner ambient */}
      {isCurrent && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 0%,rgba(241,196,15,0.07),transparent 70%)',
        }} />
      )}

      <div style={{
        width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: player.out
          ? 'rgba(255,255,255,0.04)'
          : isCurrent
          ? 'linear-gradient(135deg, rgba(91,31,160,0.7), rgba(142,68,173,0.9))'
          : 'rgba(241,196,15,0.08)',
        border: isCurrent ? '2px solid rgba(241,196,15,0.8)' : '1px solid rgba(241,196,15,0.15)',
        opacity: player.out ? 0.3 : 1,
        boxShadow: isCurrent ? '0 0 24px rgba(241,196,15,0.5), inset 0 0 12px rgba(241,196,15,0.12)' : 'none',
        transition: 'all 0.3s ease',
        color: avatarColor,
      }}>
        {player.out
          ? <IconSafeExit size={18} />
          : <BotAvatar size={20} color={avatarColor} />
        }
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Cinzel, Georgia, serif', fontSize: 12, fontWeight: 600,
          color: player.out ? 'rgba(241,196,15,0.22)' : isCurrent ? '#F1C40F' : 'rgba(241,196,15,0.7)',
          lineHeight: 1, letterSpacing: '0.05em',
          textShadow: isCurrent ? '0 0 12px rgba(241,196,15,0.6)' : 'none',
        }}>
          {player.name}
        </p>
        {player.out && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 3 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(39,174,96,0.7)" strokeWidth="3" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            <span style={{ fontSize: 9, color: 'rgba(39,174,96,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Selamat</span>
          </motion.div>
        )}
        {isCurrent && !player.out && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 4 }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(241,196,15,0.8)', boxShadow: '0 0 4px rgba(241,196,15,0.6)' }} />
            ))}
          </motion.div>
        )}
      </div>

      {!player.out && player.hand.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          {player.hand.slice(0, 6).map((_, idx) => (
            <div key={idx} style={{
              marginLeft: idx === 0 ? 0 : -16,
              transform: `rotate(${(idx - 2.5) * 4}deg)`,
              transformOrigin: 'bottom center',
            }}>
              <CardBack size="sm" highlighted={isCurrent} />
            </div>
          ))}
          {player.hand.length > 6 && (
            <span style={{ fontSize: 9, color: 'rgba(241,196,15,0.4)', marginLeft: 5, alignSelf: 'center' }}>+{player.hand.length - 6}</span>
          )}
        </div>
      )}
      {!player.out && (
        <div style={{
          borderRadius: 20, padding: '2px 10px',
          background: isCurrent ? 'rgba(241,196,15,0.08)' : 'rgba(0,0,0,0.4)',
          border: isCurrent ? '1px solid rgba(241,196,15,0.2)' : '1px solid rgba(241,196,15,0.08)',
          transition: 'all 0.3s ease',
        }}>
          <p style={{ fontSize: 9, color: isCurrent ? 'rgba(241,196,15,0.7)' : 'rgba(241,196,15,0.4)', letterSpacing: '0.1em' }}>{player.hand.length} KARTU</p>
        </div>
      )}
    </motion.div>
  )
}

export function GamePage() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [shuffling, setShuffling] = useState(true)
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const statsUpdated = useRef(false)

  useEffect(() => {
    if (state.status !== 'finished' || !user || statsUpdated.current) return
    statsUpdated.current = true
    const loser = state.players[state.loserIndex]
    const iLost = loser?.id === 0
    const run = async () => {
      const { data } = await supabase.from('profiles').select('games_played,games_won,games_lost').eq('id', user.id).single()
      if (!data) return
      await supabase.from('profiles').update({
        games_played: (data.games_played || 0) + 1,
        games_won: (data.games_won || 0) + (iLost ? 0 : 1),
        games_lost: (data.games_lost || 0) + (iLost ? 1 : 0),
      }).eq('id', user.id)
      refreshProfile()
    }
    run()
  }, [state.status, user])

  const [selectedIndex, setSelectedIndex] = useState(null)
  const [handOrder, setHandOrder] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => { dispatch({ type: 'INIT' }); setShuffling(false); statsUpdated.current = false }, 1800)
    return () => clearTimeout(id)
  }, [])

  const prevHandRef = useRef([])
  useEffect(() => {
    const hand = state.players[0]?.hand || []
    if (handOrder === null) {
      setHandOrder(hand.map(c => c.id))
      prevHandRef.current = hand.map(c => c.id)
      return
    }
    const prevIds = prevHandRef.current
    const newIds = hand.map(c => c.id)
    const added = newIds.filter(id => !prevIds.includes(id))
    const removed = prevIds.filter(id => !newIds.includes(id))
    if (added.length > 0 || removed.length > 0) {
      let updated = handOrder.filter(id => newIds.includes(id))
      added.forEach(id => updated.push(id))
      setHandOrder(updated)
    }
    prevHandRef.current = newIds
  }, [state.players])

  const currentPlayer = state.players[state.current] || null
  const neighbor = state.players.length > 0 ? rightNeighborIndex(state.players, state.current) : null
  const neighborPlayer = neighbor != null ? state.players[neighbor] : null
  const isPairForUser = state.pairInfo && state.pairInfo.playerId === 0
  const isJokerForUser = state.jokerInfo && state.jokerInfo.playerId === 0

  useEffect(() => {
    if (shuffling || state.status !== 'playing' || !currentPlayer || currentPlayer.id === 0) return
    const id = setTimeout(() => dispatch({ type: 'DRAW' }), 1200)
    return () => clearTimeout(id)
  }, [currentPlayer, state.status, shuffling])

  useEffect(() => {
    if (!state.pairInfo) return
    const id = setTimeout(() => dispatch({ type: 'CLEAR_PAIR_ANIM' }), 1000)
    return () => clearTimeout(id)
  }, [state.pairInfo])

  useEffect(() => {
    if (!state.jokerInfo) return
    const id = setTimeout(() => dispatch({ type: 'CLEAR_JOKER_ANIM' }), 1200)
    return () => clearTimeout(id)
  }, [state.jokerInfo])

  const handleConfirmDraw = () => {
    if (state.status !== 'playing' || !currentPlayer || currentPlayer.id !== 0 || selectedIndex == null) return
    dispatch({ type: 'DRAW', index: selectedIndex, insertAt: selectedIndex })
    setSelectedIndex(null)
  }

  const handleShuffle = () => {
    dispatch({ type: 'SHUFFLE_HAND' })
    const hand = state.players[0]?.hand || []
    const shuffled = shuffle(hand)
    setHandOrder(shuffled.map(c => c.id))
  }

  const handleRestart = () => {
    setSelectedIndex(null)
    setHandOrder(null)
    statsUpdated.current = false
    setShuffling(true)
    const id = setTimeout(() => { dispatch({ type: 'INIT' }); setShuffling(false) }, 1000)
    return () => clearTimeout(id)
  }

  const isMyTurn = state.status === 'playing' && currentPlayer?.id === 0

  const hand0 = state.players[0]?.hand || []
  const displayHand = handOrder
    ? handOrder.map(id => hand0.find(c => c.id === id)).filter(Boolean)
    : hand0

  return (
    <>
      <style>{styles}</style>
      <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0, minHeight: 500 }}>

        {/* ── Rich table background ── */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse at 30% 30%, rgba(20,60,30,0.97) 0%, rgba(8,30,15,0.99) 50%, rgba(0,0,0,1) 100%)',
        }}>
          {/* Felt texture */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.07,
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
              radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '12px 12px, 6px 6px',
          }} />
          {/* Table border glow */}
          <div style={{
            position: 'absolute', inset: 10, borderRadius: 14,
            border: '2px solid rgba(241,196,15,0.2)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7), inset 0 0 120px rgba(0,0,0,0.4)',
          }} />
          <div style={{
            position: 'absolute', inset: 14, borderRadius: 12,
            border: '1px solid rgba(241,196,15,0.08)',
          }} />
          {/* Center glow orb — brighter */}
          <div style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 500, height: 360,
            background: 'radial-gradient(ellipse, rgba(30,100,50,0.3) 0%, transparent 70%)',
            animation: 'orbFloat 6s ease-in-out infinite',
          }} />
          {/* Secondary subtle orb */}
          <div style={{
            position: 'absolute', top: '70%', left: '20%',
            width: 300, height: 200,
            background: 'radial-gradient(ellipse, rgba(241,196,15,0.04) 0%, transparent 70%)',
            animation: 'orbFloat 8s ease-in-out infinite reverse',
            pointerEvents: 'none',
          }} />
          {/* Corner ornaments */}
          {[
            { top: 18, left: 18 }, { top: 18, right: 18 },
            { bottom: 18, left: 18 }, { bottom: 18, right: 18 },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos,
              width: 24, height: 24, opacity: 0.3,
              background: `
                linear-gradient(45deg, transparent 40%, rgba(241,196,15,0.8) 40%, rgba(241,196,15,0.8) 60%, transparent 60%),
                linear-gradient(-45deg, transparent 40%, rgba(241,196,15,0.8) 40%, rgba(241,196,15,0.8) 60%, transparent 60%)
              `,
            }} />
          ))}
          {/* Animated shimmer border line */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', top: 10, left: 10, right: 10, height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.5),transparent)',
              borderRadius: 14,
            }} />
        </div>

        {/* ── Shuffling overlay ── */}
        <AnimatePresence>
          {shuffling && (
            <motion.div
              style={{
                position: 'absolute', inset: 0, zIndex: 30, borderRadius: 20,
                background: 'radial-gradient(ellipse at center,rgba(4,1,10,0.99) 0%,rgba(0,0,0,0.99) 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}>
              {/* Glow behind cards */}
              <div style={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle,rgba(192,57,43,0.12) 0%,transparent 70%)',
                animation: 'orbFloat 3s ease-in-out infinite',
              }} />
              <div style={{ position: 'relative', width: 220, height: 120 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div key={i}
                    style={{
                      position: 'absolute', left: '50%', top: '50%',
                      width: 52, height: 74, borderRadius: 10,
                      background: 'linear-gradient(145deg, #140830, #26105a)',
                      border: '1px solid rgba(241,196,15,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.8), 0 0 16px rgba(241,196,15,0.1)',
                    }}
                    initial={{ rotate: -20 + i * 10, x: -26 + (-60 + i * 30), y: -37, opacity: 0 }}
                    animate={{
                      rotate: [-20 + i * 10, 15 - i * 6, -8 + i * 8],
                      x: [-26 + (-60 + i * 30), -26, -26 + (-12 + i * 6)],
                      opacity: [0, 1, 1],
                    }}
                    transition={{ duration: 1.3, repeat: Infinity, repeatType: 'mirror', delay: i * 0.07 }}>
                    🃏
                  </motion.div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Cinzel Decorative, Georgia, serif',
                  fontSize: 20, color: '#F1C40F',
                  textShadow: '0 0 24px rgba(241,196,15,0.8), 0 0 48px rgba(241,196,15,0.3)',
                  letterSpacing: '0.3em', marginBottom: 16,
                }}>
                  Mengocok Kartu
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      style={{ width: 5, height: 5, borderRadius: '50%', background: '#F1C40F', boxShadow: '0 0 6px rgba(241,196,15,0.6)' }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PAIR animation ── */}
        <AnimatePresence>
          {isPairForUser && (
            <motion.div
              style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(241,196,15,0.1), transparent 70%)', borderRadius: 20 }} />
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} style={{
                  position: 'absolute',
                  left: `${30 + i * 8}%`, top: '45%',
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#F1C40F', boxShadow: '0 0 8px rgba(241,196,15,0.8)',
                }}
                  animate={{ y: [0, -80], opacity: [1, 0], scale: [1, 0] }}
                  transition={{ duration: 0.9, delay: i * 0.08 }} />
              ))}
              <motion.div initial={{ scale: 0.5, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: 20 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[0, 1].map(i => (
                    <motion.div key={i}
                      animate={{ x: i === 0 ? [-8, 8, 0] : [8, -8, 0], y: [0, -14, 0], rotate: i === 0 ? [-5, 5, 0] : [5, -5, 0] }}
                      transition={{ duration: 0.6 }}
                      style={{
                        width: 58, height: 80, borderRadius: 10,
                        background: 'linear-gradient(160deg, #fffef5, #fff0b0)',
                        border: '2.5px solid #F1C40F',
                        boxShadow: '0 0 36px rgba(241,196,15,1), 0 0 72px rgba(241,196,15,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Cinzel, serif', fontSize: 26, fontWeight: 900, color: '#c0392b',
                      }}>
                      {state.pairInfo?.rank}
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  style={{
                    borderRadius: 9999, padding: '8px 24px',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.97), rgba(20,15,0,0.97))',
                    border: '1px solid rgba(241,196,15,0.7)',
                    fontSize: 13, fontWeight: 700, color: '#F1C40F',
                    letterSpacing: '0.2em', fontFamily: 'Cinzel, serif',
                    boxShadow: '0 0 32px rgba(241,196,15,0.5)',
                  }}>
                  ✨ PASANGAN!
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── JOKER animation ── */}
        <AnimatePresence>
          {isJokerForUser && (
            <motion.div
              style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(192,57,43,0.18), transparent 65%)', borderRadius: 20 }} />
              <motion.div
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: 2 }}
                style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(192,57,43,0.08) 50%, transparent 60%)', pointerEvents: 'none' }} />
              {/* Red particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} style={{
                  position: 'absolute',
                  left: `${25 + i * 10}%`, top: '55%',
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#e74c3c', boxShadow: '0 0 8px rgba(192,57,43,0.8)',
                }}
                  animate={{ y: [0, -100], opacity: [1, 0], scale: [1, 0] }}
                  transition={{ duration: 1, delay: i * 0.1 }} />
              ))}
              <motion.div
                initial={{ scale: 0.6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.6 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
                <motion.div
                  animate={{ rotate: [-4, 4, -4], y: [0, -8, 0] }}
                  transition={{ duration: 0.9, repeat: 3 }}
                  style={{
                    width: 88, height: 124, borderRadius: 14,
                    background: 'linear-gradient(145deg, #0d0020, #2a0050)',
                    border: '2.5px solid #e74c3c',
                    boxShadow: '0 0 70px rgba(192,57,43,1), 0 0 140px rgba(192,57,43,0.5), inset 0 0 30px rgba(192,57,43,0.25)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <span style={{ fontSize: 42, filter: 'drop-shadow(0 0 14px rgba(255,80,80,1))' }}>🃏</span>
                  <span style={{ fontSize: 10, color: '#F1C40F', letterSpacing: '0.3em', fontFamily: 'Cinzel, serif', textTransform: 'uppercase' }}>Joker</span>
                </motion.div>
                <motion.div
                  initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  style={{
                    borderRadius: 9999, padding: '10px 28px',
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.97), rgba(30,5,5,0.97))',
                    border: '1px solid rgba(192,57,43,0.8)',
                    fontSize: 14, fontWeight: 700, color: '#e74c3c',
                    letterSpacing: '0.15em', fontFamily: 'Cinzel, serif',
                    boxShadow: '0 0 36px rgba(192,57,43,0.6)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 017 7c0 3.5-2 5.5-2 7H7c0-1.5-2-3.5-2-7a7 7 0 017-7z"/>
                    <path d="M9 17v2a1 1 0 001 1h4a1 1 0 001-1v-2"/>
                    <circle cx="9" cy="12" r="1.2" fill="#e74c3c" stroke="none"/>
                    <circle cx="15" cy="12" r="1.2" fill="#e74c3c" stroke="none"/>
                  </svg>
                  DAPAT JOKER!
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONTENT ── */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h1 style={{
                  fontFamily: 'Cinzel Decorative, Georgia, serif',
                  fontSize: 26, color: '#F1C40F',
                  textShadow: '0 0 24px rgba(241,196,15,0.7), 0 0 48px rgba(241,196,15,0.25)',
                  lineHeight: 1, margin: 0, letterSpacing: '0.05em',
                }}>
                  Kartu Batak
                </h1>
                <span style={{ fontSize: 9, color: 'rgba(241,196,15,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif' }}>Solo</span>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(241,196,15,0.4)', marginTop: 4, letterSpacing: '0.1em' }}>
                Hindari menjadi pemegang Joker terakhir
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPlayer?.id ?? 'idle'}
                initial={{ opacity: 0, x: 10, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10 }}
                style={{
                  borderRadius: 12, padding: '8px 18px', fontSize: 12, fontWeight: 700,
                  background: isMyTurn
                    ? 'linear-gradient(135deg, rgba(241,196,15,0.18), rgba(241,196,15,0.06))'
                    : 'rgba(0,0,0,0.5)',
                  border: isMyTurn
                    ? '1px solid rgba(241,196,15,0.55)'
                    : '1px solid rgba(255,255,255,0.07)',
                  color: isMyTurn ? '#F1C40F' : 'rgba(255,255,255,0.35)',
                  boxShadow: isMyTurn ? '0 0 24px rgba(241,196,15,0.25), inset 0 0 12px rgba(241,196,15,0.05)' : 'none',
                  fontFamily: 'Cinzel, serif', letterSpacing: '0.05em',
                  animation: isMyTurn ? 'turnIndicator 1.5s ease-in-out infinite' : 'none',
                }}>
                {state.status === 'finished'
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/><line x1="19" y1="12" x2="23" y2="12"/></svg>
                      Game Selesai
                    </span>
                  : isMyTurn
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Giliranmu!
                    </span>
                  : currentPlayer
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 3h14M5 21h14M12 3v3M12 18v3M8 8h8l-1 4H9L8 8z"/></svg>
                      {currentPlayer.name}...
                    </span>
                  : ''}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(241,196,15,0.35), rgba(241,196,15,0.1), transparent)' }} />

          {/* Bots row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {state.players.filter((p) => p.id !== 0).map((p) => (
              <BotPlayer key={p.id} player={p} isCurrent={currentPlayer?.id === p.id} />
            ))}
          </div>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(241,196,15,0.18))' }} />
            <span style={{ fontSize: 9, color: 'rgba(241,196,15,0.35)', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif' }}>Meja Permainan</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(241,196,15,0.18), transparent)' }} />
          </div>

          {/* Neighbor cards pick area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 9999, padding: '5px 16px',
              background: isMyTurn ? 'rgba(241,196,15,0.07)' : 'rgba(0,0,0,0.3)',
              border: isMyTurn ? '1px solid rgba(241,196,15,0.25)' : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isMyTurn ? '0 0 12px rgba(241,196,15,0.1)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: isMyTurn ? 'rgba(241,196,15,0.85)' : 'rgba(241,196,15,0.4)', letterSpacing: '0.08em', margin: 0 }}>
                {isMyTurn ? 'Pilih 1 kartu dari pemain kanan' : 'Kartu pemain sebelah kanan'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0, padding: '8px 0' }}>
              {neighborPlayer && neighborPlayer.hand.map((_, idx) => {
                const isSelected = selectedIndex === idx
                return (
                  <motion.div
                    key={`${neighborPlayer.id}-${idx}`}
                    style={{ marginLeft: idx === 0 ? 0 : -12, zIndex: isSelected ? 5 : 1 }}
                    animate={{ y: isSelected ? -10 : 0 }}>
                    <CardBack size="md" selected={isSelected} canClick={isMyTurn}
                      highlighted={isMyTurn} onClick={() => isMyTurn && setSelectedIndex(idx)} />
                  </motion.div>
                )
              })}
              {!neighborPlayer && (
                <p style={{ fontSize: 11, color: 'rgba(241,196,15,0.3)', fontFamily: 'Cinzel, serif' }}>Tidak ada pemain aktif di kanan.</p>
              )}
            </div>

            <AnimatePresence>
              {selectedIndex != null && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  style={{
                    borderRadius: 9999, padding: '4px 16px',
                    background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.35)',
                    fontSize: 10, color: '#F1C40F', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em',
                    boxShadow: '0 0 12px rgba(241,196,15,0.15)',
                  }}>
                  Kartu #{selectedIndex + 1} — klik Ambil untuk konfirmasi
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(241,196,15,0.15))' }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(241,196,15,0.35)', transform: 'rotate(45deg)', boxShadow: '0 0 4px rgba(241,196,15,0.3)' }} />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(241,196,15,0.15), transparent)' }} />
          </div>

          {/* Player hand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#F1C40F' }}>
                  <rect x="2" y="3" width="13" height="18" rx="2"/><path d="M5 7h7M5 10.5h7M5 14h4"/>
                  <rect x="9" y="7" width="13" height="18" rx="2" strokeOpacity="0.35"/>
                </svg>
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: '#F1C40F', margin: 0, letterSpacing: '0.05em', textShadow: '0 0 10px rgba(241,196,15,0.3)' }}>
                  Kartu Kamu
                </p>
                <div style={{
                  borderRadius: 9999, padding: '1px 8px', minWidth: 24, textAlign: 'center',
                  background: 'rgba(241,196,15,0.12)', border: '1px solid rgba(241,196,15,0.28)',
                  boxShadow: '0 0 8px rgba(241,196,15,0.1)',
                }}>
                  <span style={{ fontSize: 10, color: '#F1C40F', fontFamily: 'Cinzel, serif' }}>{hand0.length}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button type="button" onClick={handleShuffle}
                  whileHover={{ scale: 1.06, backgroundColor: 'rgba(241,196,15,0.14)', boxShadow: '0 0 16px rgba(241,196,15,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700,
                    border: '1px solid rgba(241,196,15,0.28)',
                    background: 'rgba(241,196,15,0.07)', color: 'rgba(241,196,15,0.75)',
                    cursor: 'pointer', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                      <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                    </svg>
                    Kocok
                  </span>
                </motion.button>

                <motion.button type="button" onClick={handleConfirmDraw}
                  disabled={!isMyTurn || selectedIndex == null || shuffling}
                  whileHover={isMyTurn && selectedIndex != null ? { scale: 1.06, boxShadow: '0 0 32px rgba(192,57,43,0.7)' } : {}}
                  whileTap={isMyTurn && selectedIndex != null ? { scale: 0.95 } : {}}
                  style={{
                    borderRadius: 10, padding: '8px 22px', fontSize: 12, fontWeight: 700, border: 'none',
                    background: isMyTurn && selectedIndex != null
                      ? 'linear-gradient(135deg, #8b1e1e, #c0392b, #e74c3c)'
                      : 'rgba(255,255,255,0.04)',
                    color: isMyTurn && selectedIndex != null ? '#fff' : 'rgba(255,255,255,0.2)',
                    boxShadow: isMyTurn && selectedIndex != null
                      ? '0 0 28px rgba(192,57,43,0.65), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : 'none',
                    cursor: isMyTurn && selectedIndex != null ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s', letterSpacing: '0.08em',
                    fontFamily: 'Cinzel, serif',
                  }}>
                  Ambil →
                </motion.button>
              </div>
            </div>

            {/* Hand cards */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(0,0,0,0.35)',
              border: isMyTurn ? '1px solid rgba(241,196,15,0.1)' : '1px solid rgba(241,196,15,0.06)',
              minHeight: 100,
              boxShadow: isMyTurn ? 'inset 0 0 24px rgba(241,196,15,0.03)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              <AnimatePresence>
                {displayHand.map((card, i) => (
                  <motion.div key={card.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    transition={{ delay: i * 0.04 }}>
                    <CardFace card={card} size="md" glow={card.rank === 'JOKER'} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {hand0.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(39,174,96,0.8)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  <p style={{ fontSize: 13, color: 'rgba(39,174,96,0.8)', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em', textShadow: '0 0 10px rgba(39,174,96,0.4)' }}>
                    Kamu sudah bebas! Menunggu pemain lain...
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── GAME OVER MODAL ── */}
        <AnimatePresence>
          {state.status === 'finished' && state.loserIndex != null && (
            <motion.div
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
              }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Background particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div key={i}
                  style={{
                    position: 'absolute',
                    left: `${10 + i * 12}%`, bottom: '20%',
                    width: 3, height: 3, borderRadius: '50%',
                    background: state.players[state.loserIndex]?.id === 0 ? '#e74c3c' : '#F1C40F',
                    boxShadow: `0 0 6px ${state.players[state.loserIndex]?.id === 0 ? 'rgba(192,57,43,0.8)' : 'rgba(241,196,15,0.8)'}`,
                  }}
                  animate={{ y: [-0, -200], opacity: [1, 0], scale: [1, 0] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }} />
              ))}

              {(() => {
                const loser = state.players[state.loserIndex]
                const loserIsYou = loser?.id === 0
                return (
                  <motion.div
                    initial={{ scale: 0.7, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.7, y: 40 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{
                      width: '100%', maxWidth: 440, borderRadius: 28, padding: '36px 32px', textAlign: 'center',
                      background: loserIsYou
                        ? 'linear-gradient(160deg, rgba(20,3,3,0.99), rgba(35,8,8,0.99))'
                        : 'linear-gradient(160deg, rgba(3,10,5,0.99), rgba(8,20,12,0.99))',
                      border: loserIsYou ? '1px solid rgba(200,50,43,0.65)' : '1px solid rgba(241,196,15,0.55)',
                      boxShadow: loserIsYou
                        ? '0 0 100px rgba(192,57,43,0.4), 0 0 200px rgba(192,57,43,0.1), inset 0 0 40px rgba(192,57,43,0.06)'
                        : '0 0 100px rgba(241,196,15,0.3), 0 0 200px rgba(241,196,15,0.08), inset 0 0 40px rgba(241,196,15,0.04)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                    {/* Animated top shimmer */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: loserIsYou
                          ? 'linear-gradient(90deg, transparent, rgba(192,57,43,0.9), transparent)'
                          : 'linear-gradient(90deg, transparent, rgba(241,196,15,0.9), transparent)',
                      }} />
                    {/* Corner glows */}
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: 80, height: 80, pointerEvents: 'none',
                      background: loserIsYou
                        ? 'radial-gradient(circle at 0% 0%,rgba(192,57,43,0.15),transparent 70%)'
                        : 'radial-gradient(circle at 0% 0%,rgba(241,196,15,0.1),transparent 70%)',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0, width: 80, height: 80, pointerEvents: 'none',
                      background: loserIsYou
                        ? 'radial-gradient(circle at 100% 100%,rgba(192,57,43,0.12),transparent 70%)'
                        : 'radial-gradient(circle at 100% 100%,rgba(241,196,15,0.08),transparent 70%)',
                    }} />

                    <p style={{
                      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.4em',
                      color: loserIsYou ? 'rgba(200,50,43,0.55)' : 'rgba(241,196,15,0.45)',
                      marginBottom: 10, fontFamily: 'Cinzel, serif',
                    }}>Game Over</p>

                    <h2 style={{
                      fontFamily: 'Cinzel Decorative, Georgia, serif',
                      fontSize: 30, lineHeight: 1.1, marginBottom: 10,
                      color: loserIsYou ? '#e74c3c' : '#F1C40F',
                      textShadow: loserIsYou
                        ? '0 0 28px rgba(192,57,43,0.9), 0 0 60px rgba(192,57,43,0.4)'
                        : '0 0 28px rgba(241,196,15,0.8), 0 0 60px rgba(241,196,15,0.35)',
                    }}>
                      {loserIsYou ? 'Kamu Kalah!' : 'Kamu Menang!'}
                    </h2>
                    <p style={{ fontSize: 24, marginBottom: 8 }}>
                      {loserIsYou
                        ? <svg style={{ margin: '0 auto', display: 'block' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 017 7c0 3.5-2 5.5-2 7H7c0-1.5-2-3.5-2-7a7 7 0 017-7z"/><path d="M9 17v2a1 1 0 001 1h4a1 1 0 001-1v-2"/><line x1="9" y1="12" x2="9" y2="12" strokeWidth="3"/><line x1="15" y1="12" x2="15" y2="12" strokeWidth="3"/></svg>
                        : <svg style={{ margin: '0 auto', display: 'block' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F1C40F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"/><path d="M5 21h14"/></svg>
                      }
                    </p>

                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
                      {loserIsYou ? 'Kamu adalah pemegang Joker terakhir.' : `${loser?.name} adalah pemegang Joker terakhir.`}
                    </p>

                    {/* Animated joker card */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                      <motion.div
                        animate={{ rotate: [0, -6, 6, 0], y: [0, -10, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        style={{
                          width: 80, height: 112, borderRadius: 14,
                          background: 'linear-gradient(145deg, #0d0020, #2a0050)',
                          border: '2px solid #e74c3c',
                          boxShadow: '0 0 60px rgba(192,57,43,0.9), 0 0 120px rgba(192,57,43,0.4)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                        <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px rgba(255,80,80,0.9))' }}>🃏</span>
                        <span style={{ fontSize: 9, color: '#F1C40F', letterSpacing: '0.3em', fontFamily: 'Cinzel, serif' }}>JOKER</span>
                      </motion.div>
                    </div>

                    {/* Players summary */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 26, flexWrap: 'wrap' }}>
                      {state.players.map(p => (
                        <motion.div key={p.id}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          style={{
                            borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 74,
                            background: p.id === state.loserIndex ? 'rgba(192,57,43,0.15)' : 'rgba(241,196,15,0.07)',
                            border: p.id === state.loserIndex ? '1px solid rgba(192,57,43,0.45)' : '1px solid rgba(241,196,15,0.14)',
                          }}>
                          <p style={{ fontSize: 10, color: p.id === state.loserIndex ? '#e74c3c' : 'rgba(241,196,15,0.65)', fontWeight: 700, fontFamily: 'Cinzel, serif', margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                            {p.id === state.loserIndex
                              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  Kalah
                                </span>
                              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(39,174,96,0.7)" strokeWidth="3" strokeLinecap="round"><path d="M9 12l2 2 4-4"/></svg>
                                  Selamat
                                </span>
                            }
                          </p>
                        </motion.div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <motion.button type="button" onClick={handleRestart}
                        whileHover={{ scale: 1.06, boxShadow: '0 0 36px rgba(192,57,43,0.7)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          borderRadius: 12, padding: '12px 28px', fontSize: 13, fontWeight: 700, border: 'none',
                          background: 'linear-gradient(135deg, #7b1515, #a93226, #e74c3c)',
                          color: '#fff', cursor: 'pointer',
                          boxShadow: '0 0 32px rgba(192,57,43,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                          fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                            Main Lagi
                          </span>
                      </motion.button>
                      <motion.button type="button" onClick={() => navigate('/')}
                        whileHover={{ scale: 1.06, boxShadow: '0 0 24px rgba(241,196,15,0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          borderRadius: 12, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          border: '1px solid rgba(241,196,15,0.38)',
                          background: 'rgba(241,196,15,0.08)',
                          color: 'rgba(241,196,15,0.85)',
                          fontFamily: 'Cinzel, serif', letterSpacing: '0.08em',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Beranda
                          </span>
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  )
}
