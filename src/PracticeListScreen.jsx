import { useState } from 'react'
import logoSvg from './assets/bro-inhale-logo.svg'
import PracticeItem from './components/PracticeItem'
import { PRACTICES } from './practices'
import './PracticeListScreen.css'

function PracticeListScreen({ onPracticeSelect }) {
  const [activePracticeId, setActivePracticeId] = useState('box')

  return (
    <main className="practice-page">
      <section className="practice-card" aria-label="Practice list">
        <div className="practice-header screen-header">
          <img src={logoSvg} alt="bro.inhale" className="practice-logo screen-logo" />
        </div>
        <div className="practice-list-scroll-area">
          <div className="practice-list">
            {PRACTICES.map((practice, index) => (
              <div key={practice.id} className="practice-list-row">
                <PracticeItem
                  title={practice.title}
                  description={practice.description}
                  active={activePracticeId === practice.id}
                  onClick={() => {
                    setActivePracticeId(practice.id)
                    if (onPracticeSelect) {
                      onPracticeSelect(practice.id)
                    }
                  }}
                />
                {index < PRACTICES.length - 1 ? <div className="practice-divider" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default PracticeListScreen
