import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMultiplayer } from '../hooks/useMultiplayer.js'
import { useCoins } from '../hooks/useCoins.js'
import { supabase } from '../lib/supabase.js'

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const SUITS = ['♠','♥','♦','♣']
const RED_SUITS = ['♥','♦']

function buildDeck() {
  const deck = []; let id = 0
  for (const rank of RANKS) for (const suit of SUITS) deck.push({ id: `${id++}`, rank, suit })
  deck.push({ id: 'JOKER', rank: 'JOKER', suit: '🃏' })
  return deck
}
function shuffle(a) { const arr=[...a]; for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]} return arr }
function removePairs(hand) {
  const byRank = hand.reduce((acc,c) => { if(c.rank==='JOKER') return acc; acc[c.rank]=acc[c.rank]||[]; acc[c.rank].push(c); return acc },{})
  const remaining=[]; Object.values(byRank).forEach(g => { if(g.length%2===1) remaining.push(g[0]) })
  return [...remaining,...hand.filter(c=>c.rank==='JOKER')]
}
function nextActiveLeft(players, from) {
  const t=players.length; let idx=from
  for(let i=0;i<t;i++){idx=(idx-1+t)%t; const p=players[idx]; if(!p.out&&p.hand.length>0) return idx}
  return from
}
function leftNeighbor(players, from) {
  const t=players.length; let idx=from
  for(let i=0;i<t-1;i++){idx=(idx+1)%t; const p=players[idx]; if(!p.out&&p.hand.length>0) return idx}
  return null
}
function buildInitialState(playerList) {
  const deck=shuffle(buildDeck())
  const players=playerList.map((p,i)=>({ id:p.user_id, name:p.username, hand:[], out:false, seat:i }))
  const copy=[...deck]; let idx=0
  while(copy.length>0){ players[idx].hand.push(copy.pop()); idx=(idx+1)%players.length }
  const withPairs=players.map(p=>{ const cleaned=removePairs(p.hand); return {...p,hand:cleaned,out:cleaned.length===0} })
  return { players:withPairs, current:0, status:'playing', loserIndex:null }
}

