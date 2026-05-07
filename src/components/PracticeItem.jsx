import rightIcon from '../../Right.svg'
import '../styles/program-title.css'
import './PracticeItem.css'

function PracticeItem({ title, description, active = false, onClick }) {
  void active

  return (
    <button type="button" className="practice-item" onClick={onClick}>
      <span className="practice-item-text">
        <span className="practice-item-title program-title">{title}</span>
        <span className="practice-item-description">{description}</span>
      </span>
      <img src={rightIcon} alt="" aria-hidden="true" className="practice-item-arrow" />
    </button>
  )
}

export default PracticeItem
