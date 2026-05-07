import { useEffect, useState } from 'react'
import './App.css'
import SplashScreen from './SplashScreen'
import PracticeListScreen from './PracticeListScreen'
import PracticeDetailScreen from './PracticeDetailScreen'
import PracticeFinishScreen from './PracticeFinishScreen'
import { PRACTICES } from './practices'

const INHALE_DURATION = 4
const HOLD_DURATION = 7
const EXHALE_DURATION = 8
const TEST_CYCLES_478 = 16
const MIN_ORB_SIZE = 24
const MAX_ORB_SIZE = 120
const COLOR_TRANSITION_DURATION = 0.35
const PHASES = [
  { name: 'inhale', duration: INHALE_DURATION },
  { name: 'hold', duration: HOLD_DURATION },
  { name: 'exhale', duration: EXHALE_DURATION },
]
const COUNTDOWN_STEPS_478 = [
  { label: 'relax', value: 3 },
  { label: 'get ready', value: 2 },
  { label: 'inhale', value: 1 },
]
const CYCLE_DURATION = PHASES.reduce((sum, phase) => sum + phase.duration, 0)
const TEST_FLOW_478_DURATION = CYCLE_DURATION * TEST_CYCLES_478
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

function formatSecondsToClock(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [showPracticeList, setShowPracticeList] = useState(false)
  const [showPracticeDetail, setShowPracticeDetail] = useState(false)
  const [selectedPracticeId, setSelectedPracticeId] = useState('box')
  const [activeFlowPracticeId, setActiveFlowPracticeId] = useState(null)
  const [flowMode, setFlowMode] = useState('idle')
  const [countdownIndex, setCountdownIndex] = useState(0)
  const [elapsedInCycleMs, setElapsedInCycleMs] = useState(0)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShowSplash(false)
      setShowPracticeList(true)
    }, 1800)

    return () => clearTimeout(timerId)
  }, [])

  useEffect(() => {
    if (activeFlowPracticeId !== '478' || flowMode !== 'countdown') {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      if (countdownIndex < COUNTDOWN_STEPS_478.length - 1) {
        setCountdownIndex((index) => index + 1)
      } else {
        setElapsedInCycleMs(0)
        setFlowMode('running')
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [activeFlowPracticeId, flowMode, countdownIndex])

  useEffect(() => {
    if (
      showSplash ||
      showPracticeList ||
      showPracticeDetail ||
      activeFlowPracticeId !== '478' ||
      flowMode !== 'running'
    ) {
      return undefined
    }

    let frameId = 0
    const testDurationMs = TEST_FLOW_478_DURATION * 1000
    const flowStartMs = performance.now()

    const tick = () => {
      const now = performance.now()
      const flowElapsedMs = now - flowStartMs
      const cappedElapsedMs = Math.min(flowElapsedMs, testDurationMs)
      setElapsedInCycleMs(cappedElapsedMs)

      if (flowElapsedMs < testDurationMs) {
        frameId = requestAnimationFrame(tick)
      } else {
        setFlowMode('finished')
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [showSplash, showPracticeList, showPracticeDetail, activeFlowPracticeId, flowMode])

  if (showSplash) {
    return <SplashScreen />
  }

  if (showPracticeList) {
    return (
      <PracticeListScreen
        onPracticeSelect={(practiceId) => {
          setSelectedPracticeId(practiceId)
          setShowPracticeList(false)
          setShowPracticeDetail(true)
        }}
      />
    )
  }

  if (showPracticeDetail) {
    const selectedPractice = PRACTICES.find((practice) => practice.id === selectedPracticeId)
    return (
      <PracticeDetailScreen
        practice={selectedPractice}
        onStart={() => {
          if (selectedPracticeId === '478') {
            setActiveFlowPracticeId('478')
            setCountdownIndex(0)
            setElapsedInCycleMs(0)
            setFlowMode('countdown')
            setShowPracticeDetail(false)
          }
        }}
        onBack={() => {
          setShowPracticeDetail(false)
          setShowPracticeList(true)
        }}
      />
    )
  }

  if (activeFlowPracticeId === '478' && flowMode === 'countdown') {
    const step = COUNTDOWN_STEPS_478[countdownIndex]

    return (
      <main className="page">
        <section className="card countdown-card" aria-label="Breathing countdown">
          <div className="countdown-label">{step.label}</div>
          <div className="countdown-number">{step.value}</div>
        </section>
      </main>
    )
  }

  if (activeFlowPracticeId === '478' && flowMode === 'finished') {
    return (
      <PracticeFinishScreen
        onClose={() => {
          setFlowMode('idle')
          setActiveFlowPracticeId(null)
          setElapsedInCycleMs(0)
          setCountdownIndex(0)
          setShowPracticeDetail(false)
          setShowPracticeList(true)
        }}
      />
    )
  }

  const elapsedInCycleSec = elapsedInCycleMs / 1000
  const flowElapsedInSec = Math.min(elapsedInCycleSec, TEST_FLOW_478_DURATION)
  const elapsedInTestCycleSec =
    flowElapsedInSec >= TEST_FLOW_478_DURATION ? CYCLE_DURATION - 0.001 : flowElapsedInSec % CYCLE_DURATION
  let phaseStart = 0
  let currentPhaseIndex = 0
  let currentPhase = PHASES[0]

  for (let i = 0; i < PHASES.length; i += 1) {
    const phase = PHASES[i]
    if (elapsedInTestCycleSec < phaseStart + phase.duration) {
      currentPhaseIndex = i
      currentPhase = phase
      break
    }
    phaseStart += phase.duration
  }

  const elapsedInPhaseSec = elapsedInTestCycleSec - phaseStart
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
  const practiceProgress = Math.min(flowElapsedInSec / TEST_FLOW_478_DURATION, 1)
  const practiceProgressPercent = practiceProgress * 100
  const progressBarBackground = `linear-gradient(90deg, #d5d7df 0%, #d5d7df ${practiceProgressPercent}%, #3a3c48 ${practiceProgressPercent}%, #3a3c48 100%)`
  const remainingPracticeSeconds = Math.max(Math.ceil(TEST_FLOW_478_DURATION - flowElapsedInSec), 0)
  const displayTime = formatSecondsToClock(remainingPracticeSeconds)

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
          <span>{displayTime}</span>
        </div>
        <div className="progress" aria-hidden="true" style={{ background: progressBarBackground }} />
      </section>
    </main>
  )
}

export default App
