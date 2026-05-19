import { useEffect, useState } from 'react'
import './App.css'
import SplashScreen from './SplashScreen'
import PracticeListScreen from './PracticeListScreen'
import PracticeDetailScreen from './PracticeDetailScreen'
import PracticeFinishScreen from './PracticeFinishScreen'
import { PRACTICES } from './practices'

const MIN_ORB_SIZE = 24
const MAX_ORB_SIZE = 120
const COLOR_TRANSITION_DURATION = 0.35
const FLOW_CONFIGS = {
  '478': {
    cycles: 16,
    phases: [
      {
        name: 'inhale',
        label: 'inhale',
        duration: 4,
        fromSize: MIN_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'inhale',
      },
      {
        name: 'hold',
        label: 'hold',
        duration: 7,
        fromSize: MAX_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'hold',
      },
      {
        name: 'exhale',
        label: 'exhale',
        duration: 8,
        fromSize: MAX_ORB_SIZE,
        toSize: MIN_ORB_SIZE,
        colorPhase: 'exhale',
      },
    ],
  },
  box: {
    cycles: 19,
    phases: [
      {
        name: 'inhale',
        label: 'inhale',
        duration: 4,
        fromSize: MIN_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'inhale',
      },
      {
        name: 'hold_after_inhale',
        label: 'hold',
        duration: 4,
        fromSize: MAX_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'hold',
      },
      {
        name: 'exhale',
        label: 'exhale',
        duration: 4,
        fromSize: MAX_ORB_SIZE,
        toSize: MIN_ORB_SIZE,
        colorPhase: 'exhale',
      },
      {
        name: 'hold_after_exhale',
        label: 'hold',
        duration: 4,
        fromSize: MIN_ORB_SIZE,
        toSize: MIN_ORB_SIZE,
        colorPhase: 'hold',
      },
    ],
  },
  coherent: {
    cycles: 30,
    phases: [
      {
        name: 'inhale',
        label: 'inhale',
        duration: 5,
        fromSize: MIN_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'inhale',
      },
      {
        name: 'exhale',
        label: 'exhale',
        duration: 5,
        fromSize: MAX_ORB_SIZE,
        toSize: MIN_ORB_SIZE,
        colorPhase: 'exhale',
      },
    ],
  },
  'extended-exhale': {
    cycles: 30,
    phases: [
      {
        name: 'inhale',
        label: 'inhale',
        duration: 4,
        fromSize: MIN_ORB_SIZE,
        toSize: MAX_ORB_SIZE,
        colorPhase: 'inhale',
      },
      {
        name: 'exhale',
        label: 'exhale',
        duration: 6,
        fromSize: MAX_ORB_SIZE,
        toSize: MIN_ORB_SIZE,
        colorPhase: 'exhale',
      },
    ],
  },
}
const COUNTDOWN_STEPS_478 = [
  { label: 'relax', value: 3 },
  { label: 'get ready', value: 2 },
  { label: 'inhale', value: 1 },
]
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

const NBSP = '\u00A0'

function formatTrayStatus(phase, seconds) {
  const phaseLabelMap = {
    inhale: 'inhale',
    hold: 'hold',
    exhale: 'exhale',
  }

  const label = phaseLabelMap[phase] || phase
  const paddedLabel = label.padEnd(6, NBSP)
  const paddedSeconds = String(seconds).padStart(2, '0')

  return `${paddedLabel} ${paddedSeconds}`
}

