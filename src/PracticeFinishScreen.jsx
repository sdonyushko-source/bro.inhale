import './PracticeFinishScreen.css'

function PracticeFinishScreen({ onClose }) {
  return (
    <main className="page">
      <section className="card practice-finish-screen" aria-label="Practice finished">
        <div className="practice-finish-content">
          <h1 className="practice-finish-title">nice, bro!</h1>
          <p className="practice-finish-text">take a moment before moving on. done!</p>
        </div>
        <button type="button" className="practice-finish-close-button" onClick={onClose}>
          close
        </button>
      </section>
    </main>
  )
}

export default PracticeFinishScreen
