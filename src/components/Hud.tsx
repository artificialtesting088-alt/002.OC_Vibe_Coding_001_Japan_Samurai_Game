import { useEffect } from 'react'
import { useGame } from '../store'

export function Hud() {
  const health = useGame((state) => state.health)
  const stamina = useGame((state) => state.stamina)
  const sprinting = useGame((state) => state.sprinting)
  const locked = useGame((state) => state.locked)
  const quest = useGame((state) => state.quest)

  useEffect(() => {
    const onChange = () => {
      useGame.getState().setLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
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

      <div className="hud__hint">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> gerak &nbsp;·&nbsp;
        <kbd>Shift</kbd> lari &nbsp;·&nbsp;
        <kbd>Klik</kbd> serang &nbsp;·&nbsp;
        geser mouse untuk kamera &nbsp;·&nbsp; <kbd>Esc</kbd> lepas kursor
      </div>

      {!locked && (
        <div className="hud__lock">
          <div className="hud__lock-card">
            <h2>KLIK UNTUK MULAI</h2>
            <p>Kunci kursor untuk menjelajah Jepang feodal</p>
          </div>
        </div>
      )}
    </div>
  )
}
