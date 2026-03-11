/**
 * useSound.js — lightweight Web Audio API sound effects
 * Zero external dependencies, zero network requests
 * Semua suara di-generate procedurally (tidak perlu file .mp3)
 */
import { useCallback, useRef } from 'react'

function createCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(ctx, { freq = 440, type = 'sine', duration = 0.12, gain = 0.18, attack = 0.005, decay = 0.08, startFreq, endFreq }) {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.type = type
    const now = ctx.currentTime

    if (startFreq && endFreq) {
      osc.frequency.setValueAtTime(startFreq, now)
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration)
    } else {
      osc.frequency.setValueAtTime(freq, now)
    }

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(gain, now + attack)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

    osc.start(now)
    osc.stop(now + duration)
  } catch {
    // silent fail
  }
}

export function useSound() {
  const ctxRef = useRef(null)
  const mutedRef = useRef(false)

  // Lazy init context on first user gesture
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = createCtx()
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const setMuted = useCallback((val) => { mutedRef.current = val }, [])
  const getMuted = useCallback(() => mutedRef.current, [])

  // Klik kartu — short soft click
  const playCardClick = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    playTone(ctx, { freq: 600, type: 'triangle', duration: 0.09, gain: 0.14, attack: 0.003, decay: 0.07 })
    playTone(ctx, { freq: 300, type: 'sine', duration: 0.07, gain: 0.06, attack: 0.002, decay: 0.06 })
  }, [getCtx])

  // Ambil kartu dari lawan — satisfying "whoosh" pick
  const playCardPick = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    // Rising whoosh
    playTone(ctx, { startFreq: 220, endFreq: 520, type: 'sine', duration: 0.18, gain: 0.16, attack: 0.01, decay: 0.15 })
    // Soft thud
    playTone(ctx, { freq: 180, type: 'triangle', duration: 0.1, gain: 0.1, attack: 0.005, decay: 0.09 })
  }, [getCtx])

  // Pasang kartu / pair — bright chime
  const playPair = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, { freq, type: 'sine', duration: 0.25, gain: 0.15, attack: 0.01, decay: 0.22 }), i * 60)
    })
  }, [getCtx])

  // Game over menang — fanfare ascending
  const playWin = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    const seq = [523, 659, 784, 1047]
    seq.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, { freq, type: 'sine', duration: 0.3, gain: 0.18, attack: 0.01, decay: 0.28 }), i * 90)
    })
  }, [getCtx])

  // Game over kalah — descending sad
  const playLose = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    const seq = [392, 330, 262, 220]
    seq.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, { freq, type: 'triangle', duration: 0.28, gain: 0.14, attack: 0.01, decay: 0.25 }), i * 100)
    })
  }, [getCtx])

  // Giliran mulai — subtle ping
  const playTurnStart = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    playTone(ctx, { freq: 880, type: 'sine', duration: 0.15, gain: 0.12, attack: 0.005, decay: 0.13 })
    setTimeout(() => playTone(ctx, { freq: 1100, type: 'sine', duration: 0.1, gain: 0.08, attack: 0.005, decay: 0.09 }), 80)
  }, [getCtx])

  // Timer urgent (< 10 detik) — tick
  const playTick = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    playTone(ctx, { freq: 1200, type: 'square', duration: 0.04, gain: 0.07, attack: 0.002, decay: 0.035 })
  }, [getCtx])

  // Joker ketarik — dramatic low thud + high sting
  const playJoker = useCallback(() => {
    if (mutedRef.current) return
    const ctx = getCtx()
    playTone(ctx, { startFreq: 80, endFreq: 40, type: 'sawtooth', duration: 0.35, gain: 0.2, attack: 0.01, decay: 0.32 })
    setTimeout(() => playTone(ctx, { freq: 1400, type: 'sine', duration: 0.2, gain: 0.12, attack: 0.005, decay: 0.18 }), 60)
  }, [getCtx])

  return {
    playCardClick,
    playCardPick,
    playPair,
    playWin,
    playLose,
    playTurnStart,
    playTick,
    playJoker,
    setMuted,
    getMuted,
  }
}
