#!/usr/bin/env node
/**
 * patch-game.mjs — tambahkan useSound + useDailyBonus ke Game.jsx
 * Jalankan: node patch-game.mjs
 */

import { readFileSync, writeFileSync } from 'fs'

const FILE = `${process.env.HOME}/bataker-project/src/pages/Game.jsx`
let src = readFileSync(FILE, 'utf8')

// ── 1. Tambah imports
src = src.replace(
  `import { supabase } from '../lib/supabase.js'`,
  `import { supabase } from '../lib/supabase.js'
import { useSound } from '../hooks/useSound.js'
import { useDailyBonus } from '../hooks/useDailyBonus.js'`
)

// ── 2. Tambah hook inits setelah statsUpdated ref
src = src.replace(
  `const statsUpdated = useRef(false)`,
  `const statsUpdated = useRef(false)
  const { playWin, playLose, playCardClick, playCardPick, playPair, playJoker } = useSound()
  const { recordGamePlayed } = useDailyBonus(user?.id)`
)

// ── 3. Tambah sound + recordGamePlayed di useEffect finished
src = src.replace(
  `      await supabase.from('profiles').update({
        games_played: (data.games_played || 0) + 1,
        games_won: (data.games_won || 0) + (iLost ? 0 : 1),
        games_lost: (data.games_lost || 0) + (iLost ? 1 : 0),
      }).eq('id', user.id)
      refreshProfile()
    }
    run()
  }, [state.status, user])`,
  `      await supabase.from('profiles').update({
        games_played: (data.games_played || 0) + 1,
        games_won: (data.games_won || 0) + (iLost ? 0 : 1),
        games_lost: (data.games_lost || 0) + (iLost ? 1 : 0),
      }).eq('id', user.id)
      refreshProfile()
      // Sound
      if (iLost) playLose(); else playWin()
      // Misi harian
      await recordGamePlayed(!iLost, false)
    }
    run()
  }, [state.status, user])`
)

writeFileSync(FILE, src, 'utf8')
console.log('✅ Game.jsx berhasil di-patch!')
console.log('   - useSound (playWin, playLose) ✓')
console.log('   - useDailyBonus recordGamePlayed ✓')
