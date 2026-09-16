import { useMemo, useState } from 'react'
import './App.css'

const receptionNumber = '919349345538'

const doctors = [
  { id: 'thomas', name: 'Dr. K. M. Thomas', shortSpecialty: 'Orthopedics', qualification: 'MBBS, D.Ortho', training: 'Govt. Medical College, Thiruvananthapuram, 1981', postgraduate: 'Govt. Medical College, Calicut, 1986', image: '/thomas.jpg' },
  { id: 'susan', name: 'Dr. Susan Thomas', shortSpecialty: 'Ear, nose & throat', qualification: 'MBBS, DLO, MS ENT', training: 'Govt. Medical College, Thiruvananthapuram, 1981', postgraduate: 'Govt. Medical College, Calicut, 1987', image: '/susan.jpg' },
]

const faqs = [
  { question: 'Can I visit without an appointment?', answer: 'Walk-ins are welcome, but calling reception first helps us confirm the doctor’s availability and reduce your waiting time.' },
  { question: 'What should I bring?', answer: 'Please bring any relevant prescriptions, reports, scans, medication lists and a form of identification.' },
  { question: 'How does a review visit work?', answer: 'A review within seven working days, including the consultation day, is free. Please contact reception to arrange it.' },
  { question: 'Can I book by phone?', answer: 'Yes. Call 934 934 5538 and reception will help you find a suitable consultation time.' },
]

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true" className="arrow">{diagonal ? '↗' : '→'}</span>
}

