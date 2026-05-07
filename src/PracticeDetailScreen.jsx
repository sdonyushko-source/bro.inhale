import logoSvg from './assets/bro-inhale-logo.svg'
import './styles/program-title.css'
import './PracticeDetailScreen.css'
function PracticeDetailScreen({ onBack, onStart, practice }) {
  if (!practice) {
    return null
  }

  const parameters = [{ label: 'duration', value: practice.duration }, ...practice.steps]

  return (
    <main className="practice-detail-page">
      <section className="practice-detail-card" aria-label="Practice detail">
        <div className="practice-detail-content">
          <div className="practice-detail-header screen-header">
            <img src={logoSvg} alt="bro.inhale" className="practice-detail-logo screen-logo" />
            <button type="button" className="practice-detail-back" onClick={onBack}>
              back
            </button>
          </div>
          <h1 className="practice-detail-title program-title">{practice.title}</h1>

          <dl className="practice-detail-params">
            {parameters.map((parameter, index) => (
              <div key={`${parameter.label}-${index}`} className="practice-detail-param-row">
                <dt className="practice-detail-param-label">{parameter.label}</dt>
                <dd className="practice-detail-param-value">{parameter.value}</dd>
              </div>
            ))}
          </dl>

          <p className="practice-detail-short">{practice.description}</p>
          {practice.longDescription ? (
            <p className="practice-detail-long">{practice.longDescription}</p>
          ) : null}
          {practice.bestFor ? <p className="practice-detail-best-for">{practice.bestFor}</p> : null}
        </div>
        <button type="button" className="practice-detail-cta" onClick={onStart}>
          <span>let&apos;s go</span>
        </button>
      </section>
    </main>
  )
}

export default PracticeDetailScreen
