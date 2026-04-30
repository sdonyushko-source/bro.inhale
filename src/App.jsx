import { useEffect, useState } from 'react'
import './App.css'

const INHALE_DURATION = 4
const HOLD_DURATION = 7
const EXHALE_DURATION = 8
const MIN_ORB_SIZE = 24
const MAX_ORB_SIZE = 120
const COLOR_TRANSITION_DURATION = 0.35
const PHASES = [
  { name: 'inhale', duration: INHALE_DURATION },
  { name: 'hold', duration: HOLD_DURATION },
  { name: 'exhale', duration: EXHALE_DURATION },
]
const CYCLE_DURATION = PHASES.reduce((sum, phase) => sum + phase.duration, 0)
const PHASE_GRADIENTS = {
  inhale: { inner: '#EAFFEC', outer: '#53D162' },
  hold: { inner: '#FFFBF6', outer: '#FFAF46' },
  exhale: { inner: '#E7F5FF', outer: '#43B2FC' },
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function mixHexColors(fromHex, toHex, t) {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const mix = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`
}

function App() {
  const [elapsedInCycleMs, setElapsedInCycleMs] = useState(0)

  useEffect(() => {
    let frameId = 0
    const cycleDurationMs = CYCLE_DURATION * 1000
    const cycleStartMs = performance.now()

    const tick = () => {
      const now = performance.now()
      const cycleElapsedMs = (now - cycleStartMs) % cycleDurationMs
      setElapsedInCycleMs(cycleElapsedMs)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [])

  const elapsedInCycleSec = elapsedInCycleMs / 1000
  let phaseStart = 0
  let currentPhaseIndex = 0
  let currentPhase = PHASES[0]

  for (let i = 0; i < PHASES.length; i += 1) {
    const phase = PHASES[i]
    if (elapsedInCycleSec < phaseStart + phase.duration) {
      currentPhaseIndex = i
      currentPhase = phase
      break
    }
    phaseStart += phase.duration
  }

  const elapsedInPhaseSec = elapsedInCycleSec - phaseStart
  const phaseTimeLeft = currentPhase.duration - elapsedInPhaseSec
  const displayCount = Math.max(1, Math.ceil(phaseTimeLeft))
  const phaseProgress = Math.min(1, elapsedInPhaseSec / currentPhase.duration)

  let orbSize = MAX_ORB_SIZE
  if (currentPhase.name === 'inhale') {
    orbSize = MIN_ORB_SIZE + (MAX_ORB_SIZE - MIN_ORB_SIZE) * phaseProgress
  } else if (currentPhase.name === 'hold') {
    orbSize = MAX_ORB_SIZE
  } else if (currentPhase.name === 'exhale') {
    orbSize = MAX_ORB_SIZE - (MAX_ORB_SIZE - MIN_ORB_SIZE) * phaseProgress
  }

  const orbRadius = orbSize / 2
  const previousPhaseIndex = (currentPhaseIndex - 1 + PHASES.length) % PHASES.length
  const previousPhaseName = PHASES[previousPhaseIndex].name
  const currentGradient = PHASE_GRADIENTS[currentPhase.name]
  const previousGradient = PHASE_GRADIENTS[previousPhaseName]
  const colorTransitionProgress = Math.min(1, elapsedInPhaseSec / COLOR_TRANSITION_DURATION)
  const orbInnerColor = mixHexColors(previousGradient.inner, currentGradient.inner, colorTransitionProgress)
  const orbOuterColor = mixHexColors(previousGradient.outer, currentGradient.outer, colorTransitionProgress)
  const phaseLabel = currentPhase.name
  const secondsText = String(displayCount).padStart(2, '0')

  return (
    <main className="page">
      <section className="card" aria-label="Breathing card">
        <h1 className="title">
          <span className="title-phase">
            <span className="title-phase-value">{phaseLabel}</span>
          </span>
          <span className="title-seconds">
            <span className="title-seconds-value">{secondsText}</span>
          </span>
        </h1>
        <div className="orb-wrap" aria-hidden="true">
          <svg className="orb-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" fill="none">
            <defs>
              <radialGradient id="orbGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 118) rotate(-90) scale(85 70)">
                <stop offset="0" stopColor={orbInnerColor} />
                <stop offset="1" stopColor={orbOuterColor} />
              </radialGradient>
            </defs>
            <circle cx="70" cy="70" r={orbRadius} fill="url(#orbGradient)" />
          </svg>
        </div>
        <div className="status-row">
          <span>left</span>
          <span>3:42</span>
        </div>
        <div className="progress" aria-hidden="true" />
      </section>
    </main>
  )
}

export default App
