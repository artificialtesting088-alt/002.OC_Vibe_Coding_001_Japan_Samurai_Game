import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useGame } from '../store'

export function Hud() {
  const health = useGame((state) => state.health)
  const stamina = useGame((state) => state.stamina)
  const sprinting = useGame((state) => state.sprinting)
  const locked = useGame((state) => state.locked)
  const quest = useGame((state) => state.quest)
  const dialog = useGame((state) => state.dialog)
  const nearNpc = useGame((state) => state.nearNpc)
  const { active, progress } = useProgress()

  useEffect(() => {
    const onChange = () => {
      useGame.getState().setLocked(!!document.pointerLockElement)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'KeyE' && useGame.getState().dialog) {
        useGame.getState().advanceDialog()
      }
      if (event.code === 'Escape' && useGame.getState().dialog) {
        useGame.getState().closeDialog()
      }
    }
    const onClick = () => {
      if (useGame.getState().dialog) useGame.getState().advanceDialog()
    }

    document.addEventListener('pointerlockchange', onChange)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onClick)
    }
  }, [])

  return (
    <div className="hud">
      <div className="hud__title">
        <h1>風の道</h1>
        <span>Kaze no Michi · Jalan Angin</span>
      </div>

      <div className="hud__quest">
        <b>Tujuan</b>
        {quest}
      </div>

      <div className="hud__vitals">
        <div className="bar">
          <span className="bar__label">Nyawa</span>
          <div className="bar__track">
            <div className="bar__fill bar__fill--health" style={{ width: `${health}%` }} />
          </div>
        </div>
        <div className="bar">
          <span className="bar__label">{sprinting ? 'Lari' : 'Stamina'}</span>
          <div className="bar__track">
            <div className="bar__fill bar__fill--stamina" style={{ width: `${stamina}%` }} />
          </div>
        </div>
      </div>

      {locked && <div className="hud__crosshair" />}

      {nearNpc && !dialog && <div className="hud__talk">[E] Bicara dengan {nearNpc}</div>}

      {dialog && (
        <div className="hud__dialog">
          <div className="hud__dialog-name">{dialog.name}</div>
          <p>{dialog.lines[dialog.index]}</p>
          <div className="hud__dialog-hint">E / klik untuk lanjut</div>
        </div>
      )}

      <div className="hud__hint">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> gerak &nbsp;·&nbsp;
        <kbd>Shift</kbd> lari &nbsp;·&nbsp;
        <kbd>Space</kbd> lompat &nbsp;·&nbsp;
        <kbd>E</kbd> bicara &nbsp;·&nbsp;
        <kbd>Klik</kbd> kunci kursor &nbsp;·&nbsp;
        <kbd>Esc</kbd> lepas kursor
      </div>

      {!locked && !dialog && (
        <div className="hud__lock">
          <div className="hud__lock-card">
            <h2>KLIK UNTUK MULAI</h2>
            <p>Kunci kursor untuk menjelajah Jepang feodal</p>
          </div>
        </div>
      )}

      {active && (
        <div className="hud__loading">
          <div className="hud__loading-card">
            <h2>風の道</h2>
            <p>Memuat dunia… {Math.round(progress)}%</p>
            <div className="hud__loading-track">
              <div className="hud__loading-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
