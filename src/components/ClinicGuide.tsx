import { useState } from 'react'
import './ClinicGuide.css'

const topics = [
  {
    id: 'hours',
    label: 'Hours & availability',
    answer: 'Consultations are Monday to Friday, 10:00 AM to 3:00 PM, with appointments from 10:30 AM. In-person consultations are paused through 12 October 2026. Please confirm availability before travelling.',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    answer: 'To book an appointment, call reception at 934 934 5538 between 8:00 AM and 6:00 PM. WhatsApp messages may not be seen immediately, and a WhatsApp request is confirmed only when reception replies.',
  },
  {
    id: 'fees',
    label: 'Fees & reviews',
    answer: 'Consultation is ₹400. Review is free within 7 working days, including the consultation day. Please check your review validity with reception.',
  },
  {
    id: 'location',
    label: 'Location',
    answer: 'Orent is near I.T.I. Junction, SH 1, Chengannur, Kerala 689121.',
  },
] as const

type TopicId = (typeof topics)[number]['id']

export default function ClinicGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTopic, setActiveTopic] = useState<TopicId | null>(null)
  const selectedTopic = topics.find((topic) => topic.id === activeTopic)

  return (
    <aside className="clinic-guide" aria-label="Orent clinic guide">
      {isOpen && (
        <div className="guide-panel" id="clinic-guide-panel">
          <div className="guide-panel-header">
            <div>
              <h2>Orent clinic guide</h2>
              <p>Quick answers from clinic information</p>
            </div>
            <button className="guide-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close clinic guide">×</button>
          </div>
          <div className="guide-panel-content">
            <h3>How can we help you plan your visit?</h3>
            <div className="guide-topics">
              {topics.map((topic) => {
                const expanded = activeTopic === topic.id
                return (
                  <div className="guide-topic" key={topic.id}>
                    <button
                      className={`guide-topic-button${expanded ? ' is-active' : ''}`}
                      type="button"
                      id={`guide-topic-${topic.id}`}
                      aria-expanded={expanded}
                      aria-controls={expanded ? `guide-answer-${topic.id}` : undefined}
                      onClick={() => setActiveTopic(expanded ? null : topic.id)}
                    >
                      {topic.label}
                    </button>
                  </div>
                )
              })}
            </div>
            {selectedTopic && (
              <p
                className="guide-answer"
                id={`guide-answer-${selectedTopic.id}`}
                role="region"
                aria-labelledby={`guide-topic-${selectedTopic.id}`}
              >
                {selectedTopic.answer}
              </p>
            )}
          </div>
        </div>
      )}
      <button
        className="guide-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="clinic-guide-panel"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{isOpen ? '×' : '＋'}</span> Clinic guide
      </button>
    </aside>
  )
}
