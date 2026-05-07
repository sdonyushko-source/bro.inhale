import './SplashScreen.css'
import logoSvg from './assets/bro-inhale-logo.svg'

function SplashScreen() {
  return (
    <main className="splash-page" aria-label="Loading screen">
      <section className="splash-card" aria-label="Splash card">
        <img src={logoSvg} alt="bro.inhale" className="splash-logo" />
        <div className="splash-orb-wrap" aria-hidden="true">
          <div className="splash-orb" />
        </div>
      </section>
    </main>
  )
}

export default SplashScreen
