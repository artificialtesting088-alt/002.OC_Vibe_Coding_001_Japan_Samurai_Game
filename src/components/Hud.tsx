import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { cameraLook, playerTransform } from '../game'
import { getObjective } from '../objective'
import { useGame } from '../store'

export function Hud() {
  const health = useGame((state) => state.health)
  const hurtAt = useGame((state) => state.hurtAt)
  const locked = useGame((state) => state.locked)
  const quest = useGame((state) => state.quest)
  const dialog = useGame((state) => state.dialog)
  const nearNpc = useGame((state) => state.nearNpc)
  const enemiesDefeated = useGame((state) => state.enemiesDefeated)
  const enemiesTotal = useGame((state) => state.enemiesTotal)
  const questRewarded = useGame((state) => state.questRewarded)
  const muted = useGame((state) => state.muted)
  const { active, progress } = useProgress()
  const [hurt, setHurt] = useState(false)
  const arrowRef = useRef<HTMLSpanElement>(null)
  const distanceRef = useRef<HTMLSpanElement>(null)
  const objective = useMemo(
    () => getObjective(enemiesDefeated, enemiesTotal, questRewarded),
    [enemiesDefeated, enemiesTotal, questRewarded],
  )

  useEffect(() => {
    let frame = 0
    const update = () => {
      const [tx, tz] = objective.position
      const dx = tx - playerTransform.position.x
      const dz = tz - playerTransform.position.z
      const distance = Math.hypot(dx, dz) || 0.001
      const forwardX = -Math.sin(cameraLook.yaw)
      const forwardZ = -Math.cos(cameraLook.yaw)
      const rightX = -forwardZ
      const rightZ = forwardX
      const angle = Math.atan2(
        (dx * rightX + dz * rightZ) / distance,
        (dx * forwardX + dz * forwardZ) / distance,
      )
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${angle}rad)`
      if (distanceRef.current) distanceRef.current.textContent = `${Math.round(distance)} m`
      frame = requestAnimationFrame(update)
    }
    update()
    return () => cancelAnimationFrame(frame)
  }, [objective])

  useEffect(() => {
    if (!hurtAt) return
    setHurt(true)
    const timeout = window.setTimeout(() => setHurt(false), 280)
    return () => window.clearTimeout(timeout)
  }, [hurtAt])

  useEffect(() => {
    const onChange = () => {
      useGame.getState().setLocked(!!document.pointerLockElement)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const game = useGame.getState()
      if (game.health <= 0) {
        if (event.code === 'KeyR') game.respawn()
        return
      }
      if (event.code === 'KeyE' && game.dialog) {
        game.advanceDialog()
      }
      if (event.code === 'Escape' && game.dialog) {
        game.closeDialog()
      }
    }
    const onClick = () => {
      const game = useGame.getState()
      if (game.health <= 0) {
        game.respawn()
        return
      }
      if (game.dialog) game.advanceDialog()
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

      <div className="hud__objective">
        <div className="hud__compass">
          <span ref={arrowRef} className="hud__compass-arrow" />
        </div>
        <div className="hud__objective-copy">
          <b>{objective.label}</b>
          <span ref={distanceRef}>—</span>
        </div>
      </div>

      <div className="hud__vitals">
        <div className="bar">
          <span className="bar__label">Nyawa</span>
          <div className="bar__track">
            <div className="bar__fill bar__fill--health" style={{ width: `${health}%` }} />
          </div>
        </div>
      </div>

      {locked && <div className="hud__crosshair" />}

      {muted && <div className="hud__muted">Suara mati · M</div>}

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
        <kbd>F</kbd> / <kbd>Klik</kbd> pukul, ulangi tebas &nbsp;·&nbsp;
        <kbd>E</kbd> bicara &nbsp;·&nbsp;
        <kbd>M</kbd> suara &nbsp;·&nbsp;
        <kbd>Esc</kbd> lepas kursor
      </div>

      {!locked && !dialog && health > 0 && (
        <div className="hud__lock">
          <div className="hud__lock-card">
            <h2>KLIK UNTUK MULAI</h2>
            <p>Kunci kursor untuk menjelajah Jepang feodal</p>
          </div>
        </div>
      )}

      {health <= 0 && (
        <div className="hud__death">
          <h2>GUGUR</h2>
          <p>Tekan R atau klik untuk bangkit kembali.</p>
          <span>Jalan Angin belum berakhir.</span>
        </div>
      )}

      {hurt && <div className="hud__hurt" />}

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
