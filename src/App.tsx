import { useState } from 'react'
import './App.css'
import ml from './locales/ml'

const en = {
  announcement: 'Announcement: Our consultation services at the centre are temporarily closed and will resume on October 8th, 2025. However, teleconsultation services remain available for existing patients. For further information or assistance, please contact us at 934 934 5538. We appreciate your understanding and continued trust.',
  nav: {
    home: 'Home',
    about: 'About Us',
    services: 'Services',
    doctors: 'Doctors',
    appointments: 'Appointments',
    contact: 'Contact',
    whatsapp: 'WhatsApp'
  },
  hero: {
    title: 'Orthopedic & ENT Care in Chengannur',
    subtitle: 'Dr. K. M. Thomas – Orthopedic Surgeon | Dr. Susan Thomas – ENT Specialist',
    book: 'Book Appointment',
    call: 'Call Now'
  },
  aboutTitle: 'About Us',
  aboutWelcome: 'Welcome! We redefine healthcare by offering a holistic approach and prevention that transcends conventional treatment. Our mission is to provide expert care in Orthopaedics and ENT while focusing on enhancing your overall quality of life and longevity. We view each patient as a unique individual deserving personalized attention. Our commitment goes beyond addressing immediate health concerns; we strive to improve your health span and lifespan, ensuring a comprehensive approach to your well-being. With a foundation built on medical excellence and unwavering ethical standards, we take pride in delivering top-quality healthcare.',
  aboutRelationship: `We believe that a strong, trusting doctor-patient relationship is essential for effective treatment and long-term health. Here at Orent Consultations, you're more than just a patient - you're an active partner in your health journey. Together, we'll work towards achieving your best possible health outcomes.`,
  servicesTitle: 'Our Services',
  services: {
    ortho: 'Orthopedics',
    ent: 'ENT',
    procedures: 'Minor Procedures'
  },
  doctorsTitle: 'Meet the Doctors',
  drThomas: {
    name: 'Dr. K. M. Thomas',
    qual: 'MBBS, D.Ortho',
    details: '<span class="degree-label">MBBS</span>: Govt. Medical College, Thiruvananthapuram, 1981<br /><span class="degree-label">PG</span>: Govt. Medical College, Calicut, 1986',
    spec: 'Bone and Joint diseases'
  },
  drSusan: {
    name: 'Dr. Susan Thomas',
    qual: 'MBBS, DLO, MS. ENT',
    details: '<span class="degree-label">MBBS</span>: Govt. Medical College, Thiruvananthapuram, 1981<br /><span class="degree-label">PG</span>: Govt. Medical College, Calicut, 1987',
    spec: 'Ear, Nose, Throat (ENT)'
  },
  viewProfile: 'View Profile',
  appointmentTitle: 'Book an Appointment',
  appointment: {
    name: 'Name',
    phone: 'Phone',
    choose: 'Choose Doctor',
    ortho: 'Orthopedic',
    ent: 'ENT',
    date: 'Preferred Date & Time',
    submit: 'Submit'
  },
  hoursTitle: 'Clinic Hours & Fees',
  testimonialsTitle: 'Testimonials',
  contactTitle: 'Location & Contact',
  contact: {
    address: 'Chengannur, Kerala, India',
    phone: 'Phone',
    website: 'orentclinic.com',
    whatsapp: 'WhatsApp'
  },
  footer: {
    privacy: 'Privacy Policy',
    terms: 'Terms',
    sitemap: 'Sitemap',
    copyright: `© ${new Date().getFullYear()} Orent Clinic. All rights reserved.`
  }
}

