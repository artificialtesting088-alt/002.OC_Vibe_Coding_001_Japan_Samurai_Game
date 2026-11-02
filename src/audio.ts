let context: AudioContext | null = null
let master: GainNode | null = null
let ambientLevel: GainNode | null = null
let muted = false
let ambientEnabled = false
let ambientStarted = false

function getContext() {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext
    if (!Ctor) return null
    context = new Ctor()
    master = context.createGain()
    master.gain.value = muted ? 0 : 0.55
    master.connect(context.destination)
    startAmbient(context, master)
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

function startAmbient(ctx: AudioContext, output: GainNode) {
  if (ambientStarted) return
  ambientStarted = true

  const seconds = 4
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let value = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    value = (value + white * 0.02) / 1.02
    data[i] = value * 3.2
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 480
  filter.Q.value = 0.4

  const toneGain = ctx.createGain()
  toneGain.gain.value = 0.05

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.018
  lfo.connect(lfoGain)
  lfoGain.connect(toneGain.gain)

  ambientLevel = ctx.createGain()
  ambientLevel.gain.value = ambientEnabled ? 1 : 0

  source.connect(filter)
  filter.connect(toneGain)
  toneGain.connect(ambientLevel)
  ambientLevel.connect(output)
  source.start()
  lfo.start()
}

function tone(frequency: number, endFrequency: number, duration: number, type: OscillatorType, peak: number, delay = 0) {
  const ctx = getContext()
  if (!ctx || !master) return
  const start = ctx.currentTime + delay
  const oscillator = ctx.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(Math.max(1, frequency), start)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  oscillator.connect(gain)
  gain.connect(master)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.03)
}

function noiseSweep(
  duration: number,
  startFrequency: number,
  endFrequency: number,
  peak: number,
  type: BiquadFilterType = 'bandpass',
  delay = 0,
) {
  const ctx = getContext()
  if (!ctx || !master) return
  const start = ctx.currentTime + delay
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(Math.max(20, startFrequency), start)
  filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration)
  filter.Q.value = 1.1

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(peak, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  source.start(start)
  source.stop(start + duration + 0.02)
}

export function unlockAudio() {
  getContext()
}

export function setAudioMuted(next: boolean) {
  muted = next
  if (!context || !master) return
  master.gain.setTargetAtTime(next ? 0 : 0.55, context.currentTime, 0.02)
}

export function setAmbientEnabled(enabled: boolean) {
  ambientEnabled = enabled
  if (!context || !ambientLevel) return
  ambientLevel.gain.setTargetAtTime(enabled ? 1 : 0, context.currentTime, 0.35)
}

export function playPunch() {
  tone(150, 60, 0.16, 'sine', 0.2)
  noiseSweep(0.08, 900, 240, 0.09, 'lowpass')
}

export function playSlash() {
  noiseSweep(0.28, 2600, 420, 0.19)
  tone(520, 180, 0.18, 'triangle', 0.05)
}

export function playHit() {
  tone(180, 70, 0.12, 'square', 0.07)
  tone(1180, 860, 0.16, 'triangle', 0.05)
  noiseSweep(0.07, 3200, 1400, 0.1)
}

export function playHurt() {
  tone(96, 48, 0.26, 'sawtooth', 0.09)
  noiseSweep(0.14, 520, 120, 0.08, 'lowpass')
}

export function playDeath() {
  tone(150, 42, 0.9, 'sine', 0.16)
  tone(240, 88, 0.6, 'triangle', 0.06)
}

export function playAwaken() {
  tone(82, 48, 1.5, 'sine', 0.2)
  tone(220, 196, 1.0, 'triangle', 0.05, 0.08)
  noiseSweep(0.9, 340, 90, 0.06, 'lowpass')
}

export function playQuest() {
  tone(660, 660, 0.34, 'sine', 0.08)
  tone(990, 990, 0.44, 'sine', 0.07, 0.14)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!context) return
    if (document.hidden) void context.suspend()
    else void context.resume()
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void context?.close()
    context = null
    master = null
    ambientLevel = null
    ambientStarted = false
  })
}
