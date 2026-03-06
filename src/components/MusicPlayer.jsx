import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { motion } from 'framer-motion'

const PLAYLIST = [
  { title: 'Poker Player', src: '/music/poker-player.mp3' },
  { title: 'Las Vegas', src: '/music/las-vegas.mp3' },
  { title: 'Robbery of The Century', src: '/music/robbery-of-the-century.mp3' },
]

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const soundRef = useRef(null)

  const currentTrack = PLAYLIST[currentIndex]

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload()
      soundRef.current = null
    }

    const sound = new Howl({
      src: [currentTrack.src],
      loop: false,
      volume,
      onend: () => {
        setCurrentIndex((prev) => (prev + 1) % PLAYLIST.length)
        setIsPlaying(true)
      },
    })
    soundRef.current = sound

    if (isPlaying) {
      sound.seek(0)
      sound.play()
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
        soundRef.current = null
      }
    }
  }, [currentTrack.src])

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(volume)
    }
  }, [volume])

  const togglePlay = () => {
    const sound = soundRef.current
    if (!sound) return
    if (isPlaying) {
      sound.pause()
      setIsPlaying(false)
    } else {
      sound.seek(0)
      sound.play()
      setIsPlaying(true)
    }
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % PLAYLIST.length)
    setIsPlaying(true)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? PLAYLIST.length - 1 : prev - 1,
    )
    setIsPlaying(true)
  }

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-40">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-brandGold/60 bg-black/80 text-lg text-brandGold shadow-md backdrop-blur dark:bg-brandNavy/80"
      >
        🎵
      </button>
      <motion.div
        initial={false}
        animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.2 }}
      >
        {isOpen && (
          <div className="flex items-center gap-3 rounded-2xl border border-brandGold/40 bg-black/80 px-3 py-2 text-xs text-brandGold shadow-lg backdrop-blur dark:bg-brandNavy/80">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brandRed text-white shadow shadow-brandRed/40"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-brandGold/40 text-[11px] text-brandGold hover:bg-brandGold/10"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-brandGold/40 text-[11px] text-brandGold hover:bg-brandGold/10"
            >
              ⏭
            </button>
            <div className="flex items-center gap-2">
              <motion.div
                className="flex h-7 w-7 items-center justify-center rounded-full border border-brandGold/50 bg-black/60"
                animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  isPlaying
                    ? { repeat: Infinity, duration: 4, ease: 'linear' }
                    : { duration: 0.3 }
                }
              >
                🎵
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-brandGold">
                  {currentTrack.title}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-brandGold/70">Vol</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="h-1 w-20 accent-brandGold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}


