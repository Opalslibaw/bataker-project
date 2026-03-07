import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useEffect, useReducer, useState } from 'react'
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

function nextActiveIndex(players, fromIndex) {
  const total = players.length
  let idx = fromIndex
  for (let i = 0; i < total; i += 1) {
    idx = (idx + 1) % total
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
      if (!currentPlayer || currentPlayer.out || currentPlayer.hand.length === 0) return { ...state, current: nextActiveIndex(players, current) }
      const neighbor = rightNeighborIndex(players, current)
      if (neighbor == null) return state
      const source = players[neighbor]
      if (source.hand.length === 0) return { ...state, current: nextActiveIndex(players, current) }
      const isUser = currentPlayer.id === 0
      let chosenIndex
      if (isUser && typeof action.index === 'number') chosenIndex = Math.min(Math.max(action.index, 0), source.hand.length - 1)
      else if (!isUser) chosenIndex = Math.floor(Math.random() * source.hand.length)
      else return state
      const newPlayers = players.map((p) => ({ ...p, hand: [...p.hand] }))
      const newSource = newPlayers[neighbor], newTarget = newPlayers[current]
      const [card] = newSource.hand.splice(chosenIndex, 1)
      const beforeHand = [...newTarget.hand]
      newTarget.hand.push(card)
      const createdPair = card.rank !== 'JOKER' && beforeHand.some((c) => c.rank === card.rank)
      newTarget.hand = removePairs(newTarget.hand)
      for (let i = 0; i < newPlayers.length; i += 1) { if (newPlayers[i].hand.length === 0) newPlayers[i].out = true }
      const stillActive = newPlayers.filter((p) => !p.out && p.hand.length > 0)
      if (stillActive.length === 1) {
        const loser = stillActive[0], loserIndex = newPlayers.findIndex((p) => p.id === loser.id)
        return { players: newPlayers, current, status: 'finished', loserIndex, pairInfo: createdPair ? { playerId: newTarget.id, rank: card.rank } : null, jokerInfo: card.rank === 'JOKER' ? { playerId: newTarget.id } : null }
      }
      return { players: newPlayers, current: nextActiveIndex(newPlayers, current), status: 'playing', loserIndex: null, pairInfo: createdPair ? { playerId: newTarget.id, rank: card.rank } : null, jokerInfo: card.rank === 'JOKER' ? { playerId: newTarget.id } : null }
    }
    case 'CLEAR_PAIR_ANIM': return { ...state, pairInfo: null }
    case 'SHUFFLE_HAND': {
      const newPlayers = state.players.map((p) => ({ ...p, hand: [...p.hand] }))
      newPlayers[0].hand = shuffle(newPlayers[0].hand)
      return { ...state, players: newPlayers }
    }
    case 'CLEAR_JOKER_ANIM': return { ...state, jokerInfo: null }
    default: return state
  }
}