/* ── STYLES ── */
const mpStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');

  @keyframes mp-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes mp-orbFloat {
    0%, 100% { transform: translateY(0px); opacity: 0.35; }
    50% { transform: translateY(-15px); opacity: 0.55; }
  }
  @keyframes mp-pulse-border {
    0%, 100% { border-color: rgba(241,196,15,0.4); box-shadow: 0 0 20px rgba(241,196,15,0.2); }
    50% { border-color: rgba(241,196,15,0.85); box-shadow: 0 0 40px rgba(241,196,15,0.45); }
  }
  @keyframes mp-jokerPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(192,57,43,0.6), 0 4px 16px rgba(0,0,0,0.7); }
    50% { box-shadow: 0 0 55px rgba(192,57,43,1), 0 0 90px rgba(192,57,43,0.25), 0 4px 16px rgba(0,0,0,0.7); }
  }
  @keyframes mp-cardGlow {
    0%, 100% { box-shadow: 0 0 18px rgba(241,196,15,0.45), 0 4px 14px rgba(0,0,0,0.7); }
    50% { box-shadow: 0 0 40px rgba(241,196,15,0.85), 0 0 70px rgba(241,196,15,0.2), 0 4px 14px rgba(0,0,0,0.7); }
  }
  @keyframes mp-borderPulse {
    0%, 100% { border-color: rgba(241,196,15,0.35); }
    50% { border-color: rgba(241,196,15,0.8); box-shadow: 0 0 14px rgba(241,196,15,0.25); }
  }
  @keyframes mp-coin-pop {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  .mp-card-hover:hover {
    transform: translateY(-18px) scale(1.14) !important;
    z-index: 10 !important;
    filter: brightness(1.05) !important;
  }
  .mp-neighbor-hover:hover {
    transform: translateY(-20px) scale(1.18) !important;
    z-index: 10 !important;
    filter: brightness(1.08) !important;
  }
  .mp-scrollbar::-webkit-scrollbar { width: 4px; }
  .mp-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
  .mp-scrollbar::-webkit-scrollbar-thumb { background: rgba(241,196,15,0.2); border-radius: 2px; }
  @keyframes mp-btn-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
`

/* ── PREMIUM SVG ICONS (zero emoji) ── */
const IcoBolt = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IcoHourglass = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3h14M5 21h14M8 8h8l-1 4H9L8 8z"/>
  </svg>
)
const IcoShuffle = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/>
    <line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/>
    <line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
)
const IcoReplay = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
  </svg>
)
const IcoHome = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IcoPickArrow = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>
)
const IcoCards = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="13" height="18" rx="2"/>
    <path d="M5 7h7M5 10.5h7M5 14h4"/>
    <rect x="9" y="7" width="13" height="18" rx="2" strokeOpacity="0.35"/>
  </svg>
)
const IcoCrown = ({ size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 17l4-10 4 6 2-8 2 8 4-6 4 10H2z"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IcoPerson = ({ size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M4 21v-1a8 8 0 0116 0v1"/>
  </svg>
)
const IcoCheckCircle = ({ size=10, color='rgba(39,174,96,0.75)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const IcoSkull = ({ size=32, color='#e74c3c' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a7 7 0 017 7c0 3.5-2 5.5-2 7H7c0-1.5-2-3.5-2-7a7 7 0 017-7z"/>
    <path d="M9 17v2a1 1 0 001 1h4a1 1 0 001-1v-2"/>
    <circle cx="9" cy="12" r="1.2" fill={color} stroke="none"/>
    <circle cx="15" cy="12" r="1.2" fill={color} stroke="none"/>
  </svg>
)
const IcoStar = ({ size=32, color='#F1C40F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"/>
    <path d="M5 21h14"/>
  </svg>
)
const IcoX = ({ size=9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoCheck = ({ size=9, color='rgba(39,174,96,0.75)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const IcoShield = ({ size=20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(39,174,96,0.8)" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const IcoRocket = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c0 0 4 3 4 9H8c0-6 4-9 4-9z"/>
    <path d="M8 11v5l-2 3h12l-2-3v-5"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>
)
const IcoDoor = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const IcoChat = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const IcoCopy = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)
const IcoTrophy = ({ size=20, color='#F1C40F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4a2 2 0 01-2-2V5h4"/>
    <path d="M18 9h2a2 2 0 002-2V5h-4"/>
    <path d="M12 17c-2.8 0-5-2.2-5-5V5h10v7c0 2.8-2.2 5-5 5z"/>
    <path d="M12 17v3M8 21h8"/>
  </svg>
)

/* ── Coin SVG inline ── */
const IcoCoinInline = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="url(#mpCoinGrad)" stroke="rgba(241,196,15,0.5)" strokeWidth="1"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="rgba(241,196,15,0.2)" strokeWidth="0.8"/>
    <text x="12" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="rgba(100,65,0,0.9)" fontFamily="serif">₿</text>
    <defs>
      <radialGradient id="mpCoinGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFE566"/>
        <stop offset="50%" stopColor="#F1C40F"/>
        <stop offset="100%" stopColor="#B8860B"/>
      </radialGradient>
    </defs>
  </svg>
)

/* ── Multiplayer opponent avatars ── */
const PlayerAvatars = [
  ({ size=20, color='currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 3 6 3 10v4c0 2 1 4 3 5l2 1h8l2-1c2-1 3-3 3-5v-4c0-4-3.5-8-9-8z"/>
      <path d="M9 13c0 0 1 1.5 3 1.5s3-1.5 3-1.5"/>
      <line x1="8" y1="10" x2="10" y2="10" strokeWidth="2"/>
      <line x1="14" y1="10" x2="16" y2="10" strokeWidth="2"/>
    </svg>
  ),
  ({ size=20, color='currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/>
      <line x1="11" y1="10" x2="13" y2="10"/><line x1="5" y1="10" x2="3" y2="8"/>
      <line x1="19" y1="10" x2="21" y2="8"/>
      <path d="M6 16c0 0 2 2 6 2s6-2 6-2"/>
    </svg>
  ),
  ({ size=20, color='currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6v6c0 5 4 9 8 10 4-1 8-5 8-10V6l-8-4z"/>
      <path d="M12 8v8M8 12h8" strokeOpacity="0.6"/>
    </svg>
  ),
  ({ size=20, color='currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="1" fill={color} stroke="none"/>
    </svg>
  ),
]

function CardFace({ card, size='md', glow=false }) {
  const isJoker=card.rank==='JOKER', isRed=RED_SUITS.includes(card.suit)
  const s={ sm:{w:36,h:52,r:10,st:10}, md:{w:52,h:74,r:14,st:14}, lg:{w:64,h:90,r:17,st:16} }[size]
  return (
    <div style={{
      width:s.w, height:s.h, borderRadius:9, flexShrink:0,
      background:isJoker?'linear-gradient(145deg,#0d0020,#2a0050)':'linear-gradient(160deg,#fdfaf0,#f7f0de,#ede0c0)',
      border:isJoker?'1.5px solid rgba(220,50,50,0.85)':'1px solid rgba(190,160,100,0.55)',
      boxShadow:glow||isJoker
        ?'0 0 24px rgba(200,50,43,0.9), 0 0 48px rgba(200,50,43,0.25), 0 4px 14px rgba(0,0,0,0.7)'
        :'0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between',
      padding:'4px 3px', position:'relative', overflow:'hidden',
      animation: isJoker ? 'mp-jokerPulse 2s ease-in-out infinite' : 'none',
    }}>
      {!isJoker && (
        <div style={{position:'absolute',inset:0,borderRadius:8,pointerEvents:'none',
          background:'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.012) 4px,rgba(0,0,0,0.012) 5px)'}}/>
      )}
      {isJoker?(
        <>
          <span style={{fontSize:s.st,alignSelf:'flex-start',filter:'drop-shadow(0 0 6px rgba(255,100,100,0.8))'}}>🃏</span>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <span style={{fontSize:s.r+5,filter:'drop-shadow(0 0 10px rgba(255,80,80,1))'}}>🃏</span>
            <span style={{fontSize:6,color:'rgba(255,180,180,0.75)',letterSpacing:'0.2em',fontFamily:'Cinzel,serif'}}>JOKER</span>
          </div>
          <span style={{fontSize:s.st,alignSelf:'flex-end',transform:'rotate(180deg)',filter:'drop-shadow(0 0 6px rgba(255,100,100,0.8))'}}>🃏</span>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 50%,rgba(200,50,50,0.22),transparent 70%)',borderRadius:8,pointerEvents:'none'}}/>
        </>
      ):(
        <>
          <div style={{alignSelf:'flex-start'}}>
            <div style={{fontSize:s.r,fontWeight:800,color:isRed?'#c0392b':'#111827',lineHeight:1,fontFamily:'Cinzel,serif'}}>{card.rank}</div>
            <div style={{fontSize:s.st-1,color:isRed?'#c0392b':'#111827',lineHeight:1}}>{card.suit}</div>
          </div>
          <div style={{fontSize:s.st+5,color:isRed?'#c0392b':'#111827',lineHeight:1,filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.15))'}}>{card.suit}</div>
          <div style={{alignSelf:'flex-end',transform:'rotate(180deg)'}}>
            <div style={{fontSize:s.r,fontWeight:800,color:isRed?'#c0392b':'#111827',lineHeight:1,fontFamily:'Cinzel,serif'}}>{card.rank}</div>
            <div style={{fontSize:s.st-1,color:isRed?'#c0392b':'#111827',lineHeight:1}}>{card.suit}</div>
          </div>
        </>
      )}
    </div>
  )
}

function CardBack({ size='md', selected=false, canClick=false, onClick }) {
  const s={ sm:{w:34,h:50}, md:{w:48,h:68}, lg:{w:60,h:84} }[size]
  return (
    <motion.div onClick={canClick?onClick:undefined}
      className={canClick?'mp-neighbor-hover':''}
      whileTap={canClick?{scale:0.93}:{}}
      style={{
        width:s.w, height:s.h, borderRadius:9, flexShrink:0, cursor:canClick?'pointer':'default',
        background:selected?'linear-gradient(145deg,#2a0a50,#4a1a80)':'linear-gradient(145deg,#140830,#26105a,#1c0c40)',
        border:selected?'2px solid #F1C40F':'1px solid rgba(120,60,200,0.4)',
        boxShadow:selected
          ?'0 0 32px rgba(241,196,15,1),0 0 64px rgba(241,196,15,0.4),0 8px 24px rgba(0,0,0,0.8)'
          :canClick
          ?'0 0 14px rgba(200,60,60,0.3), 0 4px 14px rgba(0,0,0,0.6)'
          :'0 4px 14px rgba(0,0,0,0.6)',
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden',
        transition:'box-shadow 0.2s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        animation: canClick && !selected ? 'mp-borderPulse 2s ease-in-out infinite' : 'none',
      }}>
      <div style={{position:'absolute',inset:5,borderRadius:5,border:'1px solid rgba(241,196,15,0.3)'}}/>
      <div style={{position:'absolute',inset:8,borderRadius:3,
        background:'repeating-linear-gradient(45deg,rgba(241,196,15,0.05) 0px,rgba(241,196,15,0.05) 2px,transparent 2px,transparent 7px)'}}/>
      <div style={{width:16,height:16,border:'1px solid rgba(241,196,15,0.4)',transform:'rotate(45deg)',
        position:'relative',zIndex:1,background:'rgba(241,196,15,0.05)',boxShadow:'0 0 6px rgba(241,196,15,0.12)'}}>
        <div style={{position:'absolute',inset:3,border:'1px solid rgba(241,196,15,0.25)'}}/>
      </div>
      {canClick && (
        <motion.div style={{
          position:'absolute',inset:0,borderRadius:8,pointerEvents:'none',
          background:'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.05) 50%,transparent 70%)',
          backgroundSize:'200% 100%',
        }}
          animate={{backgroundPosition:['-200% 0','200% 0']}}
          transition={{duration:2,repeat:Infinity,ease:'linear'}}/>
      )}
      {selected&&<div style={{position:'absolute',inset:0,background:'rgba(241,196,15,0.13)',borderRadius:8}}/>}
    </motion.div>
  )
}

function PairAnimation({ pairRank }) {
  return (
    <motion.div
      style={{position:'absolute',inset:0,zIndex:20,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(241,196,15,0.1),transparent 70%)',borderRadius:20}}/>
      {[...Array(6)].map((_,i)=>(
        <motion.div key={i} style={{position:'absolute',left:`${30+i*7}%`,top:'45%',width:4,height:4,borderRadius:'50%',background:'#F1C40F',boxShadow:'0 0 8px rgba(241,196,15,0.9)'}}
          animate={{y:[0,-90],opacity:[1,0],scale:[1,0]}} transition={{duration:0.9,delay:i*0.08}}/>
      ))}
      <motion.div initial={{scale:0.5,y:20}} animate={{scale:1,y:0}} exit={{scale:0.5,y:20}}
        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        <div style={{display:'flex',gap:10}}>
          {[0,1].map(i=>(
            <motion.div key={i}
              animate={{x:i===0?[-8,8,0]:[8,-8,0],y:[0,-14,0],rotate:i===0?[-5,5,0]:[5,-5,0]}}
              transition={{duration:0.6}}
              style={{width:58,height:80,borderRadius:10,background:'linear-gradient(160deg,#fffef5,#fff0b0)',border:'2.5px solid #F1C40F',
                boxShadow:'0 0 36px rgba(241,196,15,1),0 0 72px rgba(241,196,15,0.4)',
                display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Cinzel,serif',fontSize:26,fontWeight:900,color:'#c0392b'}}>
              {pairRank}
            </motion.div>
          ))}
        </div>
        <motion.div initial={{y:12,opacity:0}} animate={{y:0,opacity:1}}
          style={{borderRadius:9999,padding:'8px 24px',background:'linear-gradient(135deg,rgba(0,0,0,0.97),rgba(20,15,0,0.97))',
            border:'1px solid rgba(241,196,15,0.7)',fontSize:13,fontWeight:700,color:'#F1C40F',
            letterSpacing:'0.2em',fontFamily:'Cinzel,serif',boxShadow:'0 0 32px rgba(241,196,15,0.5)'}}>
          ✨ PASANGAN!
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function JokerAnimation() {
  return (
    <motion.div
      style={{position:'absolute',inset:0,zIndex:30,display:'flex',alignItems:'center',justifyContent:'center'}}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(192,57,43,0.18),transparent 65%)',borderRadius:20}}/>
      <motion.div animate={{y:['-100%','200%']}} transition={{duration:1.5,repeat:2}}
        style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 40%,rgba(192,57,43,0.08) 50%,transparent 60%)',pointerEvents:'none'}}/>
      {[...Array(6)].map((_,i)=>(
        <motion.div key={i} style={{position:'absolute',left:`${25+i*10}%`,top:'55%',width:4,height:4,borderRadius:'50%',background:'#e74c3c',boxShadow:'0 0 8px rgba(192,57,43,0.9)'}}
          animate={{y:[0,-100],opacity:[1,0],scale:[1,0]}} transition={{duration:1,delay:i*0.1}}/>
      ))}
      <motion.div initial={{scale:0.6,rotate:-15}} animate={{scale:1,rotate:0}} exit={{scale:0.6}}
        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,position:'relative',zIndex:1}}>
        <motion.div animate={{rotate:[-4,4,-4],y:[0,-8,0]}} transition={{duration:0.9,repeat:3}}
          style={{width:88,height:124,borderRadius:14,background:'linear-gradient(145deg,#0d0020,#2a0050)',border:'2.5px solid #e74c3c',
            boxShadow:'0 0 70px rgba(192,57,43,1),0 0 140px rgba(192,57,43,0.5),inset 0 0 30px rgba(192,57,43,0.25)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
          <span style={{fontSize:42,filter:'drop-shadow(0 0 14px rgba(255,80,80,1))'}}>🃏</span>
          <span style={{fontSize:10,color:'#F1C40F',letterSpacing:'0.3em',fontFamily:'Cinzel,serif',textTransform:'uppercase'}}>Joker</span>
        </motion.div>
        <motion.div initial={{y:14,opacity:0}} animate={{y:0,opacity:1}}
          style={{borderRadius:9999,padding:'10px 28px',background:'linear-gradient(135deg,rgba(0,0,0,0.97),rgba(30,5,5,0.97))',
            border:'1px solid rgba(192,57,43,0.8)',fontSize:14,fontWeight:700,color:'#e74c3c',
            letterSpacing:'0.15em',fontFamily:'Cinzel,serif',boxShadow:'0 0 36px rgba(192,57,43,0.6)',
            display:'flex',alignItems:'center',gap:10}}>
          <IcoSkull size={18} color="#e74c3c"/> DAPAT JOKER!
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function ChatPanel({ messages, onSend, username, onClose }) {
  const [text,setText]=useState('')
  const bottomRef=useRef(null)
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])
  const handleSend=()=>{ if(!text.trim()) return; onSend(text); setText('') }
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0,background:'linear-gradient(180deg,rgba(5,2,15,0.98),rgba(10,4,25,0.98))'}}>
      <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(241,196,15,0.1)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <motion.div style={{width:6,height:6,borderRadius:'50%',background:'rgba(39,174,96,0.8)'}}
            animate={{boxShadow:['0 0 4px rgba(39,174,96,0.4)','0 0 12px rgba(39,174,96,0.8)','0 0 4px rgba(39,174,96,0.4)']}}
            transition={{duration:2,repeat:Infinity}}/>
          <p style={{fontFamily:'Cinzel,serif',fontSize:12,color:'#F1C40F',letterSpacing:'0.1em',margin:0}}>Live Chat</p>
        </div>
        {onClose&&(
          <button type="button" onClick={onClose}
            style={{background:'none',border:'none',color:'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:14,lineHeight:1,
              width:24,height:24,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.2s'}}
            onMouseEnter={e=>e.target.style.background='rgba(255,255,255,0.06)'}
            onMouseLeave={e=>e.target.style.background='none'}>✕</button>
        )}
      </div>
      <div className="mp-scrollbar" style={{flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:8,minHeight:0}}>
        {messages.length===0&&(
          <div style={{textAlign:'center',marginTop:24,padding:'0 16px'}}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:8,opacity:0.3}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(241,196,15,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p style={{fontSize:11,color:'rgba(255,255,255,0.2)',fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>Belum ada pesan...</p>
          </div>
        )}
        {messages.map(msg=>(
          <div key={msg.id} style={{display:'flex',flexDirection:'column',alignItems:msg.username===username?'flex-end':'flex-start'}}>
            <p style={{fontSize:9,color:msg.username===username?'rgba(142,68,173,0.6)':'rgba(241,196,15,0.35)',marginBottom:3,fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>{msg.username}</p>
            <div style={{maxWidth:'85%',borderRadius:msg.username===username?'10px 10px 2px 10px':'10px 10px 10px 2px',
              padding:'7px 11px',fontSize:12,
              background:msg.username===username?'linear-gradient(135deg,rgba(91,31,160,0.5),rgba(142,68,173,0.4))':'rgba(255,255,255,0.06)',
              border:msg.username===username?'1px solid rgba(142,68,173,0.3)':'1px solid rgba(255,255,255,0.07)',
              color:'rgba(255,255,255,0.85)',wordBreak:'break-word',
              boxShadow:msg.username===username?'0 2px 12px rgba(91,31,160,0.2)':'none'}}>{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:'8px 10px',borderTop:'1px solid rgba(241,196,15,0.08)',display:'flex',gap:8,flexShrink:0}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleSend()}}
          placeholder="Ketik pesan..." maxLength={120}
          style={{flex:1,borderRadius:8,padding:'8px 12px',fontSize:12,background:'rgba(0,0,0,0.5)',
            border:'1px solid rgba(241,196,15,0.15)',color:'#fff',outline:'none',
            fontFamily:'system-ui,sans-serif',transition:'border-color 0.2s'}}
          onFocus={e=>e.target.style.borderColor='rgba(241,196,15,0.4)'}
          onBlur={e=>e.target.style.borderColor='rgba(241,196,15,0.15)'}/>
        <motion.button type="button" onClick={handleSend} whileHover={{scale:1.08}} whileTap={{scale:0.92}}
          style={{width:36,height:36,borderRadius:8,border:'none',cursor:'pointer',fontSize:14,
            background:'linear-gradient(135deg,#5b1fa0,#8e44ad)',color:'#fff',
            boxShadow:'0 0 14px rgba(142,68,173,0.5)',flexShrink:0}}>↑</motion.button>
      </div>
    </div>
  )
}

function WaitingRoom({ room, players, userId, isHost, onStart, onLeave, setReady, messages, onSendMessage, username }) {
  const myPlayer=players.find(p=>p.user_id===userId)
  const [copied,setCopied]=useState(false)
  const [showChat,setShowChat]=useState(false)

  const handleCopy=async()=>{
    await navigator.clipboard.writeText(room.room_code)
    setCopied(true); setTimeout(()=>setCopied(false),1500)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0,height:'100%'}}>
      <AnimatePresence>
        {showChat&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
            style={{position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.97)',display:'flex',flexDirection:'column'}}>
            <div style={{flex:1,overflow:'hidden'}}>
              <ChatPanel messages={messages} onSend={onSendMessage} username={username} onClose={()=>setShowChat(false)}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{display:'grid',gap:20,gridTemplateColumns:'1fr'}} className="lg-grid-chat">
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div>
            <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.4em',color:'rgba(241,196,15,0.4)',fontFamily:'Cinzel,serif',marginBottom:6}}>Multiplayer</p>
            <h2 style={{fontFamily:'Cinzel Decorative,Georgia,serif',fontSize:26,color:'#F1C40F',
              textShadow:'0 0 24px rgba(241,196,15,0.6),0 0 48px rgba(241,196,15,0.2)',margin:0,letterSpacing:'0.03em'}}>Ruang Tunggu</h2>
          </div>

          <div style={{borderRadius:18,padding:'18px 22px',
            background:'linear-gradient(145deg,rgba(5,2,15,0.97),rgba(12,5,30,0.92))',
            border:'1px solid rgba(241,196,15,0.22)',
            boxShadow:'0 8px 32px rgba(0,0,0,0.4),inset 0 0 30px rgba(241,196,15,0.02)',
            position:'relative',overflow:'hidden'}}>
            <motion.div animate={{x:['-100%','200%']}} transition={{duration:3,repeat:Infinity,delay:2}}
              style={{position:'absolute',top:0,left:0,right:0,height:1,
                background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.6),transparent)'}}/>
            <div style={{position:'absolute',top:0,right:0,width:60,height:60,pointerEvents:'none',
              background:'radial-gradient(circle at 100% 0%,rgba(241,196,15,0.06),transparent 70%)'}}/>
            <p style={{fontSize:9,color:'rgba(241,196,15,0.4)',marginBottom:12,fontFamily:'Cinzel,serif',letterSpacing:'0.2em',textTransform:'uppercase'}}>Kode Room</p>
            <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              <p style={{fontFamily:'Cinzel Decorative,Georgia,serif',fontSize:38,letterSpacing:'0.5em',color:'#F1C40F',
                textShadow:'0 0 28px rgba(241,196,15,0.6)',margin:0}}>{room.room_code}</p>
              <motion.button type="button" onClick={handleCopy} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                style={{borderRadius:10,padding:'7px 16px',fontSize:11,fontWeight:700,cursor:'pointer',
                  fontFamily:'Cinzel,serif',letterSpacing:'0.08em',
                  background:copied?'rgba(39,174,96,0.2)':'rgba(241,196,15,0.1)',
                  color:copied?'#27ae60':'rgba(241,196,15,0.8)',
                  border:`1px solid ${copied?'rgba(39,174,96,0.4)':'rgba(241,196,15,0.22)'}`,
                  transition:'all 0.2s'}}>
                {copied
                  ? <span style={{display:'flex',alignItems:'center',gap:6}}><IcoCheckCircle size={11} color="#27ae60"/> Tersalin</span>
                  : <span style={{display:'flex',alignItems:'center',gap:6}}><IcoCopy size={11}/> Salin</span>
                }
              </motion.button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
              <div style={{flex:1,height:3,borderRadius:9999,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                <motion.div animate={{width:`${(players.length/room.max_players)*100}%`}} transition={{duration:0.5}}
                  style={{height:'100%',background:'linear-gradient(90deg,rgba(241,196,15,0.4),rgba(241,196,15,0.8))',borderRadius:9999,
                    boxShadow:'0 0 8px rgba(241,196,15,0.3)'}}/>
              </div>
              <p style={{fontSize:10,color:'rgba(255,255,255,0.3)',fontFamily:'Cinzel,serif'}}>{players.length}/{room.max_players}</p>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.3em',color:'rgba(241,196,15,0.35)',fontFamily:'Cinzel,serif',margin:0}}>Pemain</p>
            {players.map((p,i)=>(
              <motion.div key={p.id||p.user_id} initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                style={{display:'flex',alignItems:'center',gap:12,borderRadius:14,padding:'11px 15px',
                  background:'linear-gradient(135deg,rgba(5,2,15,0.92),rgba(12,5,30,0.88))',
                  border:`1px solid ${p.user_id===room.host_id?'rgba(241,196,15,0.28)':'rgba(255,255,255,0.06)'}`,
                  boxShadow:p.user_id===room.host_id?'0 4px 20px rgba(241,196,15,0.08)':'none'}}>
                <div style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  background:p.user_id===room.host_id?'linear-gradient(135deg,rgba(180,130,0,0.4),rgba(241,196,15,0.3))':'rgba(255,255,255,0.05)',
                  border:p.user_id===room.host_id?'1px solid rgba(241,196,15,0.4)':'1px solid rgba(255,255,255,0.08)',
                  color:p.user_id===room.host_id?'#F1C40F':'rgba(255,255,255,0.45)'}}>
                  {p.user_id===room.host_id?<IcoCrown size={16}/>:<IcoPerson size={16}/>}
                </div>
                <p style={{flex:1,fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.85)',margin:0,fontFamily:'Cinzel,serif',letterSpacing:'0.03em'}}>{p.username}</p>
                {p.user_id===room.host_id
                  ?<span style={{fontSize:9,color:'rgba(241,196,15,0.55)',textTransform:'uppercase',letterSpacing:'0.15em',fontFamily:'Cinzel,serif'}}>Host</span>
                  :<span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:p.is_ready?'#27ae60':'rgba(255,255,255,0.25)',fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>
                    {p.is_ready&&<IcoCheckCircle size={10} color="#27ae60"/>}
                    {p.is_ready?'Siap':'Menunggu'}
                  </span>
                }
              </motion.div>
            ))}
            {Array.from({length:Math.max(0,room.max_players-players.length)}).map((_,i)=>(
              <div key={`empty-${i}`} style={{display:'flex',alignItems:'center',gap:12,borderRadius:14,padding:'11px 15px',
                background:'rgba(0,0,0,0.2)',border:'1px dashed rgba(255,255,255,0.06)'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.08)'}}/>
                <p style={{fontSize:12,color:'rgba(255,255,255,0.15)',margin:0,fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>Menunggu pemain...</p>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {!isHost&&(
              <motion.button type="button" onClick={()=>setReady({roomId:room.id,userId:myPlayer?.user_id,isReady:!myPlayer?.is_ready})}
                whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                style={{flex:1,minWidth:120,borderRadius:12,padding:'12px 0',fontSize:13,fontWeight:700,border:'none',cursor:'pointer',
                  fontFamily:'Cinzel,serif',letterSpacing:'0.08em',
                  background:myPlayer?.is_ready?'linear-gradient(135deg,rgba(27,120,60,0.4),rgba(39,174,96,0.3))':'linear-gradient(135deg,#4a1080,#8e44ad)',
                  color:'#fff',
                  boxShadow:myPlayer?.is_ready?'0 0 20px rgba(39,174,96,0.35)':'0 0 24px rgba(142,68,173,0.45)'}}>
                {myPlayer?.is_ready
                  ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7}}><IcoCheckCircle size={12} color="#27ae60"/> Siap</span>
                  : 'Tandai Siap'
                }
              </motion.button>
            )}
            {isHost&&(
              <motion.button type="button" onClick={onStart} disabled={players.length<2}
                whileHover={players.length>=2?{scale:1.03}:{}} whileTap={players.length>=2?{scale:0.97}:{}}
                style={{flex:1,minWidth:120,borderRadius:12,padding:'12px 0',fontSize:13,fontWeight:700,border:'none',
                  cursor:players.length<2?'not-allowed':'pointer',
                  fontFamily:'Cinzel,serif',letterSpacing:'0.08em',
                  background:players.length<2?'rgba(255,255,255,0.04)':'linear-gradient(135deg,#8b1515,#a93226,#e74c3c)',
                  color:players.length<2?'rgba(255,255,255,0.2)':'#fff',
                  boxShadow:players.length<2?'none':'0 0 28px rgba(192,57,43,0.55)'}}>
                {players.length<2
                  ? 'Tunggu Pemain...'
                  : <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><IcoRocket size={14}/> Mulai Game</span>
                }
              </motion.button>
            )}
            <motion.button type="button" onClick={()=>setShowChat(true)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{borderRadius:12,padding:'12px 18px',fontSize:13,fontWeight:600,cursor:'pointer',
                fontFamily:'Cinzel,serif',letterSpacing:'0.05em',
                border:'1px solid rgba(241,196,15,0.25)',background:'rgba(241,196,15,0.07)',color:'rgba(241,196,15,0.75)'}}>
              <span style={{display:'flex',alignItems:'center',gap:7}}>
                <IcoChat size={13}/>{messages.length>0?`Chat (${messages.length})`:'Chat'}
              </span>
            </motion.button>
            <motion.button type="button" onClick={onLeave} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{borderRadius:12,padding:'12px 18px',fontSize:13,fontWeight:600,cursor:'pointer',
                border:'1px solid rgba(192,57,43,0.35)',background:'rgba(192,57,43,0.07)',color:'rgba(192,57,43,0.8)',
                fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>
              <span style={{display:'flex',alignItems:'center',gap:7}}><IcoDoor size={13}/> Keluar</span>
            </motion.button>
          </div>
        </div>

        <div className="chat-desktop-only" style={{borderRadius:18,overflow:'hidden',background:'rgba(0,0,0,0.6)',border:'1px solid rgba(241,196,15,0.1)',minHeight:400}}>
          <ChatPanel messages={messages} onSend={onSendMessage} username={username}/>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export function MultiplayerGamePage() {
  const location=useLocation()
  const navigate=useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { room:liveRoom, players, gameState, messages, setReady, startGame, updateGameState, sendMessage, leaveRoom, subscribeToRoom } = useMultiplayer()
  const { settleBet, rewardWin } = useCoins()

  const initRoom=location.state?.room
  const isHost=location.state?.isHost??false
  const betAmount=location.state?.betAmount??0
  const username=profile?.username||user?.email?.split('@')[0]||'Pemain'

  const [localGameState,setLocalGameState]=useState(null)
  const [selectedIndex,setSelectedIndex]=useState(null)
  const [handOrder,setHandOrder]=useState(null)
  const [chatOpen,setChatOpen]=useState(false)
  const [isMobile,setIsMobile]=useState(window.innerWidth<768)
  const [coinResult,setCoinResult]=useState(null) // { won, amount }
  const statsUpdated=useRef(false)
  const betSettled=useRef(false)
  const prevHandRef=useRef([])

  const [pairInfo,setPairInfo]=useState(null)
  const [jokerInfo,setJokerInfo]=useState(null)

  const room=liveRoom||initRoom

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn)
  },[])

  useEffect(()=>{ if(initRoom?.id) subscribeToRoom(initRoom.id) },[initRoom?.id])
  useEffect(()=>{ if(gameState){ setLocalGameState(gameState); statsUpdated.current=false } },[gameState])

  // Hand order tracking
  useEffect(()=>{
    const myPlayer=localGameState?.players?.find(p=>p.id===user?.id)
    const hand=myPlayer?.hand||[]
    if(handOrder===null){
      setHandOrder(hand.map(c=>c.id)); prevHandRef.current=hand.map(c=>c.id); return
    }
    const prevIds=prevHandRef.current
    const newIds=hand.map(c=>c.id)
    const added=newIds.filter(id=>!prevIds.includes(id))
    const removed=prevIds.filter(id=>!newIds.includes(id))
    if(added.length>0||removed.length>0){
      let updated=handOrder.filter(id=>newIds.includes(id))
      added.forEach(id=>updated.push(id))
      setHandOrder(updated)
    }
    prevHandRef.current=newIds
  },[localGameState?.players])

  // Stats + Bet settlement
  useEffect(()=>{
    if(localGameState?.status!=='finished'||!user) return

    // Stats
    if(!statsUpdated.current){
      statsUpdated.current=true
      const loser=localGameState.players[localGameState.loserIndex]
      const iLost=loser?.id===user.id
      supabase.from('profiles').select('games_played,games_won,games_lost').eq('id',user.id).single()
        .then(({data})=>{
          if(!data) return
          supabase.from('profiles').update({
            games_played:(data.games_played||0)+1,
            games_won:(data.games_won||0)+(iLost?0:1),
            games_lost:(data.games_lost||0)+(iLost?1:0),
          }).eq('id',user.id).then(()=>refreshProfile())
        })
    }

    // Bet settlement — hanya host yang jalankan settleBet, semua player rewardWin jika menang
    if(!betSettled.current && betAmount > 0){
      betSettled.current=true
      const loser=localGameState.players[localGameState.loserIndex]
      const iLost=loser?.id===user.id
      const winners=localGameState.players.filter(p=>p.id!==loser?.id)
      const isWinner=winners.some(p=>p.id===user.id)

      // Host settle pot → distribusi ke semua pemenang
      if(isHost){
        // Cari winner pertama sebagai penerima pot utama (bisa dikembangkan split pot)
        const firstWinner=winners[0]
        if(firstWinner) settleBet(room.id, firstWinner.id)
      }

      // Reward win (non-bet bonus +50) untuk pemenang
      if(isWinner){
        rewardWin(room.id)
        const pot = betAmount * localGameState.players.length
        setCoinResult({ won: true, amount: pot })
      } else if(iLost){
        setCoinResult({ won: false, amount: betAmount })
      }
      refreshProfile()
    }

    // Reward win tanpa taruhan
    if(!betSettled.current && betAmount === 0){
      betSettled.current=true
      const loser=localGameState.players[localGameState.loserIndex]
      const isWinner=loser?.id!==user.id
      if(isWinner) rewardWin(room.id)
    }
  },[localGameState?.status, user])

  useEffect(()=>{ if(!pairInfo) return; const t=setTimeout(()=>setPairInfo(null),1000); return ()=>clearTimeout(t) },[pairInfo])
  useEffect(()=>{ if(!jokerInfo) return; const t=setTimeout(()=>setJokerInfo(null),1200); return ()=>clearTimeout(t) },[jokerInfo])

  if(!room||!user){ navigate('/lobby'); return null }

  const myPlayerIndex=localGameState?.players?.findIndex(p=>p.id===user.id)??-1
  const me=localGameState?.players?.[myPlayerIndex]??null
  const currentPlayer=localGameState?.players?.[localGameState?.current]??null
  const isMyTurn=localGameState?.status==='playing'&&currentPlayer?.id===user.id
  const neighborIdx=localGameState?leftNeighbor(localGameState.players,localGameState.current):null
  const neighborPlayer=neighborIdx!=null?localGameState?.players?.[neighborIdx]:null

  const myHand=me?.hand||[]
  const displayHand=handOrder?handOrder.map(id=>myHand.find(c=>c.id===id)).filter(Boolean):myHand

  const handleStart=async()=>{
    const initialState=buildInitialState(players)
    await startGame({roomId:room.id,initialState})
  }
  const handleLeave=async()=>{
    await leaveRoom({roomId:room.id,userId:user.id,isHost}); navigate('/lobby')
  }
  const handleHome=async()=>{
    await leaveRoom({roomId:room.id,userId:user.id,isHost}); navigate('/')
  }

  const handleDraw=async()=>{
    if(!isMyTurn||selectedIndex==null||!localGameState) return
    const state=localGameState
    const neighbor=leftNeighbor(state.players,state.current)
    if(neighbor==null) return
    const newPlayers=state.players.map(p=>({...p,hand:[...p.hand]}))
    const src=newPlayers[neighbor], tgt=newPlayers[state.current]
    const [card]=src.hand.splice(selectedIndex,1)
    const beforeHand=[...tgt.hand]
    tgt.hand.push(card)

    const gotJoker=card.rank==='JOKER'
    const gotPair=!gotJoker&&beforeHand.some(c=>c.rank===card.rank)

    tgt.hand=removePairs(tgt.hand)
    for(let i=0;i<newPlayers.length;i++){if(newPlayers[i].hand.length===0)newPlayers[i].out=true}
    const stillActive=newPlayers.filter(p=>!p.out&&p.hand.length>0)
    const newState=stillActive.length===1
      ?{...state,players:newPlayers,status:'finished',loserIndex:newPlayers.findIndex(p=>p.id===stillActive[0].id)}
      :{...state,players:newPlayers,current:nextActiveLeft(newPlayers,state.current)}

    setLocalGameState(newState)
    setSelectedIndex(null)

    if(gotJoker) setJokerInfo(true)
    else if(gotPair) setPairInfo({ rank: card.rank })

    await updateGameState({roomId:room.id,state:newState})
  }

  const handleShuffle=()=>{
    if(!me) return
    const shuffled=shuffle(me.hand)
    setHandOrder(shuffled.map(c=>c.id))
  }
  const handleSendMessage=(text)=>{
    sendMessage({roomId:room.id,userId:user.id,username,text})
  }

  // ── WAITING ROOM ──
  if(!localGameState||room.status==='waiting'){
    return (
      <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 30% 20%,rgba(20,5,50,0.97),rgba(5,2,15,1) 60%,rgba(0,0,0,1))',padding:isMobile?'16px':'24px'}}>
        <style>{`
          ${mpStyles}
          @media(min-width:768px){ .lg-grid-chat{ grid-template-columns: 1fr 300px !important; } .chat-desktop-only{ display:flex !important; flex-direction:column; } }
          @media(max-width:767px){ .chat-desktop-only{ display:none !important; } }
        `}</style>
        <WaitingRoom room={room} players={players} userId={user.id} isHost={isHost}
          onStart={handleStart} onLeave={handleLeave} setReady={setReady}
          messages={messages} onSendMessage={handleSendMessage} username={username}/>
      </div>
    )
  }

  // ── GAME ──
  return (
    <>
      <style>{mpStyles}</style>
      <section style={{position:'relative',display:'flex',flexDirection:'column',gap:0,minHeight:500}}>

        {/* Rich felt bg */}
        <div style={{position:'absolute',inset:0,borderRadius:20,overflow:'hidden',pointerEvents:'none',zIndex:0,
          background:'radial-gradient(ellipse at 40% 30%,rgba(18,55,28,0.97) 0%,rgba(6,25,12,0.99) 55%,rgba(0,0,0,1) 100%)'}}>
          <div style={{position:'absolute',inset:0,opacity:0.06,backgroundImage:'radial-gradient(circle at 50% 50%,rgba(255,255,255,0.1) 1px,transparent 1px)',backgroundSize:'10px 10px'}}/>
          <div style={{position:'absolute',inset:10,borderRadius:14,border:'2px solid rgba(241,196,15,0.18)',boxShadow:'inset 0 0 80px rgba(0,0,0,0.6)'}}/>
          <div style={{position:'absolute',inset:14,borderRadius:12,border:'1px solid rgba(241,196,15,0.06)'}}/>
          <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',width:400,height:280,
            background:'radial-gradient(ellipse,rgba(25,90,45,0.25) 0%,transparent 70%)',animation:'mp-orbFloat 7s ease-in-out infinite'}}/>
          <div style={{position:'absolute',top:'70%',left:'20%',width:280,height:180,
            background:'radial-gradient(ellipse,rgba(241,196,15,0.04) 0%,transparent 70%)',animation:'mp-orbFloat 9s ease-in-out infinite reverse',pointerEvents:'none'}}/>
          <motion.div animate={{x:['-100%','200%']}} transition={{duration:5,repeat:Infinity,ease:'linear'}}
            style={{position:'absolute',top:10,left:10,right:10,height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.45),transparent)',borderRadius:14}}/>
          {[{top:18,left:18},{top:18,right:18},{bottom:18,left:18},{bottom:18,right:18}].map((pos,i)=>(
            <div key={i} style={{position:'absolute',...pos,width:20,height:20,opacity:0.25,
              background:`linear-gradient(45deg,transparent 40%,rgba(241,196,15,0.8) 40%,rgba(241,196,15,0.8) 60%,transparent 60%),linear-gradient(-45deg,transparent 40%,rgba(241,196,15,0.8) 40%,rgba(241,196,15,0.8) 60%,transparent 60%)`}}/>
          ))}
        </div>

        <AnimatePresence>{pairInfo && <PairAnimation pairRank={pairInfo.rank}/>}</AnimatePresence>
        <AnimatePresence>{jokerInfo && <JokerAnimation/>}</AnimatePresence>

        <AnimatePresence>
          {chatOpen&&(
            <motion.div initial={{opacity:0,x:'100%'}} animate={{opacity:1,x:0}} exit={{opacity:0,x:'100%'}}
              style={{position:'fixed',inset:0,zIndex:50,display:'flex',flexDirection:'column'}}>
              <ChatPanel messages={messages} onSend={handleSendMessage} username={username} onClose={()=>setChatOpen(false)}/>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{position:'relative',zIndex:1,display:'grid',gap:0,gridTemplateColumns:!isMobile&&chatOpen?'1fr 270px':'1fr'}}>
          <div style={{display:'flex',flexDirection:'column',gap:isMobile?12:16,padding:isMobile?'12px 10px':'20px 24px'}}>

            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
              <div>
                <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                  <h1 style={{fontFamily:'Cinzel Decorative,Georgia,serif',fontSize:isMobile?18:22,color:'#F1C40F',
                    textShadow:'0 0 24px rgba(241,196,15,0.7),0 0 48px rgba(241,196,15,0.25)',lineHeight:1,margin:0,letterSpacing:'0.03em'}}>
                    Kartu Batak
                  </h1>
                  <span style={{fontSize:8,color:'rgba(241,196,15,0.3)',letterSpacing:'0.25em',textTransform:'uppercase',fontFamily:'Cinzel,serif'}}>Multi</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                  <motion.div style={{width:5,height:5,borderRadius:'50%',background:'rgba(39,174,96,0.7)'}}
                    animate={{boxShadow:['0 0 4px rgba(39,174,96,0.4)','0 0 10px rgba(39,174,96,0.8)','0 0 4px rgba(39,174,96,0.4)']}}
                    transition={{duration:2,repeat:Infinity}}/>
                  <p style={{fontSize:9,color:'rgba(241,196,15,0.35)',fontFamily:'Cinzel,serif',letterSpacing:'0.1em'}}>Room: {room.room_code}</p>
                  {/* Pot badge */}
                  {betAmount > 0 && (
                    <div style={{display:'flex',alignItems:'center',gap:4,borderRadius:9999,padding:'2px 8px',
                      background:'rgba(241,196,15,0.1)',border:'1px solid rgba(241,196,15,0.25)'}}>
                      <IcoCoinInline size={10}/>
                      <span style={{fontSize:9,color:'#F1C40F',fontFamily:'Cinzel,serif',fontWeight:700}}>
                        Pot ~{(betAmount * (localGameState?.players?.length||2)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <AnimatePresence mode="wait">
                  <motion.div key={currentPlayer?.id} initial={{opacity:0,x:8,scale:0.9}} animate={{opacity:1,x:0,scale:1}}
                    style={{borderRadius:10,padding:isMobile?'5px 10px':'6px 14px',fontSize:isMobile?10:11,fontWeight:700,
                      fontFamily:'Cinzel,serif',letterSpacing:'0.05em',
                      background:isMyTurn?'linear-gradient(135deg,rgba(241,196,15,0.15),rgba(241,196,15,0.05))':'rgba(0,0,0,0.5)',
                      border:isMyTurn?'1px solid rgba(241,196,15,0.5)':'1px solid rgba(255,255,255,0.06)',
                      color:isMyTurn?'#F1C40F':'rgba(255,255,255,0.35)',
                      boxShadow:isMyTurn?'0 0 18px rgba(241,196,15,0.25),inset 0 0 10px rgba(241,196,15,0.04)':'none',
                      animation:isMyTurn?'mp-pulse-border 1.5s ease-in-out infinite':'none'}}>
                    {isMyTurn
                      ? <span style={{display:'flex',alignItems:'center',gap:6}}><IcoBolt size={11}/> Giliranmu!</span>
                      : <span style={{display:'flex',alignItems:'center',gap:6}}><IcoHourglass size={11}/> {currentPlayer?.name}...</span>
                    }
                  </motion.div>
                </AnimatePresence>
                <motion.button type="button" onClick={()=>setChatOpen(o=>!o)}
                  whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                  style={{borderRadius:9,padding:isMobile?'5px 10px':'6px 12px',fontSize:isMobile?10:11,fontWeight:600,cursor:'pointer',
                    fontFamily:'Cinzel,serif',
                    background:chatOpen?'rgba(142,68,173,0.2)':'rgba(0,0,0,0.5)',
                    border:chatOpen?'1px solid rgba(142,68,173,0.45)':'1px solid rgba(241,196,15,0.15)',
                    color:chatOpen?'rgba(200,150,255,0.85)':'rgba(241,196,15,0.55)',transition:'all 0.2s'}}>
                  {chatOpen
                    ? <span style={{display:'flex',alignItems:'center',gap:6}}><IcoX size={11}/> Chat</span>
                    : <span style={{display:'flex',alignItems:'center',gap:6}}><IcoChat size={12}/>{messages.length>0?` (${messages.length})`:' Chat'}</span>
                  }
                </motion.button>
              </div>
            </div>

            <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.3),rgba(241,196,15,0.08),transparent)'}}/>

            {/* Opponents */}
            <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
              {localGameState.players.filter(p=>p.id!==user.id).map(p=>{
                const isCurrent=currentPlayer?.id===p.id
                return (
                  <motion.div key={p.id}
                    animate={{boxShadow:isCurrent?'0 0 45px rgba(241,196,15,0.5),0 0 90px rgba(241,196,15,0.12)':'0 4px 20px rgba(0,0,0,0.5)',
                      borderColor:isCurrent?'rgba(241,196,15,0.75)':'rgba(241,196,15,0.1)',scale:isCurrent?1.03:1}}
                    style={{borderRadius:16,padding:isMobile?'10px 12px':'12px 16px',
                      background:'linear-gradient(145deg,rgba(5,2,15,0.97),rgba(15,5,35,0.92))',
                      border:'1px solid rgba(241,196,15,0.1)',
                      textAlign:'center',minWidth:isMobile?80:106,flex:isMobile?'1 1 80px':'0 0 auto',
                      position:'relative',overflow:'hidden'}}>
                    {isCurrent&&(
                      <motion.div animate={{x:['-100%','200%']}} transition={{duration:1.5,repeat:Infinity,ease:'linear'}}
                        style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.8),transparent)'}}/>
                    )}
                    {isCurrent&&(
                      <div style={{position:'absolute',inset:0,borderRadius:16,pointerEvents:'none',
                        background:'radial-gradient(circle at 50% 0%,rgba(241,196,15,0.06),transparent 70%)'}}/>
                    )}
                    {(()=>{
                      const seatIdx=localGameState.players.filter(pl=>pl.id!==user.id).findIndex(pl=>pl.id===p.id)
                      const AvatarComp=PlayerAvatars[seatIdx%PlayerAvatars.length]
                      const avatarColor=p.out?'rgba(241,196,15,0.2)':isCurrent?'#F1C40F':'rgba(241,196,15,0.55)'
                      return (
                        <div style={{width:isMobile?32:38,height:isMobile?32:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                          marginBottom:4,
                          background:p.out?'rgba(255,255,255,0.03)':isCurrent?'linear-gradient(135deg,rgba(91,31,160,0.6),rgba(142,68,173,0.8))':'rgba(241,196,15,0.07)',
                          border:isCurrent?'2px solid rgba(241,196,15,0.7)':'1px solid rgba(241,196,15,0.12)',
                          boxShadow:isCurrent?'0 0 16px rgba(241,196,15,0.35)':'none',
                          opacity:p.out?0.35:1,color:avatarColor,filter:p.out?'grayscale(1)':'none',transition:'all 0.3s ease'}}>
                          <AvatarComp size={isMobile?14:17} color={avatarColor}/>
                        </div>
                      )
                    })()}
                    <p style={{fontFamily:'Cinzel,serif',fontSize:isMobile?10:11,
                      color:p.out?'rgba(241,196,15,0.22)':isCurrent?'#F1C40F':'rgba(241,196,15,0.7)',
                      margin:0,letterSpacing:'0.03em',fontWeight:600,
                      textShadow:isCurrent?'0 0 10px rgba(241,196,15,0.5)':'none'}}>{p.name}</p>
                    {p.out?(
                      <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                        <IcoCheckCircle size={9} color="rgba(39,174,96,0.65)"/>
                        <span style={{fontSize:9,color:'rgba(39,174,96,0.6)',fontFamily:'Cinzel,serif',letterSpacing:'0.1em'}}>Selamat</span>
                      </div>
                    ):(
                      <>
                        <div style={{display:'flex',justifyContent:'center',marginTop:6,alignItems:'flex-end'}}>
                          {p.hand.slice(0,isMobile?4:5).map((_,i)=>(
                            <div key={i} style={{marginLeft:i===0?0:-12,transform:`rotate(${(i-2)*4}deg)`,transformOrigin:'bottom center'}}>
                              <CardBack size="sm"/>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:5,borderRadius:9999,padding:'2px 8px',
                          background:isCurrent?'rgba(241,196,15,0.07)':'rgba(0,0,0,0.35)',display:'inline-block',
                          border:isCurrent?'1px solid rgba(241,196,15,0.18)':'none',transition:'all 0.3s'}}>
                          <p style={{fontSize:9,color:isCurrent?'rgba(241,196,15,0.6)':'rgba(241,196,15,0.3)',fontFamily:'Cinzel,serif'}}>{p.hand.length} kartu</p>
                        </div>
                      </>
                    )}
                    {isCurrent&&!p.out&&(
                      <div style={{display:'flex',justifyContent:'center',gap:3,marginTop:5}}>
                        {[0,1,2].map(i=>(
                          <motion.div key={i} animate={{y:[0,-4,0]}} transition={{duration:0.5,repeat:Infinity,delay:i*0.15}}
                            style={{width:3,height:3,borderRadius:'50%',background:'rgba(241,196,15,0.7)',boxShadow:'0 0 4px rgba(241,196,15,0.5)'}}/>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.14))'}}/>
              <span style={{fontSize:8,color:'rgba(241,196,15,0.28)',letterSpacing:'0.3em',textTransform:'uppercase',fontFamily:'Cinzel,serif'}}>Pilih Kartu</span>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(241,196,15,0.14),transparent)'}}/>
            </div>

            {/* Neighbor pick */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8,borderRadius:9999,padding:'5px 14px',
                background:isMyTurn?'rgba(241,196,15,0.07)':'rgba(0,0,0,0.3)',
                border:isMyTurn?'1px solid rgba(241,196,15,0.22)':'1px solid rgba(255,255,255,0.04)',
                boxShadow:isMyTurn?'0 0 12px rgba(241,196,15,0.1)':'none',transition:'all 0.3s ease'}}>
                <p style={{fontFamily:'Cinzel,serif',fontSize:isMobile?10:11,
                  color:isMyTurn?'rgba(241,196,15,0.85)':'rgba(241,196,15,0.35)',
                  letterSpacing:'0.06em',margin:0,display:'flex',alignItems:'center',gap:7}}>
                  {isMyTurn && <IcoPickArrow size={11}/>}
                  {isMyTurn?'Pilih 1 kartu dari lawan':'Kartu pemain di kiri'}
                </p>
              </div>
              <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',padding:'6px 0'}}>
                {neighborPlayer?.hand.map((_,idx)=>(
                  <motion.div key={`n-${idx}`} style={{marginLeft:idx===0?0:isMobile?-12:-10,zIndex:selectedIndex===idx?5:1}}
                    animate={{y:selectedIndex===idx?-8:0}}>
                    <CardBack size={isMobile?'sm':'md'} selected={selectedIndex===idx} canClick={isMyTurn}
                      onClick={()=>isMyTurn&&setSelectedIndex(idx)}/>
                  </motion.div>
                ))}
                {!neighborPlayer&&(
                  <p style={{fontSize:11,color:'rgba(241,196,15,0.3)',fontFamily:'Cinzel,serif'}}>Tidak ada pemain aktif.</p>
                )}
              </div>
              <AnimatePresence>
                {selectedIndex!=null&&(
                  <motion.div initial={{opacity:0,y:5,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}}
                    style={{borderRadius:9999,padding:'4px 16px',background:'rgba(241,196,15,0.1)',border:'1px solid rgba(241,196,15,0.35)',
                      fontSize:10,color:'#F1C40F',fontFamily:'Cinzel,serif',letterSpacing:'0.08em',boxShadow:'0 0 12px rgba(241,196,15,0.15)'}}>
                    Kartu #{selectedIndex+1} dipilih
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.14))'}}/>
              <div style={{width:4,height:4,borderRadius:'50%',background:'rgba(241,196,15,0.3)',transform:'rotate(45deg)',boxShadow:'0 0 4px rgba(241,196,15,0.25)'}}/>
              <div style={{flex:1,height:1,background:'linear-gradient(90deg,rgba(241,196,15,0.14),transparent)'}}/>
            </div>

            {/* My hand */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <p style={{fontFamily:'Cinzel,serif',fontSize:isMobile?11:13,color:'#F1C40F',margin:0,letterSpacing:'0.05em',
                    textShadow:'0 0 10px rgba(241,196,15,0.3)',display:'flex',alignItems:'center',gap:7}}>
                    <IcoCards size={14}/> Kartu Kamu
                  </p>
                  <div style={{borderRadius:9999,padding:'1px 8px',background:'rgba(241,196,15,0.1)',border:'1px solid rgba(241,196,15,0.25)',boxShadow:'0 0 8px rgba(241,196,15,0.1)'}}>
                    <span style={{fontSize:9,color:'#F1C40F',fontFamily:'Cinzel,serif'}}>{myHand.length}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <motion.button type="button" onClick={handleShuffle}
                    whileHover={{scale:1.06,boxShadow:'0 0 16px rgba(241,196,15,0.2)'}} whileTap={{scale:0.95}}
                    style={{borderRadius:9,padding:isMobile?'6px 12px':'7px 16px',fontSize:isMobile?10:12,fontWeight:700,
                      border:'1px solid rgba(241,196,15,0.22)',background:'rgba(241,196,15,0.07)',
                      color:'rgba(241,196,15,0.75)',cursor:'pointer',fontFamily:'Cinzel,serif',letterSpacing:'0.05em',transition:'all 0.2s'}}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}><IcoShuffle size={13}/>Kocok</span>
                  </motion.button>
                  <motion.button type="button" onClick={handleDraw} disabled={!isMyTurn||selectedIndex==null}
                    whileHover={isMyTurn&&selectedIndex!=null?{scale:1.06,boxShadow:'0 0 28px rgba(192,57,43,0.7)'}:{}}
                    whileTap={isMyTurn&&selectedIndex!=null?{scale:0.95}:{}}
                    style={{borderRadius:9,padding:isMobile?'6px 12px':'7px 18px',fontSize:isMobile?10:12,fontWeight:700,border:'none',
                      cursor:isMyTurn&&selectedIndex!=null?'pointer':'not-allowed',fontFamily:'Cinzel,serif',letterSpacing:'0.06em',
                      background:isMyTurn&&selectedIndex!=null?'linear-gradient(135deg,#7b1515,#a93226,#e74c3c)':'rgba(255,255,255,0.04)',
                      color:isMyTurn&&selectedIndex!=null?'#fff':'rgba(255,255,255,0.15)',
                      boxShadow:isMyTurn&&selectedIndex!=null?'0 0 24px rgba(192,57,43,0.6),inset 0 1px 0 rgba(255,255,255,0.1)':'none',
                      transition:'all 0.2s'}}>
                    Ambil →
                  </motion.button>
                </div>
              </div>

              <div style={{display:'flex',flexWrap:'wrap',gap:isMobile?4:6,padding:'12px 14px',borderRadius:14,
                background:'rgba(0,0,0,0.35)',
                border:isMyTurn?'1px solid rgba(241,196,15,0.1)':'1px solid rgba(241,196,15,0.05)',
                minHeight:86,boxShadow:isMyTurn?'inset 0 0 24px rgba(241,196,15,0.03)':'none',transition:'all 0.3s ease'}}>
                <AnimatePresence>
                  {displayHand.map((card,i)=>(
                    <motion.div key={card.id}
                      initial={{opacity:0,y:16,scale:0.85}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10}}
                      transition={{delay:i*0.03}}>
                      <CardFace card={card} size={isMobile?'sm':'md'} glow={card.rank==='JOKER'}/>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {myHand.length===0&&(
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0'}}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(39,174,96,0.8)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    <p style={{fontSize:12,color:'rgba(39,174,96,0.7)',fontFamily:'Cinzel,serif',letterSpacing:'0.05em',textShadow:'0 0 10px rgba(39,174,96,0.4)'}}>
                      Kamu sudah bebas!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {!isMobile&&chatOpen&&(
            <div style={{borderRadius:16,overflow:'hidden',border:'1px solid rgba(241,196,15,0.1)',maxHeight:700,borderLeft:'1px solid rgba(241,196,15,0.08)'}}>
              <ChatPanel messages={messages} onSend={handleSendMessage} username={username} onClose={()=>setChatOpen(false)}/>
            </div>
          )}
        </div>

        {/* ── Game Over ── */}
        <AnimatePresence>
          {localGameState.status==='finished'&&localGameState.loserIndex!=null&&(()=>{
            const loser=localGameState.players[localGameState.loserIndex]
            const loserIsYou=loser?.id===user.id
            const pot=betAmount>0 ? betAmount*localGameState.players.length : 0
            return (
              <motion.div style={{position:'fixed',inset:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'center',
                padding:16,background:'rgba(0,0,0,0.96)'}}
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

                {[...Array(8)].map((_,i)=>(
                  <motion.div key={i}
                    style={{position:'absolute',left:`${10+i*12}%`,bottom:'15%',width:3,height:3,borderRadius:'50%',
                      background:loserIsYou?'#e74c3c':'#F1C40F',
                      boxShadow:`0 0 6px ${loserIsYou?'rgba(192,57,43,0.8)':'rgba(241,196,15,0.8)'}`}}
                    animate={{y:[-0,-200],opacity:[1,0],scale:[1,0]}}
                    transition={{duration:2+i*0.3,repeat:Infinity,delay:i*0.4}}/>
                ))}

                <motion.div initial={{scale:0.7,y:40,opacity:0}} animate={{scale:1,y:0,opacity:1}}
                  transition={{type:'spring',stiffness:280,damping:22}}
                  style={{width:'100%',maxWidth:460,borderRadius:28,
                    padding:isMobile?'24px 18px':'36px 32px',textAlign:'center',
                    background:loserIsYou
                      ?'linear-gradient(160deg,rgba(18,3,3,0.99),rgba(32,6,6,0.99))'
                      :'linear-gradient(160deg,rgba(3,10,5,0.99),rgba(6,18,10,0.99))',
                    border:loserIsYou?'1px solid rgba(200,50,43,0.6)':'1px solid rgba(241,196,15,0.55)',
                    boxShadow:loserIsYou
                      ?'0 0 100px rgba(192,57,43,0.4),inset 0 0 50px rgba(192,57,43,0.05)'
                      :'0 0 100px rgba(241,196,15,0.3),inset 0 0 50px rgba(241,196,15,0.04)',
                    position:'relative',overflow:'hidden'}}>

                  <motion.div animate={{x:['-100%','200%']}} transition={{duration:3,repeat:Infinity,delay:0.5}}
                    style={{position:'absolute',top:0,left:0,right:0,height:2,
                      background:loserIsYou
                        ?'linear-gradient(90deg,transparent,rgba(192,57,43,0.9),transparent)'
                        :'linear-gradient(90deg,transparent,rgba(241,196,15,0.9),transparent)'}}/>
                  <div style={{position:'absolute',top:0,left:0,width:80,height:80,pointerEvents:'none',
                    background:loserIsYou?'radial-gradient(circle at 0% 0%,rgba(192,57,43,0.14),transparent 70%)':'radial-gradient(circle at 0% 0%,rgba(241,196,15,0.09),transparent 70%)'}}/>
                  <div style={{position:'absolute',bottom:0,right:0,width:80,height:80,pointerEvents:'none',
                    background:loserIsYou?'radial-gradient(circle at 100% 100%,rgba(192,57,43,0.1),transparent 70%)':'radial-gradient(circle at 100% 100%,rgba(241,196,15,0.07),transparent 70%)'}}/>

                  <p style={{fontSize:8,textTransform:'uppercase',letterSpacing:'0.45em',
                    color:loserIsYou?'rgba(200,50,43,0.45)':'rgba(241,196,15,0.35)',marginBottom:10,fontFamily:'Cinzel,serif'}}>
                    Multiplayer — Game Over
                  </p>

                  <h2 style={{fontFamily:'Cinzel Decorative,Georgia,serif',fontSize:isMobile?22:28,
                    color:loserIsYou?'#e74c3c':'#F1C40F',marginBottom:6,
                    textShadow:loserIsYou?'0 0 28px rgba(192,57,43,0.9),0 0 60px rgba(192,57,43,0.4)':'0 0 28px rgba(241,196,15,0.8),0 0 60px rgba(241,196,15,0.35)'}}>
                    {loserIsYou?'Kamu Kalah!':'Kamu Menang!'}
                  </h2>

                  <motion.div style={{display:'flex',justifyContent:'center',marginBottom:8}}
                    animate={loserIsYou
                      ?{filter:['drop-shadow(0 0 8px rgba(192,57,43,0.5))','drop-shadow(0 0 20px rgba(192,57,43,0.9))','drop-shadow(0 0 8px rgba(192,57,43,0.5))']}
                      :{filter:['drop-shadow(0 0 8px rgba(241,196,15,0.4))','drop-shadow(0 0 20px rgba(241,196,15,0.9))','drop-shadow(0 0 8px rgba(241,196,15,0.4))']}}
                    transition={{duration:2,repeat:Infinity}}>
                    {loserIsYou ? <IcoSkull size={36} color="#e74c3c"/> : <IcoStar size={36} color="#F1C40F"/>}
                  </motion.div>

                  <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginBottom:16,fontFamily:'Cinzel,serif',letterSpacing:'0.04em'}}>
                    {loserIsYou?'Kamu pemegang Joker terakhir.':`${loser?.name} pemegang Joker terakhir.`}
                  </p>

                  {/* ── COIN RESULT BANNER ── */}
                  {coinResult && (
                    <motion.div
                      initial={{opacity:0,scale:0.8,y:10}} animate={{opacity:1,scale:1,y:0}}
                      transition={{delay:0.4,type:'spring',stiffness:300,damping:20}}
                      style={{
                        borderRadius:16,padding:'14px 20px',marginBottom:18,
                        background:coinResult.won
                          ?'linear-gradient(135deg,rgba(241,196,15,0.12),rgba(184,134,11,0.08))'
                          :'linear-gradient(135deg,rgba(192,57,43,0.1),rgba(120,30,20,0.08))',
                        border:coinResult.won?'1px solid rgba(241,196,15,0.35)':'1px solid rgba(192,57,43,0.3)',
                        boxShadow:coinResult.won?'0 0 24px rgba(241,196,15,0.15)':'none',
                      }}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                        <IcoTrophy size={20} color={coinResult.won?'#F1C40F':'rgba(192,57,43,0.6)'}/>
                        <div>
                          <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.2em',
                            color:coinResult.won?'rgba(241,196,15,0.5)':'rgba(255,255,255,0.3)',margin:0,marginBottom:2,fontFamily:'Cinzel,serif'}}>
                            {coinResult.won ? 'Koin Diterima' : 'Koin Hilang'}
                          </p>
                          <p style={{fontFamily:'Cinzel Decorative,Georgia,serif',fontSize:20,fontWeight:700,margin:0,
                            color:coinResult.won?'#F1C40F':'#e74c3c',
                            textShadow:coinResult.won?'0 0 16px rgba(241,196,15,0.5)':'none'}}>
                            {coinResult.won ? `+${coinResult.amount.toLocaleString()}` : `-${coinResult.amount.toLocaleString()}`} koin
                          </p>
                        </div>
                      </div>
                      {coinResult.won && betAmount > 0 && (
                        <p style={{fontSize:9,color:'rgba(241,196,15,0.35)',margin:'6px 0 0',fontFamily:'Cinzel,serif',letterSpacing:'0.05em'}}>
                          Taruhan {betAmount.toLocaleString()} × {localGameState.players.length} pemain = pot {pot.toLocaleString()} koin
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Joker card */}
                  <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                    <motion.div animate={{rotate:[0,-6,6,0],y:[0,-10,0]}} transition={{duration:2.5,repeat:Infinity}}
                      style={{width:72,height:100,borderRadius:12,background:'linear-gradient(145deg,#0d0020,#2a0050)',border:'2px solid #e74c3c',
                        boxShadow:'0 0 60px rgba(192,57,43,0.9),0 0 120px rgba(192,57,43,0.3)',
                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:5}}>
                      <span style={{fontSize:30,filter:'drop-shadow(0 0 12px rgba(255,80,80,0.9))'}}>🃏</span>
                      <span style={{fontSize:8,color:'#F1C40F',letterSpacing:'0.3em',fontFamily:'Cinzel,serif'}}>JOKER</span>
                    </motion.div>
                  </div>

                  {/* Players grid */}
                  <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:22,flexWrap:'wrap'}}>
                    {localGameState.players.map(p=>(
                      <motion.div key={p.id} initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
                        style={{borderRadius:12,padding:isMobile?'7px 10px':'8px 13px',minWidth:60,
                          background:p.id===loser?.id?'rgba(192,57,43,0.15)':'rgba(241,196,15,0.06)',
                          border:p.id===loser?.id?'1px solid rgba(192,57,43,0.42)':'1px solid rgba(241,196,15,0.12)'}}>
                        <p style={{fontSize:10,color:p.id===loser?.id?'#e74c3c':'rgba(241,196,15,0.65)',fontWeight:700,
                          fontFamily:'Cinzel,serif',margin:0,letterSpacing:'0.03em'}}>{p.name}</p>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginTop:3}}>
                          {p.id===loser?.id
                            ? <><IcoX size={9}/><span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>Kalah</span></>
                            : <><IcoCheck size={9} color="rgba(39,174,96,0.6)"/><span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>Selamat</span></>
                          }
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                    <motion.button type="button" onClick={handleLeave}
                      whileHover={{scale:1.06,boxShadow:'0 0 36px rgba(192,57,43,0.7)'}} whileTap={{scale:0.95}}
                      style={{borderRadius:12,padding:isMobile?'10px 20px':'12px 26px',fontSize:13,fontWeight:700,border:'none',cursor:'pointer',
                        fontFamily:'Cinzel,serif',letterSpacing:'0.08em',
                        background:'linear-gradient(135deg,#7b1515,#a93226,#e74c3c)',color:'#fff',
                        boxShadow:'0 0 32px rgba(192,57,43,0.55),inset 0 1px 0 rgba(255,255,255,0.1)'}}>
                      <span style={{display:'flex',alignItems:'center',gap:8}}><IcoReplay size={14}/> Main Lagi</span>
                    </motion.button>
                    <motion.button type="button" onClick={handleHome}
                      whileHover={{scale:1.06,boxShadow:'0 0 24px rgba(241,196,15,0.3)'}} whileTap={{scale:0.95}}
                      style={{borderRadius:12,padding:isMobile?'10px 20px':'12px 26px',fontSize:13,fontWeight:700,cursor:'pointer',
                        fontFamily:'Cinzel,serif',letterSpacing:'0.08em',
                        border:'1px solid rgba(241,196,15,0.35)',background:'rgba(241,196,15,0.08)',color:'rgba(241,196,15,0.85)'}}>
                      <span style={{display:'flex',alignItems:'center',gap:8}}><IcoHome size={14}/> Beranda</span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>
      </section>
    </>
  )
}
