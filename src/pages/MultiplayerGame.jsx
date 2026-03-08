import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth.jsx'
import { useMultiplayer } from '../hooks/useMultiplayer.js'
import { supabase } from '../lib/supabase.js'

// ── Game logic ─────────────────────────────────────────────
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

// ── Card components ────────────────────────────────────────
function CardFace({ card, size='md', glow=false }) {
  const isJoker=card.rank==='JOKER', isRed=RED_SUITS.includes(card.suit)
  const s={ sm:{w:34,h:50,r:10,st:10}, md:{w:50,h:70,r:13,st:13}, lg:{w:62,h:88,r:16,st:15} }[size]
  return (
    <div style={{ width:s.w,height:s.h,borderRadius:8,flexShrink:0,
      background:isJoker?'linear-gradient(135deg,#1a0030,#3d0060)':'linear-gradient(160deg,#fdfaf0,#f5f0e0)',
      border:isJoker?'1px solid rgba(192,57,43,0.7)':'1px solid rgba(200,180,120,0.5)',
      boxShadow:glow?'0 0 18px rgba(192,57,43,0.7),0 4px 12px rgba(0,0,0,0.5)':'0 4px 12px rgba(0,0,0,0.5)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',padding:'4px 3px' }}>
      {isJoker?(<><span style={{fontSize:s.st,alignSelf:'flex-start'}}>🃏</span><span style={{fontSize:s.r+4}}>🃏</span><span style={{fontSize:s.st,alignSelf:'flex-end',transform:'rotate(180deg)'}}>🃏</span></>)
      :(<>
        <div style={{alignSelf:'flex-start'}}><div style={{fontSize:s.r,fontWeight:700,color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.rank}</div><div style={{fontSize:s.st-1,color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.suit}</div></div>
        <div style={{fontSize:s.st+4,color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.suit}</div>
        <div style={{alignSelf:'flex-end',transform:'rotate(180deg)'}}><div style={{fontSize:s.r,fontWeight:700,color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.rank}</div><div style={{fontSize:s.st-1,color:isRed?'#c0392b':'#1a1a2e',lineHeight:1}}>{card.suit}</div></div>
      </>)}
    </div>
  )
}

function CardBack({ size='md', selected=false, canClick=false, onClick }) {
  const s={ sm:{w:30,h:44}, md:{w:46,h:64}, lg:{w:58,h:80} }[size]
  return (
    <motion.div onClick={canClick?onClick:undefined}
      whileHover={canClick?{y:-12,scale:1.1}:{}} whileTap={canClick?{scale:0.95}:{}}
      style={{ width:s.w,height:s.h,borderRadius:8,flexShrink:0,cursor:canClick?'pointer':'default',
        background:'linear-gradient(135deg,#1a0a2e,#2d1060)',
        border:selected?'2px solid #F1C40F':'1px solid rgba(142,68,173,0.4)',
        boxShadow:selected?'0 0 22px rgba(241,196,15,0.9),0 8px 20px rgba(0,0,0,0.7)':'0 4px 12px rgba(0,0,0,0.5)',
        display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden' }}>
      <div style={{position:'absolute',inset:4,borderRadius:5,border:'1px solid rgba(241,196,15,0.2)',
        background:'repeating-linear-gradient(45deg,rgba(241,196,15,0.04) 0px,rgba(241,196,15,0.04) 2px,transparent 2px,transparent 8px)'}}/>
      <span style={{fontSize:12,position:'relative',zIndex:1,opacity:0.5}}>🃏</span>
      {selected&&<div style={{position:'absolute',inset:0,background:'rgba(241,196,15,0.1)',borderRadius:7}}/>}
    </motion.div>
  )
}

// ── Chat panel ─────────────────────────────────────────────
function ChatPanel({ messages, onSend, username, onClose }) {
  const [text,setText]=useState('')
  const bottomRef=useRef(null)
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])
  const handleSend=()=>{ if(!text.trim()) return; onSend(text); setText('') }
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',minHeight:0 }}>
      <div style={{ padding:'10px 14px',borderBottom:'1px solid rgba(241,196,15,0.1)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <p style={{fontFamily:'Perpetua,Georgia,serif',fontSize:13,color:'#F1C40F'}}>💬 Chat</p>
        {onClose&&<button type="button" onClick={onClose} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>}
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'10px 12px',display:'flex',flexDirection:'column',gap:8,minHeight:0 }}>
        {messages.length===0&&<p style={{fontSize:11,color:'rgba(255,255,255,0.25)',textAlign:'center',marginTop:16}}>Belum ada pesan...</p>}
        {messages.map(msg=>(
          <div key={msg.id} style={{ display:'flex',flexDirection:'column',alignItems:msg.username===username?'flex-end':'flex-start' }}>
            <p style={{fontSize:10,color:'rgba(241,196,15,0.45)',marginBottom:2}}>{msg.username}</p>
            <div style={{ maxWidth:'85%',borderRadius:10,padding:'6px 10px',fontSize:12,
              background:msg.username===username?'rgba(142,68,173,0.4)':'rgba(255,255,255,0.07)',
              border:msg.username===username?'1px solid rgba(142,68,173,0.3)':'1px solid rgba(255,255,255,0.08)',
              color:'rgba(255,255,255,0.85)',wordBreak:'break-word' }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'8px 10px',borderTop:'1px solid rgba(241,196,15,0.1)',display:'flex',gap:8,flexShrink:0 }}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') handleSend()}}
          placeholder="Ketik pesan..." maxLength={120}
          style={{ flex:1,borderRadius:8,padding:'7px 10px',fontSize:12,background:'rgba(0,0,0,0.4)',
            border:'1px solid rgba(241,196,15,0.2)',color:'#fff',outline:'none' }}/>
        <motion.button type="button" onClick={handleSend} whileHover={{scale:1.08}} whileTap={{scale:0.92}}
          style={{ width:34,height:34,borderRadius:8,border:'none',cursor:'pointer',fontSize:14,
            background:'linear-gradient(135deg,#5b1fa0,#8e44ad)',color:'#fff' }}>↑</motion.button>
      </div>
    </div>
  )
}

// ── Waiting Room ───────────────────────────────────────────
function WaitingRoom({ room, players, userId, isHost, onStart, onLeave, setReady, messages, onSendMessage, username }) {
  const myPlayer=players.find(p=>p.user_id===userId)
  const [copied,setCopied]=useState(false)
  const [showChat,setShowChat]=useState(false)

  const handleCopy=async()=>{
    await navigator.clipboard.writeText(room.room_code)
    setCopied(true); setTimeout(()=>setCopied(false),1500)
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:0,height:'100%' }}>
      {/* Mobile chat overlay */}
      <AnimatePresence>
        {showChat&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
            style={{ position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.95)',display:'flex',flexDirection:'column' }}>
            <div style={{ flex:1,overflow:'hidden' }}>
              <ChatPanel messages={messages} onSend={onSendMessage} username={username} onClose={()=>setShowChat(false)}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'grid',gap:16, gridTemplateColumns:'1fr' }} className="lg-grid-chat">
        {/* Left: lobby */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div>
            <p style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.35em',color:'rgba(241,196,15,0.55)' }}>Menunggu Pemain</p>
            <h2 style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:28,color:'#f5d87a',textShadow:'0 0 14px rgba(241,196,15,0.3)',margin:0 }}>Ruang Tunggu</h2>
          </div>

          {/* Room code */}
          <div style={{ borderRadius:16,padding:'16px 20px',border:'1px solid rgba(241,196,15,0.25)',background:'rgba(0,0,0,0.5)' }}>
            <p style={{ fontSize:11,color:'rgba(241,196,15,0.55)',marginBottom:8 }}>Kode Room — Bagikan ke teman</p>
            <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' }}>
              <p style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:36,letterSpacing:'0.4em',color:'#F1C40F',textShadow:'0 0 20px rgba(241,196,15,0.5)',margin:0 }}>{room.room_code}</p>
              <motion.button type="button" onClick={handleCopy} whileHover={{scale:1.08}} whileTap={{scale:0.92}}
                style={{ borderRadius:8,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer',
                  background:copied?'rgba(39,174,96,0.3)':'rgba(241,196,15,0.12)',
                  color:copied?'#27ae60':'rgba(241,196,15,0.8)',border:`1px solid ${copied?'rgba(39,174,96,0.4)':'rgba(241,196,15,0.25)'}` }}>
                {copied?'✓ Tersalin':'Salin'}
              </motion.button>
            </div>
            <p style={{ fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:6 }}>{players.length}/{room.max_players} pemain bergabung</p>
          </div>

          {/* Players */}
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <p style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.2em',color:'rgba(241,196,15,0.45)' }}>Pemain</p>
            {players.map((p,i)=>(
              <motion.div key={p.id||p.user_id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                style={{ display:'flex',alignItems:'center',gap:12,borderRadius:12,padding:'10px 14px',
                  background:'rgba(0,0,0,0.4)',border:'1px solid rgba(241,196,15,0.1)' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
                  background:p.user_id===room.host_id?'linear-gradient(135deg,#b8860b,#F1C40F)':'rgba(255,255,255,0.06)' }}>
                  {p.user_id===room.host_id?'👑':'👤'}
                </div>
                <p style={{ flex:1,fontSize:14,fontWeight:600,color:'rgba(255,255,255,0.85)',margin:0 }}>{p.username}</p>
                {p.user_id===room.host_id
                  ?<span style={{ fontSize:10,color:'rgba(241,196,15,0.6)',textTransform:'uppercase',letterSpacing:'0.1em' }}>Host</span>
                  :<span style={{ fontSize:11,fontWeight:600,color:p.is_ready?'#27ae60':'rgba(255,255,255,0.3)' }}>{p.is_ready?'✓ Siap':'Belum'}</span>
                }
              </motion.div>
            ))}
            {Array.from({length:Math.max(0,room.max_players-players.length)}).map((_,i)=>(
              <div key={`empty-${i}`} style={{ display:'flex',alignItems:'center',gap:12,borderRadius:12,padding:'10px 14px',
                background:'rgba(0,0,0,0.2)',border:'1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.04)' }}/>
                <p style={{ fontSize:13,color:'rgba(255,255,255,0.2)',margin:0 }}>Menunggu pemain...</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {!isHost&&(
              <motion.button type="button" onClick={()=>setReady({roomId:room.id,userId,isReady:!myPlayer?.is_ready})}
                whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                style={{ flex:1,minWidth:120,borderRadius:9999,padding:'11px 0',fontSize:14,fontWeight:700,border:'none',cursor:'pointer',
                  background:myPlayer?.is_ready?'rgba(39,174,96,0.25)':'linear-gradient(135deg,#5b1fa0,#8e44ad)',
                  color:'#fff',boxShadow:myPlayer?.is_ready?'0 0 14px rgba(39,174,96,0.4)':'0 0 16px rgba(142,68,173,0.5)' }}>
                {myPlayer?.is_ready?'✓ Siap':'Tandai Siap'}
              </motion.button>
            )}
            {isHost&&(
              <motion.button type="button" onClick={onStart} disabled={players.length<2}
                whileHover={players.length>=2?{scale:1.03}:{}} whileTap={players.length>=2?{scale:0.97}:{}}
                style={{ flex:1,minWidth:120,borderRadius:9999,padding:'11px 0',fontSize:14,fontWeight:700,border:'none',
                  cursor:players.length<2?'not-allowed':'pointer',
                  background:players.length<2?'rgba(192,57,43,0.2)':'linear-gradient(135deg,#a93226,#e74c3c)',
                  color:'#fff',boxShadow:players.length<2?'none':'0 0 20px rgba(192,57,43,0.6)' }}>
                {players.length<2?'Tunggu Pemain...':'🚀 Mulai Game'}
              </motion.button>
            )}
            {/* Chat button mobile */}
            <motion.button type="button" onClick={()=>setShowChat(true)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{ borderRadius:9999,padding:'11px 18px',fontSize:14,fontWeight:600,cursor:'pointer',
                border:'1px solid rgba(241,196,15,0.3)',background:'rgba(241,196,15,0.08)',color:'rgba(241,196,15,0.8)' }}>
              💬 {messages.length>0?`(${messages.length})`:'Chat'}
            </motion.button>
            <motion.button type="button" onClick={onLeave} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{ borderRadius:9999,padding:'11px 18px',fontSize:14,fontWeight:600,cursor:'pointer',
                border:'1px solid rgba(192,57,43,0.4)',background:'transparent',color:'#e74c3c' }}>
              Keluar
            </motion.button>
          </div>
        </div>

        {/* Right: chat desktop */}
        <div className="chat-desktop-only" style={{ borderRadius:16,overflow:'hidden',background:'rgba(0,0,0,0.45)',border:'1px solid rgba(241,196,15,0.1)',minHeight:400 }}>
          <ChatPanel messages={messages} onSend={onSendMessage} username={username}/>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────
export function MultiplayerGamePage() {
  const location=useLocation()
  const navigate=useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { room:liveRoom, players, gameState, messages, setReady, startGame, updateGameState, sendMessage, leaveRoom, subscribeToRoom } = useMultiplayer()

  const initRoom=location.state?.room
  const isHost=location.state?.isHost??false
  const username=profile?.username||user?.email?.split('@')[0]||'Pemain'

  const [localGameState,setLocalGameState]=useState(null)
  const [selectedIndex,setSelectedIndex]=useState(null)
  const [handOrder,setHandOrder]=useState(null)
  const [chatOpen,setChatOpen]=useState(false)
  const [isMobile,setIsMobile]=useState(window.innerWidth<768)
  const statsUpdated=useRef(false)
  const prevHandRef=useRef([])

  const room=liveRoom||initRoom

  useEffect(()=>{
    const fn=()=>setIsMobile(window.innerWidth<768)
    window.addEventListener('resize',fn); return ()=>window.removeEventListener('resize',fn)
  },[])

  useEffect(()=>{ if(initRoom?.id) subscribeToRoom(initRoom.id) },[initRoom?.id])
  useEffect(()=>{ if(gameState){ setLocalGameState(gameState); statsUpdated.current=false } },[gameState])

  // Sync handOrder
  useEffect(()=>{
    const myPlayer=localGameState?.players?.find(p=>p.id===user?.id)
    const hand=myPlayer?.hand||[]
    if(handOrder===null){
      setHandOrder(hand.map(c=>c.id))
      prevHandRef.current=hand.map(c=>c.id)
      return
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

  // Stats update
  useEffect(()=>{
    if(localGameState?.status!=='finished'||!user||statsUpdated.current) return
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
  },[localGameState?.status, user])

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
    await leaveRoom({roomId:room.id,userId:user.id,isHost})
    navigate('/lobby')
  }

  const handleHome=async()=>{
    await leaveRoom({roomId:room.id,userId:user.id,isHost})
    navigate('/')
  }

  const handleDraw=async()=>{
    if(!isMyTurn||selectedIndex==null||!localGameState) return
    const state=localGameState
    const neighbor=leftNeighbor(state.players,state.current)
    if(neighbor==null) return
    const newPlayers=state.players.map(p=>({...p,hand:[...p.hand]}))
    const src=newPlayers[neighbor], tgt=newPlayers[state.current]
    const [card]=src.hand.splice(selectedIndex,1)
    tgt.hand.push(card)
    tgt.hand=removePairs(tgt.hand)
    for(let i=0;i<newPlayers.length;i++){if(newPlayers[i].hand.length===0)newPlayers[i].out=true}
    const stillActive=newPlayers.filter(p=>!p.out&&p.hand.length>0)
    const newState=stillActive.length===1
      ?{...state,players:newPlayers,status:'finished',loserIndex:newPlayers.findIndex(p=>p.id===stillActive[0].id)}
      :{...state,players:newPlayers,current:nextActiveLeft(newPlayers,state.current)}
    setLocalGameState(newState)
    setSelectedIndex(null)
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
      <div style={{ padding: isMobile?'12px':'0' }}>
        <style>{`
          @media(min-width:768px){
            .lg-grid-chat{ grid-template-columns: 1fr 300px !important; }
            .chat-desktop-only{ display:flex !important; flex-direction:column; }
          }
          @media(max-width:767px){
            .chat-desktop-only{ display:none !important; }
          }
        `}</style>
        <WaitingRoom room={room} players={players} userId={user.id} isHost={isHost}
          onStart={handleStart} onLeave={handleLeave} setReady={setReady}
          messages={messages} onSendMessage={handleSendMessage} username={username}/>
      </div>
    )
  }

  // ── GAME ──
  return (
    <section style={{ position:'relative',display:'flex',flexDirection:'column',gap:12,minHeight:500,padding:isMobile?'0':'0' }}>
      {/* felt bg */}
      <div style={{ position:'absolute',inset:0,borderRadius:16,overflow:'hidden',pointerEvents:'none',zIndex:0,
        background:'radial-gradient(ellipse at 50% 50%,rgba(10,40,20,0.9) 0%,rgba(5,20,10,0.95) 60%,rgba(0,0,0,0.98) 100%)' }}>
        <div style={{position:'absolute',inset:0,opacity:0.03,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(255,255,255,0.5) 2px,rgba(255,255,255,0.5) 3px)'}}/>
        <div style={{position:'absolute',inset:12,borderRadius:'inherit',border:'2px solid rgba(241,196,15,0.1)'}}/>
      </div>

      {/* Chat overlay (mobile) */}
      <AnimatePresence>
        {chatOpen&&(
          <motion.div initial={{opacity:0,x:'100%'}} animate={{opacity:1,x:0}} exit={{opacity:0,x:'100%'}}
            style={{ position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.97)',display:'flex',flexDirection:'column' }}>
            <ChatPanel messages={messages} onSend={handleSendMessage} username={username} onClose={()=>setChatOpen(false)}/>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position:'relative',zIndex:1,display:'grid',gap:12,
        gridTemplateColumns: !isMobile&&chatOpen ? '1fr 260px' : '1fr' }}>
        {/* Game area */}
        <div style={{ display:'flex',flexDirection:'column',gap:isMobile?10:14,padding:isMobile?'10px':'16px' }}>

          {/* Header */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:isMobile?20:24,color:'#F1C40F',textShadow:'0 0 12px rgba(241,196,15,0.4)',lineHeight:1,margin:0 }}>
                Kartu Batak
              </h1>
              <p style={{ fontSize:10,color:'rgba(241,196,15,0.5)',marginTop:2 }}>Room: {room.room_code}</p>
            </div>
            <div style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap' }}>
              <motion.div key={currentPlayer?.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}}
                style={{ borderRadius:9999,padding:'5px 12px',fontSize:isMobile?10:11,fontWeight:600,
                  background:isMyTurn?'rgba(241,196,15,0.15)':'rgba(0,0,0,0.4)',
                  border:isMyTurn?'1px solid rgba(241,196,15,0.4)':'1px solid rgba(255,255,255,0.1)',
                  color:isMyTurn?'#F1C40F':'rgba(255,255,255,0.4)' }}>
                {isMyTurn?'⚡ Giliranmu!':`⏳ ${currentPlayer?.name}...`}
              </motion.div>
              <button type="button" onClick={()=>setChatOpen(o=>!o)}
                style={{ borderRadius:8,padding:'5px 10px',fontSize:10,fontWeight:600,cursor:'pointer',
                  background:'rgba(0,0,0,0.4)',border:'1px solid rgba(241,196,15,0.2)',color:'rgba(241,196,15,0.7)' }}>
                {chatOpen?'✕ Chat':messages.length>0?`💬 (${messages.length})`:'💬'}
              </button>
            </div>
          </div>

          {/* Opponents */}
          <div style={{ display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center' }}>
            {localGameState.players.filter(p=>p.id!==user.id).map(p=>{
              const isCurrent=currentPlayer?.id===p.id
              return (
                <motion.div key={p.id}
                  animate={{ boxShadow:isCurrent?'0 0 24px rgba(241,196,15,0.5)':'none',borderColor:isCurrent?'rgba(241,196,15,0.6)':'rgba(241,196,15,0.12)' }}
                  style={{ borderRadius:12,padding:isMobile?'8px 10px':'10px 14px',background:'rgba(0,0,0,0.55)',
                    border:'1px solid rgba(241,196,15,0.12)',textAlign:'center',
                    minWidth:isMobile?80:100,flex:isMobile?'1 1 80px':'0 0 auto' }}>
                  <div style={{ fontSize:isMobile?16:20,marginBottom:3 }}>{p.out?'😌':'🧑'}</div>
                  <p style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:isMobile?11:12,color:p.out?'rgba(241,196,15,0.3)':'#F1C40F',margin:0 }}>{p.name}</p>
                  {p.out?<p style={{ fontSize:10,color:'rgba(255,255,255,0.3)' }}>Selamat!</p>
                  :<>
                    <div style={{ display:'flex',justifyContent:'center',marginTop:4,flexWrap:'wrap' }}>
                      {p.hand.slice(0,isMobile?4:6).map((_,i)=>(
                        <div key={i} style={{ marginLeft:i===0?0:-8 }}><CardBack size="sm"/></div>
                      ))}
                    </div>
                    <p style={{ fontSize:10,color:'rgba(241,196,15,0.4)',marginTop:3 }}>{p.hand.length} kartu</p>
                  </>}
                  {isCurrent&&!p.out&&<motion.p animate={{opacity:[1,0.3,1]}} transition={{duration:1,repeat:Infinity}} style={{ fontSize:9,color:'rgba(241,196,15,0.7)',marginTop:2 }}>Berpikir...</motion.p>}
                </motion.div>
              )
            })}
          </div>

          <div style={{ height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.18),transparent)' }}/>

          {/* Neighbor pick */}
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
            <p style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:isMobile?12:13,color:'rgba(241,196,15,0.7)',margin:0,textAlign:'center' }}>
              {isMyTurn?'👇 Pilih 1 kartu dari lawan':'Kartu pemain di kiri'}
            </p>
            <div style={{ display:'flex',justifyContent:'center',flexWrap:'wrap',maxWidth:'100%',overflow:'hidden' }}>
              {neighborPlayer?.hand.map((_,idx)=>(
                <div key={`n-${idx}`} style={{ marginLeft:idx===0?0:isMobile?-10:-8 }}>
                  <CardBack size={isMobile?'sm':'md'} selected={selectedIndex===idx} canClick={isMyTurn}
                    onClick={()=>isMyTurn&&setSelectedIndex(idx)}/>
                </div>
              ))}
              {!neighborPlayer&&<p style={{ fontSize:12,color:'rgba(241,196,15,0.35)' }}>Tidak ada pemain aktif.</p>}
            </div>
            {selectedIndex!=null&&(
              <motion.p initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                style={{ fontSize:10,color:'rgba(241,196,15,0.7)',margin:0 }}>
                Kartu #{selectedIndex+1} dipilih
              </motion.p>
            )}
          </div>

          <div style={{ height:1,background:'linear-gradient(90deg,transparent,rgba(241,196,15,0.18),transparent)' }}/>

          {/* My hand */}
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6 }}>
              <p style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:isMobile?12:13,color:'#F1C40F',margin:0 }}>
                🃏 Kartu Kamu ({myHand.length})
              </p>
              <div style={{ display:'flex',gap:6 }}>
                <motion.button type="button" onClick={handleShuffle}
                  whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                  style={{ borderRadius:9999,padding:isMobile?'6px 12px':'7px 16px',fontSize:isMobile?11:12,fontWeight:700,
                    border:'1px solid rgba(241,196,15,0.3)',background:'rgba(241,196,15,0.08)',
                    color:'rgba(241,196,15,0.8)',cursor:'pointer' }}>
                  🔀 Kocok
                </motion.button>
                <motion.button type="button" onClick={handleDraw} disabled={!isMyTurn||selectedIndex==null}
                  whileHover={isMyTurn&&selectedIndex!=null?{scale:1.05}:{}}
                  style={{ borderRadius:9999,padding:isMobile?'6px 12px':'7px 18px',fontSize:isMobile?11:12,fontWeight:700,border:'none',
                    cursor:isMyTurn&&selectedIndex!=null?'pointer':'not-allowed',
                    background:isMyTurn&&selectedIndex!=null?'linear-gradient(135deg,#a93226,#e74c3c)':'rgba(255,255,255,0.05)',
                    color:isMyTurn&&selectedIndex!=null?'#fff':'rgba(255,255,255,0.2)',
                    boxShadow:isMyTurn&&selectedIndex!=null?'0 0 16px rgba(192,57,43,0.5)':'none' }}>
                  Ambil →
                </motion.button>
              </div>
            </div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:isMobile?4:6,maxWidth:'100%' }}>
              {displayHand.map(card=><CardFace key={card.id} card={card} size={isMobile?'sm':'md'} glow={card.rank==='JOKER'}/>)}
              {myHand.length===0&&(
                <p style={{ fontSize:12,color:'rgba(241,196,15,0.45)',padding:'8px 0' }}>🎉 Kamu sudah bebas!</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat desktop */}
        {!isMobile&&chatOpen&&(
          <div style={{ borderRadius:16,overflow:'hidden',background:'rgba(0,0,0,0.5)',border:'1px solid rgba(241,196,15,0.1)',maxHeight:600 }}>
            <ChatPanel messages={messages} onSend={handleSendMessage} username={username} onClose={()=>setChatOpen(false)}/>
          </div>
        )}
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {localGameState.status==='finished'&&localGameState.loserIndex!=null&&(()=>{
          const loser=localGameState.players[localGameState.loserIndex]
          const loserIsYou=loser?.id===user.id
          return (
            <motion.div style={{ position:'fixed',inset:0,zIndex:40,display:'flex',alignItems:'center',justifyContent:'center',
              padding:16,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(10px)' }}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div initial={{scale:0.75,y:30}} animate={{scale:1,y:0}}
                style={{ width:'100%',maxWidth:420,borderRadius:24,padding:isMobile?'24px 20px':28,textAlign:'center',
                  background:'linear-gradient(160deg,rgba(5,3,1,0.98),rgba(20,10,5,0.98))',
                  border:loserIsYou?'1px solid rgba(192,57,43,0.5)':'1px solid rgba(241,196,15,0.4)',
                  boxShadow:loserIsYou?'0 0 60px rgba(192,57,43,0.4)':'0 0 60px rgba(241,196,15,0.3)' }}>
                <p style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'0.3em',color:'rgba(241,196,15,0.5)',marginBottom:8 }}>Game Over</p>
                <h2 style={{ fontFamily:'Perpetua,Georgia,serif',fontSize:isMobile?24:28,color:loserIsYou?'#e74c3c':'#F1C40F',marginBottom:6 }}>
                  {loserIsYou?'Kamu Kalah! 😈':'Kamu Menang! 🎉'}
                </h2>
                <p style={{ fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:16 }}>
                  {loserIsYou?'Kamu pemegang Joker terakhir.':`${loser?.name} pemegang Joker terakhir.`}
                </p>
                <div style={{ display:'flex',justifyContent:'center',gap:8,marginBottom:20,flexWrap:'wrap' }}>
                  {localGameState.players.map(p=>(
                    <div key={p.id} style={{ borderRadius:10,padding:'7px 12px',minWidth:60,
                      background:p.id===loser?.id?'rgba(192,57,43,0.15)':'rgba(241,196,15,0.07)',
                      border:p.id===loser?.id?'1px solid rgba(192,57,43,0.35)':'1px solid rgba(241,196,15,0.12)' }}>
                      <p style={{ fontSize:11,color:p.id===loser?.id?'#e74c3c':'rgba(241,196,15,0.7)',fontWeight:600,margin:0 }}>{p.name}</p>
                      <p style={{ fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:2 }}>{p.id===loser?.id?'🃏 Kalah':'✓ Selamat'}</p>
                    </div>
                  ))}
                </div>
                {/* Tombol: Main Lagi + Kembali ke Beranda */}
                <div style={{ display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap' }}>
                  <motion.button type="button" onClick={handleLeave}
                    whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                    style={{ borderRadius:9999,padding:'10px 22px',fontSize:13,fontWeight:700,border:'none',cursor:'pointer',
                      background:'linear-gradient(135deg,#a93226,#e74c3c)',color:'#fff',
                      boxShadow:'0 0 20px rgba(192,57,43,0.5)' }}>
                    🔁 Main Lagi
                  </motion.button>
                  <motion.button type="button" onClick={handleHome}
                    whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                    style={{ borderRadius:9999,padding:'10px 22px',fontSize:13,fontWeight:700,cursor:'pointer',
                      border:'1px solid rgba(241,196,15,0.35)',background:'rgba(241,196,15,0.08)',
                      color:'rgba(241,196,15,0.85)' }}>
                    🏠 Beranda
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </section>
  )
}