/* ── Card face component ── */
function CardFace({ card, size = 'md', glow = false, selected = false, onClick, canClick = false }) {
  const isJoker = card.rank === 'JOKER'
  const isRed = RED_SUITS.includes(card.suit)
  const sizes = {
    sm: { w: 36, h: 52, rank: 10, suit: 11 },
    md: { w: 52, h: 72, rank: 14, suit: 14 },
    lg: { w: 64, h: 90, rank: 16, suit: 16 },
  }
  const s = sizes[size]
  return (
    <motion.div
      onClick={canClick ? onClick : undefined}
      whileHover={canClick ? { y: -10, scale: 1.08 } : {}}
      whileTap={canClick ? { scale: 0.95 } : {}}
      style={{
        width: s.w, height: s.h, borderRadius: 8, flexShrink: 0,
        background: isJoker
          ? 'linear-gradient(135deg,#1a0030,#3d0060,#1a0030)'
          : 'linear-gradient(160deg,#fdfaf0,#f5f0e0)',
        border: selected
          ? '2px solid #F1C40F'
          : isJoker ? '1px solid rgba(192,57,43,0.7)' : '1px solid rgba(200,180,120,0.5)',
        boxShadow: selected
          ? '0 0 20px rgba(241,196,15,0.9), 0 6px 20px rgba(0,0,0,0.6)'
          : glow
          ? '0 0 18px rgba(192,57,43,0.7), 0 4px 12px rgba(0,0,0,0.5)'
          : '0 4px 12px rgba(0,0,0,0.5)',
        cursor: canClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 3px', position: 'relative', overflow: 'hidden',
      }}
    >
      {isJoker ? (
        <>
          <span style={{ fontSize: s.suit, alignSelf: 'flex-start', lineHeight: 1 }}>🃏</span>
          <span style={{ fontSize: s.rank + 4, lineHeight: 1 }}>🃏</span>
          <span style={{ fontSize: s.suit, alignSelf: 'flex-end', lineHeight: 1, transform: 'rotate(180deg)' }}>🃏</span>
          {/* red glow overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle,rgba(192,57,43,0.15),transparent 70%)', borderRadius: 7, pointerEvents: 'none' }} />
        </>
      ) : (
        <>
          <div style={{ alignSelf: 'flex-start', lineHeight: 1, textAlign: 'left' }}>
            <div style={{ fontSize: s.rank, fontWeight: 700, color: isRed ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.rank}</div>
            <div style={{ fontSize: s.suit - 1, color: isRed ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.suit}</div>
          </div>
          <div style={{ fontSize: s.suit + 4, color: isRed ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.suit}</div>
          <div style={{ alignSelf: 'flex-end', lineHeight: 1, textAlign: 'right', transform: 'rotate(180deg)' }}>
            <div style={{ fontSize: s.rank, fontWeight: 700, color: isRed ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.rank}</div>
            <div style={{ fontSize: s.suit - 1, color: isRed ? '#c0392b' : '#1a1a2e', lineHeight: 1 }}>{card.suit}</div>
          </div>
        </>
      )}
      {selected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(241,196,15,0.08)', borderRadius: 7, pointerEvents: 'none' }} />
      )}
    </motion.div>
  )
}

/* ── Card back ── */
function CardBack({ size = 'md', highlighted = false, selected = false, onClick, canClick = false }) {
  const sizes = { sm: { w: 36, h: 52 }, md: { w: 48, h: 68 }, lg: { w: 60, h: 84 } }
  const s = sizes[size]
  return (
    <motion.div
      onClick={canClick ? onClick : undefined}
      whileHover={canClick ? { y: -14, scale: 1.1 } : {}}
      whileTap={canClick ? { scale: 0.95 } : {}}
      style={{
        width: s.w, height: s.h, borderRadius: 8, flexShrink: 0,
        background: 'linear-gradient(135deg,#1a0a2e,#2d1060,#1a0a2e)',
        border: selected ? '2px solid #F1C40F' : highlighted ? '1px solid rgba(192,57,43,0.6)' : '1px solid rgba(142,68,173,0.4)',
        boxShadow: selected
          ? '0 0 22px rgba(241,196,15,0.9), 0 8px 20px rgba(0,0,0,0.7)'
          : highlighted ? '0 0 16px rgba(192,57,43,0.5), 0 6px 16px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.5)',
        cursor: canClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* card back pattern */}
      <div style={{
        position: 'absolute', inset: 4, borderRadius: 5,
        border: '1px solid rgba(241,196,15,0.25)',
        background: 'repeating-linear-gradient(45deg,rgba(241,196,15,0.04) 0px,rgba(241,196,15,0.04) 2px,transparent 2px,transparent 8px)',
      }} />
      <span style={{ fontSize: 14, position: 'relative', zIndex: 1, opacity: 0.6 }}>🃏</span>
      {selected && <div style={{ position: 'absolute', inset: 0, background: 'rgba(241,196,15,0.1)', borderRadius: 7 }} />}
    </motion.div>
  )
}

/* ── Bot player card ── */
function BotPlayer({ player, isCurrent }) {
  return (
    <motion.div
      animate={{
        boxShadow: isCurrent ? '0 0 30px rgba(241,196,15,0.6)' : '0 0 0 rgba(0,0,0,0)',
        borderColor: isCurrent ? 'rgba(241,196,15,0.7)' : 'rgba(241,196,15,0.15)',
      }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        borderRadius: 16, padding: '12px 16px', minWidth: 120,
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(241,196,15,0.15)',
        backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}
    >
      {/* avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: player.out ? 'rgba(255,255,255,0.05)' : isCurrent ? 'linear-gradient(135deg,#5b1fa0,#8e44ad)' : 'rgba(241,196,15,0.1)',
        border: isCurrent ? '2px solid rgba(241,196,15,0.6)' : '1px solid rgba(241,196,15,0.2)',
        fontSize: 16, opacity: player.out ? 0.4 : 1,
        boxShadow: isCurrent ? '0 0 12px rgba(241,196,15,0.4)' : 'none',
      }}>
        🤖
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Perpetua, Georgia, serif', fontSize: 13, color: player.out ? 'rgba(241,196,15,0.3)' : '#F1C40F', lineHeight: 1 }}>
          {player.name}
        </p>
        {player.out && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Selamat!</p>}
        {isCurrent && !player.out && (
          <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ fontSize: 10, color: 'rgba(241,196,15,0.8)', marginTop: 2 }}>Berpikir...</motion.p>
        )}
      </div>

      {/* card backs */}
      {!player.out && player.hand.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {player.hand.slice(0, 7).map((_, idx) => (
            <div key={idx} style={{ marginLeft: idx === 0 ? 0 : -14 }}>
              <CardBack size="sm" highlighted={isCurrent} />
            </div>
          ))}
          {player.hand.length > 7 && (
            <span style={{ fontSize: 9, color: 'rgba(241,196,15,0.5)', marginLeft: 4, alignSelf: 'center' }}>+{player.hand.length - 7}</span>
          )}
        </div>
      )}
      {!player.out && (
        <p style={{ fontSize: 10, color: 'rgba(241,196,15,0.5)' }}>{player.hand.length} kartu</p>
      )}
    </motion.div>
  )
}

export function GamePage() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [shuffling, setShuffling] = useState(true)

  const { user, refreshProfile } = useAuth()
  useEffect(() => {
    console.log("STATS DEBUG:", state.status, user?.id)
    console.log('STATUS CHECK:', state.status, 'USER:', user?.id)
    if (state.status !== 'finished' || !user) return
    const loser = state.players[state.loserIndex]
    const iLost = loser?.id === 0
    const run = async () => {
      const { data, error } = await supabase.from('profiles').select('games_played,games_won,games_lost').eq('id', user.id).single()
      console.log("SUPABASE DATA:", data, "ERROR:", error)
      if (!data) return
      const { error: updateError } = await supabase.from('profiles').update({
        games_played: (data.games_played || 0) + 1,
        games_won: (data.games_won || 0) + (iLost ? 0 : 1),
        games_lost: (data.games_lost || 0) + (iLost ? 1 : 0),
      }).eq('id', user.id)
      console.log("UPDATE ERROR:", updateError)
      refreshProfile()
    }
    run()
  }, [state.status, user])
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    const id = setTimeout(() => { dispatch({ type: 'INIT' }); setShuffling(false) }, 1800)
    return () => clearTimeout(id)
  }, [])

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
    dispatch({ type: 'DRAW', index: selectedIndex })
    setSelectedIndex(null)
  }

  const handleRestart = () => {
    setSelectedIndex(null); setShuffling(true)
    const id = setTimeout(() => { dispatch({ type: 'INIT' }); setShuffling(false) }, 1000)
    return () => clearTimeout(id)
  }

  const isMyTurn = state.status === 'playing' && currentPlayer?.id === 0

  return (
    <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 500 }}>

      {/* ── Background felt table ── */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 50%,rgba(10,40,20,0.9) 0%,rgba(5,20,10,0.95) 60%,rgba(0,0,0,0.98) 100%)',
      }}>
        {/* felt texture lines */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px)' }} />
        {/* oval table edge */}
        <div style={{ position: 'absolute', inset: 12, borderRadius: 'inherit', border: '2px solid rgba(241,196,15,0.12)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }} />
        {/* center glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%,rgba(20,80,40,0.3) 0%,transparent 65%)' }} />
      </div>

      {/* ── Shuffling overlay ── */}
      <AnimatePresence>
        {shuffling && (
          <motion.div style={{ position: 'absolute', inset: 0, zIndex: 30, borderRadius: 16, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position: 'relative', width: 200, height: 100 }}>
              {[0,1,2,3,4].map((i) => (
                <motion.div key={i}
                  style={{ position: 'absolute', left: '50%', top: '50%', width: 48, height: 68, borderRadius: 8,
                    background: 'linear-gradient(135deg,#1a0a2e,#2d1060)', border: '1px solid rgba(241,196,15,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}
                  initial={{ rotate: -20 + i * 10, x: -24 + (-60 + i * 30), y: -34, opacity: 0 }}
                  animate={{ rotate: [-20 + i * 10, 10 - i * 5, -10 + i * 8], x: [-24 + (-60 + i * 30), -24, -24 + (-10 + i * 5)], opacity: [0, 1, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: i * 0.06 }}>
                  🃏
                </motion.div>
              ))}
            </div>
            <p style={{ fontFamily: 'Perpetua, Georgia, serif', fontSize: 18, color: '#F1C40F', textShadow: '0 0 12px rgba(241,196,15,0.5)', letterSpacing: '0.2em' }}>
              Mengocok Kartu...
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#F1C40F' }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAIR animation ── */}
      <AnimatePresence>
        {isPairForUser && (
          <motion.div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1].map(i => (
                  <motion.div key={i} animate={{ x: i === 0 ? [-6, 6, 0] : [6, -6, 0], y: [0, -8, 0] }} transition={{ duration: 0.5 }}
                    style={{ width: 52, height: 72, borderRadius: 8, background: 'linear-gradient(160deg,#fdfaf0,#f5f0e0)', border: '2px solid #F1C40F',
                      boxShadow: '0 0 24px rgba(241,196,15,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Perpetua,Georgia,serif', fontSize: 22, fontWeight: 700, color: '#c0392b' }}>
                    {state.pairInfo?.rank}
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ borderRadius: 9999, padding: '6px 20px', background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(241,196,15,0.5)',
                  fontSize: 13, fontWeight: 700, color: '#F1C40F', letterSpacing: '0.15em', boxShadow: '0 0 16px rgba(241,196,15,0.4)' }}>
                ✨ PASANGAN DITEMUKAN!
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── JOKER animation ── */}
      <AnimatePresence>
        {isJokerForUser && (
          <motion.div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(192,57,43,0.12)', borderRadius: 16 }} />
            <motion.div initial={{ scale: 0.7, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.7 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
              <motion.div animate={{ rotate: [-3, 3, -3], y: [0, -6, 0] }} transition={{ duration: 0.8, repeat: 2 }}
                style={{ width: 80, height: 112, borderRadius: 12, background: 'linear-gradient(135deg,#1a0030,#3d0060)',
                  border: '2px solid #e74c3c', boxShadow: '0 0 50px rgba(192,57,43,0.9), 0 0 100px rgba(192,57,43,0.4)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 36 }}>🃏</span>
                <span style={{ fontSize: 11, color: '#F1C40F', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Joker</span>
              </motion.div>
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ borderRadius: 9999, padding: '8px 24px', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(192,57,43,0.6)',
                  fontSize: 14, fontWeight: 700, color: '#e74c3c', letterSpacing: '0.1em', boxShadow: '0 0 20px rgba(192,57,43,0.5)' }}>
                😈 KAMU DAPAT JOKER!
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Perpetua,Georgia,serif', fontSize: 28, color: '#F1C40F', textShadow: '0 0 16px rgba(241,196,15,0.4)', lineHeight: 1 }}>
              Joker Card
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(241,196,15,0.5)', marginTop: 2 }}>Hindari menjadi pemegang Joker terakhir.</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentPlayer?.id ?? 'idle'}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              style={{
                borderRadius: 9999, padding: '6px 16px', fontSize: 12, fontWeight: 600,
                background: isMyTurn ? 'rgba(241,196,15,0.15)' : 'rgba(0,0,0,0.4)',
                border: isMyTurn ? '1px solid rgba(241,196,15,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: isMyTurn ? '#F1C40F' : 'rgba(255,255,255,0.5)',
                boxShadow: isMyTurn ? '0 0 12px rgba(241,196,15,0.3)' : 'none',
              }}>
              {state.status === 'finished' ? '🏁 Permainan Selesai'
                : isMyTurn ? '⚡ Giliranmu — Ambil 1 kartu!'
                : currentPlayer ? `⏳ Giliran ${currentPlayer.name}...` : ''}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bots row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {state.players.filter((p) => p.id !== 0).map((p) => (
            <BotPlayer key={p.id} player={p} isCurrent={currentPlayer?.id === p.id} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.2),transparent)', margin: '0 24px' }} />

        {/* Neighbor cards — pick area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontFamily: 'Perpetua,Georgia,serif', fontSize: 14, color: 'rgba(241,196,15,0.7)' }}>
            {isMyTurn ? '👇 Pilih 1 kartu dari pemain sebelah kiri' : 'Kartu pemain sebelah kiri'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {neighborPlayer && neighborPlayer.hand.map((_, idx) => {
              const isSelected = selectedIndex === idx
              return (
                <div key={`${neighborPlayer.id}-${idx}`} style={{ marginLeft: idx === 0 ? 0 : -10 }}>
                  <CardBack size="md" selected={isSelected} canClick={isMyTurn}
                    highlighted={isMyTurn} onClick={() => isMyTurn && setSelectedIndex(idx)} />
                </div>
              )
            })}
            {!neighborPlayer && (
              <p style={{ fontSize: 12, color: 'rgba(241,196,15,0.4)' }}>Tidak ada pemain aktif di kiri.</p>
            )}
          </div>
          {selectedIndex != null && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 11, color: 'rgba(241,196,15,0.7)' }}>
              Kartu #{selectedIndex + 1} dipilih — klik Ambil untuk konfirmasi
            </motion.p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(241,196,15,0.2),transparent)', margin: '0 24px' }} />

        {/* Player's hand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontFamily: 'Perpetua,Georgia,serif', fontSize: 14, color: '#F1C40F' }}>
            🃏 Kartu Kamu ({state.players[0]?.hand.length ?? 0})
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button type="button"
              onClick={() => dispatch({ type: 'SHUFFLE_HAND' })}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                borderRadius: 9999, padding: '8px 16px', fontSize: 13, fontWeight: 700, border: '1px solid rgba(241,196,15,0.3)',
                background: 'rgba(241,196,15,0.08)', color: 'rgba(241,196,15,0.8)', cursor: 'pointer',
              }}>
              🔀 Kocok
            </motion.button>
            <motion.button type="button" onClick={handleConfirmDraw}
              disabled={!isMyTurn || selectedIndex == null || shuffling}
              whileHover={isMyTurn && selectedIndex != null ? { scale: 1.05 } : {}}
              whileTap={isMyTurn && selectedIndex != null ? { scale: 0.95 } : {}}
              style={{
                borderRadius: 9999, padding: '8px 24px', fontSize: 13, fontWeight: 700, border: 'none',
                background: isMyTurn && selectedIndex != null ? 'linear-gradient(135deg,#a93226,#e74c3c)' : 'rgba(255,255,255,0.06)',
                color: isMyTurn && selectedIndex != null ? '#fff' : 'rgba(255,255,255,0.25)',
                boxShadow: isMyTurn && selectedIndex != null ? '0 0 20px rgba(192,57,43,0.6)' : 'none',
                cursor: isMyTurn && selectedIndex != null ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', letterSpacing: '0.08em',
              }}>
              Ambil Kartu →
            </motion.button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {state.players[0]?.hand.map((card) => (
              <CardFace key={card.id} card={card} size="md" glow={card.rank === 'JOKER'} />
            ))}
            {state.players[0]?.hand.length === 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ fontSize: 13, color: 'rgba(241,196,15,0.5)', padding: '12px 0' }}>
                🎉 Kamu sudah bebas! Menunggu pemain lain...
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* ── GAME OVER MODAL ── */}
      <AnimatePresence>
        {state.status === 'finished' && state.loserIndex != null && (
          <motion.div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(() => {
              const loser = state.players[state.loserIndex]
              const loserIsYou = loser?.id === 0
              return (
                <motion.div initial={{ scale: 0.75, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.75, y: 30 }}
                  style={{ width: '100%', maxWidth: 420, borderRadius: 24, padding: 32, textAlign: 'center',
                    background: 'linear-gradient(160deg,rgba(5,3,1,0.98),rgba(20,10,5,0.98))',
                    border: loserIsYou ? '1px solid rgba(192,57,43,0.5)' : '1px solid rgba(241,196,15,0.4)',
                    boxShadow: loserIsYou ? '0 0 60px rgba(192,57,43,0.4)' : '0 0 60px rgba(241,196,15,0.3)' }}>

                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.35em', color: 'rgba(241,196,15,0.5)', marginBottom: 8 }}>Game Over</p>

                  <h2 style={{ fontFamily: 'Perpetua,Georgia,serif', fontSize: 32, lineHeight: 1, marginBottom: 8,
                    color: loserIsYou ? '#e74c3c' : '#F1C40F',
                    textShadow: loserIsYou ? '0 0 20px rgba(192,57,43,0.7)' : '0 0 20px rgba(241,196,15,0.6)' }}>
                    {loserIsYou ? 'Kamu Kalah! 😈' : 'Kamu Menang! 🎉'}
                  </h2>

                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                    {loserIsYou ? 'Kamu adalah pemegang Joker terakhir.' : `${loser?.name} adalah pemegang Joker terakhir.`}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <motion.div animate={{ rotate: [0, -5, 5, 0], y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 80, height: 112, borderRadius: 12, background: 'linear-gradient(135deg,#1a0030,#3d0060)',
                        border: '2px solid #e74c3c', boxShadow: '0 0 40px rgba(192,57,43,0.8)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <span style={{ fontSize: 36 }}>🃏</span>
                      <span style={{ fontSize: 11, color: '#F1C40F', letterSpacing: '0.2em' }}>JOKER</span>
                    </motion.div>
                  </div>

                  {/* scores */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {state.players.map(p => (
                      <div key={p.id} style={{ borderRadius: 12, padding: '8px 14px', textAlign: 'center', minWidth: 70,
                        background: p.id === state.loserIndex ? 'rgba(192,57,43,0.15)' : 'rgba(241,196,15,0.08)',
                        border: p.id === state.loserIndex ? '1px solid rgba(192,57,43,0.4)' : '1px solid rgba(241,196,15,0.15)' }}>
                        <p style={{ fontSize: 11, color: p.id === state.loserIndex ? '#e74c3c' : 'rgba(241,196,15,0.7)', fontWeight: 600 }}>{p.name}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{p.id === state.loserIndex ? '🃏 Kalah' : '✓ Selamat'}</p>
                      </div>
                    ))}
                  </div>

                  <motion.button type="button" onClick={handleRestart}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ borderRadius: 9999, padding: '12px 36px', fontSize: 14, fontWeight: 700, border: 'none',
                      background: 'linear-gradient(135deg,#a93226,#e74c3c)', color: '#fff', cursor: 'pointer',
                      boxShadow: '0 0 24px rgba(192,57,43,0.6)', letterSpacing: '0.1em' }}>
                    Main Lagi
                  </motion.button>
                </motion.div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