function App() {
  const [lang, setLang] = useState('EN')
  const strings = lang === 'ML' ? ml : en

  return (
    <div className="orent-root">
      {/* Announcement Section */}
      <section className="announcement-section">
        {strings.announcement}
      </section>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Orent Consultation</span>
          <span className="tagline">Orthopedic & ENT Care, Chengannur, Kerala, India</span>
        </div>
        <ul className="navbar-right">
          <li><a href="#home">{strings.nav.home}</a></li>
          <li><a href="#about">{strings.nav.about}</a></li>
          <li><a href="#services">{strings.nav.services}</a></li>
          <li><a href="#doctors">{strings.nav.doctors}</a></li>
          <li><a href="#appointments">{strings.nav.appointments}</a></li>
          <li><a href="#contact">{strings.nav.contact}</a></li>
          <li><a href="https://wa.me/919349345538" target="_blank" rel="noopener noreferrer" className="whatsapp-icon">💬</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1>{strings.hero.title}</h1>
          <h2>{strings.hero.subtitle}</h2>
          <div className="hero-cta">
            <button className="cta-btn">{strings.hero.book}</button>
            <a href="tel:9349345538" className="cta-btn secondary">{strings.hero.call}</a>
          </div>
        </div>
      </section>

      {/* About the Clinic */}
      <section className="about-section" id="about">
        <div className="about-content">
          <h2>{strings.aboutTitle}</h2>
          <p>{strings.aboutWelcome}</p>
          <p>{strings.aboutRelationship}</p>
        </div>
      </section>

      {/* Our Services */}
      <section className="services-section" id="services">
        <h2>{strings.servicesTitle}</h2>
        <div className="services-grid">
          <div className="service-item"><span role="img" aria-label="Orthopedics">🦴</span><p>{strings.services.ortho}</p></div>
          <div className="service-item"><span role="img" aria-label="ENT">👂</span><p>{strings.services.ent}</p></div>
          <div className="service-item"><span role="img" aria-label="Procedures">🩺</span><p>{strings.services.procedures}</p></div>
        </div>
      </section>

      {/* Meet the Doctors */}
      <section className="doctors-section" id="doctors">
        <h2>{strings.doctorsTitle}</h2>
        <div className="doctors-cards">
          <div className="doctor-card">
            <div className="doctor-card-left">
              <img src="/thomas.jpg" />
              <a href="#" className="profile-link">{strings.viewProfile}</a>
            </div>
            <div className="doctor-card-right">
              <h3 style={{textAlign: 'left'}}>{strings.drThomas.name}</h3>
              <p>{strings.drThomas.qual}</p>
              <p style={{margin: '0.3em 0 0.5em 0', fontSize: '0.98em'}} dangerouslySetInnerHTML={{__html: strings.drThomas.details}} />
              <p>{strings.drThomas.spec}</p>
            </div>
          </div>
          <div className="doctor-card">
            <div className="doctor-card-left">
              <img src="/susan.jpg" alt="Dr. Susan Thomas" />
              <a href="#" className="profile-link">{strings.viewProfile}</a>
            </div>
            <div className="doctor-card-right">
              <h3 style={{textAlign: 'left'}}>{strings.drSusan.name}</h3>
              <p>{strings.drSusan.qual}</p>
              <p style={{margin: '0.3em 0 0.5em 0', fontSize: '0.98em'}} dangerouslySetInnerHTML={{__html: strings.drSusan.details}} />
              <p>{strings.drSusan.spec}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Book an Appointment */}
      <section className="appointment-section" id="appointments">
        <h2>{strings.appointmentTitle}</h2>
        <form className="appointment-form">
          <input type="text" placeholder={strings.appointment.name} required />
          <input type="tel" placeholder={strings.appointment.phone} required />
          <select required>
            <option value="">{strings.appointment.choose}</option>
            <option value="ortho">{strings.appointment.ortho}</option>
            <option value="ent">{strings.appointment.ent}</option>
          </select>
          <input type="datetime-local" required />
          <button type="submit">{strings.appointment.submit}</button>
        </form>
      </section>

      {/* Clinic Hours & Fees */}
      <section className="hours-section">
        <h2>{strings.hoursTitle}</h2>
        <table className="hours-table">
          <thead>
            <tr>
              <th>{strings.doctorsTitle.slice(0,6)}</th>
              <th>Timing</th>
              <th>Fee (New / Review)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{strings.drThomas.name}</td>
              <td>Mon–Fri 10am–2pm</td>
              <td>₹325 / ₹25</td>
            </tr>
            <tr>
              <td>{strings.drSusan.name}</td>
              <td>Mon–Fri 10am–2pm</td>
              <td>₹325 / ₹25</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2>{strings.testimonialsTitle}</h2>
        <div className="testimonials-slider">
          <blockquote>"Excellent care and friendly staff!"</blockquote>
          <blockquote>"Doctors are very patient and explain everything clearly."</blockquote>
          <blockquote>"Highly recommend for both ortho and ENT needs."</blockquote>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="contact-section" id="contact">
        <h2>{strings.contactTitle}</h2>
        <div className="contact-details">
          <div className="map-embed">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1968.6140325906233!2d76.6205208001275!3d9.31304939932551!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0622c0842a2cfb%3A0x97a58e72325b57d0!2sOrent%20Clinic%20(Orthopedic%20%26%20ENT)!5e0!3m2!1sen!2sin!4v1753032000706!5m2!1sen!2sin"
              width="100%"
              height="200"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Orent Clinic Location"
            ></iframe>
          </div>
          <div className="contact-info">
            <p>📍 {strings.contact.address}</p>
            <p>📞 <a href="tel:9349345538">934 934 5538</a></p>
            <p>🌐 <a href="https://orentclinic.com" target="_blank" rel="noopener noreferrer">{strings.contact.website}</a></p>
            <p>📱 <a href="https://wa.me/919349345538" target="_blank" rel="noopener noreferrer">{strings.contact.whatsapp}</a></p>
            {/* <p>✉️ Email: info@orentclinic.com</p> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">{strings.footer.privacy}</a> | <a href="#">{strings.footer.terms}</a> | <a href="#">{strings.footer.sitemap}</a>
        </div>
        <div className="footer-social">
          {/* Add social icons if any */}
        </div>
        <div className="footer-copy">{strings.footer.copyright}</div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/919349345538" className="floating-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
        <span role="img" aria-label="WhatsApp">💬</span>
      </a>
    </div>
  )
}

export default App