function App() {
  const [specialist, setSpecialist] = useState(doctors[0].id)
  const [visitType, setVisitType] = useState('First consultation')
  const [guideOpen, setGuideOpen] = useState(false)

  const bookingUrl = useMemo(() => {
    const doctor = doctors.find((item) => item.id === specialist) ?? doctors[0]
    const message = `Hello Orent, I would like to request a ${visitType.toLowerCase()} with ${doctor.name} (${doctor.shortSpecialty}). Please share the next available date.`
    return `https://wa.me/${receptionNumber}?text=${encodeURIComponent(message)}`
  }, [specialist, visitType])

  return (
    <div className="site-root">
      <header>
        <div className="topbar"><div className="page-shell topbar-inner"><span>Chengannur, Kerala</span><a href="tel:+919349345538">Call reception · 934 934 5538</a></div></div>
        <nav className="main-nav" aria-label="Main navigation">
          <div className="page-shell nav-inner">
            <a className="wordmark" href="#home" aria-label="Orent home"><strong>orent</strong><span>Illness to wellness</span></a>
            <div className="nav-links"><a href="#care">Our care</a><a href="#doctors">Your doctors</a><a href="#visit">Plan your visit</a></div>
            <a className="button nav-cta" href="#booking">Request appointment <Arrow diagonal /></a>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="page-shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Orthopedic & ENT consultations</p>
              <h1>Expert care.<br />Personal attention.<br /><em>Right here.</em></h1>
              <p className="hero-intro">Care for your bones, joints, ears, nose and throat. Two experienced specialists, with time to listen and help you understand your next step.</p>
              <div className="hero-actions"><a className="button primary" href="#booking">Request an appointment <Arrow diagonal /></a><a className="text-link" href="#doctors">Meet your doctors</a></div>
              <div className="hero-meta"><span>Based in Chengannur</span><span>Walk-ins welcome</span></div>
            </div>
            <div className="hero-visual" aria-label="Dr. K. M. Thomas and Dr. Susan Thomas">
              <p className="visual-caption">Familiar faces. Thoughtful care.</p>
              <figure className="portrait portrait-thomas"><img src="/thomas.jpg" alt="Dr. K. M. Thomas" /><figcaption><strong>Dr. K. M. Thomas</strong><span>Orthopedics</span></figcaption></figure>
              <figure className="portrait portrait-susan"><img src="/susan.jpg" alt="Dr. Susan Thomas" /><figcaption><strong>Dr. Susan Thomas</strong><span>Ear, nose & throat</span></figcaption></figure>
            </div>
          </div>
        </section>

        <aside className="closure-note"><div className="page-shell closure-inner"><div><span>Before you travel</span><p>Consultations are paused through 12 October 2026. Please contact reception to confirm the next available date.</p></div><a href={`https://wa.me/${receptionNumber}?text=${encodeURIComponent('Hello Orent, please confirm your next available consultation date.')}`} target="_blank" rel="noreferrer">Check availability <Arrow diagonal /></a></div></aside>

        <section className="care-section" id="care"><div className="page-shell">
          <div className="section-heading split-heading"><div><p className="eyebrow">Two specialties. One place.</p><h2>Care that starts<br />with <em>you.</em></h2></div><p>Consultation, clear explanations and a treatment plan shaped around your needs.</p></div>
          <div className="specialty-grid">
            <article className="specialty-card orthopedic-card"><div className="card-index">01 / Orthopedics</div><h3>Move with more confidence.</h3><p>Consultation for bone and joint concerns, including knee pain, shoulder stiffness and back pain.</p><ul><li>Bones & joints</li><li>Movement</li><li>Second opinions</li></ul><a href="#booking">Consult Dr. K. M. Thomas <Arrow diagonal /></a></article>
            <article className="specialty-card ent-card"><div className="card-index">02 / Ear, nose & throat</div><h3>Comfort in the everyday.</h3><p>Specialist assessment of ear, nose and throat concerns, with individual advice and follow-up.</p><ul><li>Ear care</li><li>Nose & sinuses</li><li>Throat concerns</li></ul><a href="#booking">Consult Dr. Susan Thomas <Arrow diagonal /></a></article>
          </div>
        </div></section>

        <section className="principle-section" id="principle" aria-labelledby="principle-heading">
          <div className="page-shell principle-grid">
            <div className="principle-heading">
              <p className="eyebrow">Our core principle</p>
              <h2 id="principle-heading">From illness<br />to <em>wellness.</em></h2>
              <div className="principle-mark" aria-hidden="true">＋</div>
            </div>
            <div className="principle-copy">
              <p>At <strong>Orent</strong>, we believe healthcare should be <strong>personalised, preventive and participatory</strong>, with early identification of individual health risks.</p>
              <p>Our approach considers each person’s medical history, lifestyle, environment and personal circumstances. By recognising the early transition from wellness towards disease, we aim to enable timely intervention before illness becomes advanced or causes irreversible changes.</p>
              <p>Through clear information, shared decision-making, regular monitoring and practical preventive measures, we encourage every patient to participate actively in maintaining their health.</p>
              <p>Our objective is not merely to treat established disease, but to help each individual remain mentally alert, physically active and independent for as many years as possible.</p>
            </div>
          </div>
        </section>

        <section className="doctors-section" id="doctors"><div className="page-shell">
          <div className="section-heading split-heading doctor-heading"><div><p className="eyebrow">Your doctors</p><h2>Experience.<br /><em>With a personal touch.</em></h2></div><p>We believe good care begins with a conversation. We work with you to understand your concerns and explain your options.</p></div>
          <div className="doctor-grid">{doctors.map((doctor) => <article className="doctor-card" key={doctor.id}><img src={doctor.image} alt={doctor.name} /><div className="doctor-card-copy"><span>{doctor.shortSpecialty}</span><h3>{doctor.name}</h3><strong>{doctor.qualification}</strong><dl><div><dt>MBBS</dt><dd>{doctor.training}</dd></div><div><dt>Postgraduate training</dt><dd>{doctor.postgraduate}</dd></div></dl></div></article>)}</div>
        </div></section>

        <section className="booking-section" id="booking"><div className="page-shell booking-grid">
          <div className="booking-copy"><p className="eyebrow">A simpler next step</p><h2>Your visit<br />starts <em>here.</em></h2><p>Choose your specialist and open a prepared WhatsApp message. Reception will help you arrange a suitable appointment.</p><div className="booking-note">Your appointment is confirmed only when reception replies. Prefer to speak to someone? <a href="tel:+919349345538">Call 934 934 5538</a>.</div></div>
          <form className="booking-form" onSubmit={(event) => event.preventDefault()}><label htmlFor="specialist">Who would you like to consult?</label><select id="specialist" value={specialist} onChange={(event) => setSpecialist(event.target.value)}>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.shortSpecialty}</option>)}</select><label htmlFor="visit-type">Type of visit</label><select id="visit-type" value={visitType} onChange={(event) => setVisitType(event.target.value)}><option>First consultation</option><option>Follow-up consultation</option><option>Investigation review</option></select><a className="button booking-button" href={bookingUrl} target="_blank" rel="noreferrer">Continue on WhatsApp <Arrow diagonal /></a><small>This opens WhatsApp; no patient information is collected on this page.</small></form>
        </div></section>

        <section className="visit-section" id="visit"><div className="page-shell">
          <div className="section-heading visit-heading"><p className="eyebrow">Plan your visit</p><h2>A little clarity,<br /><em>before you arrive.</em></h2></div>
          <div className="visit-grid">
            <article className="visit-card hours-card"><span>Consultation</span><h3>Monday to Friday</h3><p className="large-detail">10:00 AM to 3:00 PM</p><p>Appointments from 10:30 AM</p><strong>₹400 consultation</strong><small>Free review within 7 working days, including the consultation day. Please confirm availability during the current closure.</small></article>
            <article className="visit-card location-card"><span>Find us</span><h3>Orent, Chengannur</h3><p>Near I.T.I. Junction, SH 1<br />Chengannur, Kerala 689121</p><a href="https://www.google.com/maps/search/?api=1&query=Orent+Clinic+Chengannur" target="_blank" rel="noreferrer">Open in Google Maps <Arrow diagonal /></a><a href="tel:+914792455538">0479 245 5538</a><a href="tel:+919388958498">+91 93889 58498</a><a href="mailto:orentclinic@gmail.com">orentclinic@gmail.com</a></article>
            <article className="visit-card faq-card"><span>Helpful to know</span><div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<b>＋</b></summary><p>{faq.answer}</p></details>)}</div></article>
          </div>
        </div></section>
      </main>

      <footer><div className="page-shell footer-inner"><a className="wordmark footer-wordmark" href="#home"><strong>orent</strong><span>Illness to wellness</span></a><div><p>Orthopedic & ENT consultations</p><span>Chengannur, Kerala · © {new Date().getFullYear()} Orent</span></div></div></footer>

      <div className={`clinic-guide ${guideOpen ? 'guide-open' : ''}`}>{guideOpen && <div className="guide-panel"><button className="guide-close" onClick={() => setGuideOpen(false)} aria-label="Close clinic guide">×</button><span>Clinic guide</span><h2>How can we help?</h2><a href="#booking" onClick={() => setGuideOpen(false)}>Request an appointment <Arrow /></a><a href="tel:+919349345538">Call reception <Arrow /></a><a href="#visit" onClick={() => setGuideOpen(false)}>Plan your visit <Arrow /></a></div>}<button className="guide-toggle" onClick={() => setGuideOpen((open) => !open)} aria-expanded={guideOpen}>{guideOpen ? '×' : '＋'} Clinic guide</button></div>
    </div>
  )
}

export default App