function getTrayStatusText({
  showSplash,
  showPracticeList,
  showPracticeDetail,
  flowMode,
  activeFlowPhases,
  activeFlowConfig,
  elapsedInCycleMs,
  activeFlowTotalDuration,
  activeFlowCycleDuration,
}) {
  if (showSplash || showPracticeList || showPracticeDetail) {
    return 'bro.inhale'
  }

  if (flowMode === 'paused') {
    return 'paused'
  }

  if (flowMode === 'finished') {
    return 'done'
  }

  if (!activeFlowConfig || flowMode !== 'running') {
    return 'bro.inhale'
  }

  const elapsedInCycleSec = elapsedInCycleMs / 1000
  const flowElapsedInSec = Math.min(elapsedInCycleSec, activeFlowTotalDuration)
  const elapsedInTestCycleSec =
    flowElapsedInSec >= activeFlowTotalDuration
      ? activeFlowCycleDuration - 0.001
      : flowElapsedInSec % activeFlowCycleDuration
  let phaseStart = 0
  let currentPhase = activeFlowPhases[0]

  for (let i = 0; i < activeFlowPhases.length; i += 1) {
    const phase = activeFlowPhases[i]
    if (elapsedInTestCycleSec < phaseStart + phase.duration) {
      currentPhase = phase
      break
    }
    phaseStart += phase.duration
  }

  const elapsedInPhaseSec = elapsedInTestCycleSec - phaseStart
  const phaseTimeLeft = currentPhase.duration - elapsedInPhaseSec
  const displayCount = Math.max(1, Math.ceil(phaseTimeLeft))
  const { colorPhase } = currentPhase

  if (colorPhase !== 'inhale' && colorPhase !== 'hold' && colorPhase !== 'exhale') {
    return 'bro.inhale'
  }

  return formatTrayStatus(colorPhase, displayCount)
}

function getTraySessionState(flowMode) {
  if (flowMode === 'running') return 'running'
  if (flowMode === 'paused') return 'paused'
  if (flowMode === 'finished') return 'finished'
  return 'idle'
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
  const activeFlowConfig = activeFlowPracticeId ? FLOW_CONFIGS[activeFlowPracticeId] : null
  const activeFlowPhases = activeFlowConfig?.phases ?? []
  const activeFlowCycleDuration = activeFlowPhases.reduce((sum, phase) => sum + phase.duration, 0)
  const activeFlowTotalDuration = activeFlowCycleDuration * (activeFlowConfig?.cycles ?? 0)

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShowSplash(false)
      setShowPracticeList(true)
    }, 1800)

    return () => clearTimeout(timerId)
  }, [])

  useEffect(() => {
    const trayApi = window.broInhaleTray
    if (!trayApi) {
      return undefined
    }

    const unsubscribePause = trayApi.onPause(() => {
      setFlowMode((mode) => {
        if (mode === 'running') return 'paused'
        if (mode === 'paused') return 'running'
        return mode
      })
    })

    const unsubscribeRestart = trayApi.onRestart(() => {
      setActiveFlowPracticeId((practiceId) => {
        if (!practiceId) {
          return practiceId
        }
        setCountdownIndex(0)
        setElapsedInCycleMs(0)
        setFlowMode('countdown')
        return practiceId
      })
    })

    return () => {
      unsubscribePause()
      unsubscribeRestart()
    }
  }, [])

  useEffect(() => {
    const statusText = getTrayStatusText({
      showSplash,
      showPracticeList,
      showPracticeDetail,
      flowMode,
      activeFlowPhases,
      activeFlowConfig,
      elapsedInCycleMs,
      activeFlowTotalDuration,
      activeFlowCycleDuration,
    })
    window.broInhaleTray?.updateStatus?.(statusText)
    window.broInhaleTray?.updateSessionState?.(getTraySessionState(flowMode))
  }, [
    showSplash,
    showPracticeList,
    showPracticeDetail,
    flowMode,
    activeFlowPhases,
    activeFlowConfig,
    elapsedInCycleMs,
    activeFlowTotalDuration,
    activeFlowCycleDuration,
  ])

  useEffect(() => {
    if (!activeFlowConfig || flowMode !== 'countdown') {
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
  }, [activeFlowConfig, flowMode, countdownIndex])

  useEffect(() => {
    if (
      showSplash ||
      showPracticeList ||
      showPracticeDetail ||
      !activeFlowConfig ||
      flowMode !== 'running'
    ) {
      return undefined
    }

    let frameId = 0
    const testDurationMs = activeFlowTotalDuration * 1000
    const flowStartMs = performance.now() - elapsedInCycleMs

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
  }, [
    showSplash,
    showPracticeList,
    showPracticeDetail,
    activeFlowConfig,
    flowMode,
    activeFlowTotalDuration,
    elapsedInCycleMs,
  ])

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
          if (
            selectedPracticeId === '478' ||
            selectedPracticeId === 'box' ||
            selectedPracticeId === 'coherent' ||
            selectedPracticeId === 'extended-exhale'
          ) {
            setActiveFlowPracticeId(selectedPracticeId)
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

  if (activeFlowConfig && flowMode === 'countdown') {
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

  if (activeFlowConfig && flowMode === 'finished') {
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

  const handleCloseFlow = () => {
    setFlowMode('idle')
    setActiveFlowPracticeId(null)
    setElapsedInCycleMs(0)
    setCountdownIndex(0)
    setShowPracticeDetail(false)
    setShowPracticeList(true)
  }

  if (!activeFlowConfig || (flowMode !== 'running' && flowMode !== 'paused')) {
    return null
  }

  const elapsedInCycleSec = elapsedInCycleMs / 1000
  const flowElapsedInSec = Math.min(elapsedInCycleSec, activeFlowTotalDuration)
  const elapsedInTestCycleSec =
    flowElapsedInSec >= activeFlowTotalDuration
      ? activeFlowCycleDuration - 0.001
      : flowElapsedInSec % activeFlowCycleDuration
  let phaseStart = 0
  let currentPhaseIndex = 0
  let currentPhase = activeFlowPhases[0]

  for (let i = 0; i < activeFlowPhases.length; i += 1) {
    const phase = activeFlowPhases[i]
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

  const orbSize = currentPhase.fromSize + (currentPhase.toSize - currentPhase.fromSize) * phaseProgress

  const orbRadius = orbSize / 2
  const previousPhaseIndex = (currentPhaseIndex - 1 + activeFlowPhases.length) % activeFlowPhases.length
  const previousPhaseName = activeFlowPhases[previousPhaseIndex].colorPhase
  const currentGradient = PHASE_GRADIENTS[currentPhase.colorPhase]
  const previousGradient = PHASE_GRADIENTS[previousPhaseName]
  const colorTransitionProgress = Math.min(1, elapsedInPhaseSec / COLOR_TRANSITION_DURATION)
  const orbInnerColor = mixHexColors(previousGradient.inner, currentGradient.inner, colorTransitionProgress)
  const orbOuterColor = mixHexColors(previousGradient.outer, currentGradient.outer, colorTransitionProgress)
  const phaseLabel = currentPhase.label
  const secondsText = String(displayCount).padStart(2, '0')
  const practiceProgress = Math.min(flowElapsedInSec / activeFlowTotalDuration, 1)
  const practiceProgressPercent = practiceProgress * 100
  const progressBarBackground = `linear-gradient(90deg, #d5d7df 0%, #d5d7df ${practiceProgressPercent}%, #3a3c48 ${practiceProgressPercent}%, #3a3c48 100%)`
  const remainingPracticeSeconds = Math.max(Math.ceil(activeFlowTotalDuration - flowElapsedInSec), 0)
  const displayTime = formatSecondsToClock(remainingPracticeSeconds)
  const isPaused = flowMode === 'paused'

  return (
    <main className="page">
      <section
        className={`card${isPaused ? ' paused-screen' : ''}`}
        aria-label="Breathing card"
        onClick={() => setFlowMode(isPaused ? 'running' : 'paused')}
      >
        {isPaused ? (
          <>
            <button
              type="button"
              className="paused-close-button"
              aria-label="Close"
              onClick={(event) => {
                event.stopPropagation()
                handleCloseFlow()
              }}
            >
              close
            </button>
            <h1 className="title">
              <span className="title-phase">
                <span className="title-phase-value">paused</span>
              </span>
              <span className="title-seconds" aria-hidden="true">
                <span className="title-seconds-value">--</span>
              </span>
            </h1>
          </>
        ) : (
          <h1 className="title">
            <span className="title-phase">
              <span className="title-phase-value">{phaseLabel}</span>
            </span>
            <span className="title-seconds">
              <span className="title-seconds-value">{secondsText}</span>
            </span>
          </h1>
        )}
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
          <div
            className={`orb-paused-overlay${isPaused ? ' orb-paused-overlay--visible' : ''}`}
            style={{ width: `${orbSize}px`, height: `${orbSize}px` }}
          />
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
