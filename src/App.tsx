import './App.css'
import Chatbot from './components/Chatbot'
import { useState } from 'react'
import { WhatsAppIcon } from './components/Icons';

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
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <div className="orent-root">
      {/* Announcement Section */}
      <section className="announcement-section">
        {en.announcement}
      </section>
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="logo">Orent Consultation</span>
          <span className="tagline">Orthopedic & ENT Care, Chengannur, Kerala, India</span>
        </div>
        <ul className="navbar-right">
          <li><a href="#home">{en.nav.home}</a></li>
          <li><a href="#about">{en.nav.about}</a></li>
          <li><a href="#services">{en.nav.services}</a></li>
          <li><a href="#doctors">{en.nav.doctors}</a></li>
          {/* <li><a href="#appointments">{en.nav.appointments}</a></li> */}
          <li><a href="#contact">{en.nav.contact}</a></li>
          <li><a href="https://wa.me/919349345538" target="_blank" rel="noopener noreferrer" className="whatsapp-icon"><WhatsAppIcon size={22} /></a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1>{en.hero.title}</h1>
          <h2>{en.hero.subtitle}</h2>
          {/* <div className="hero-cta">
            <button className="cta-btn">{en.hero.book}</button>
            <a href="tel:9349345538" className="cta-btn secondary">{en.hero.call}</a>
          </div> */}
        </div>
      </section>

      {/* About the Clinic */}
      <section className="about-section" id="about">
        <div className="about-content">
          <h2>{en.aboutTitle}</h2>
          <p>{en.aboutWelcome}</p>
          <p>{en.aboutRelationship}</p>
        </div>
      </section>

      {/* Our Services */}
      <section className="services-section" id="services">
        <h2>{en.servicesTitle}</h2>
        <div className="services-grid">
          <div className="service-item"><span role="img" aria-label="Orthopedics">🦴</span><p>{en.services.ortho}</p></div>
          <div className="service-item"><span role="img" aria-label="ENT">👂</span><p>{en.services.ent}</p></div>
          <div className="service-item"><span role="img" aria-label="Procedures">🩺</span><p>{en.services.procedures}</p></div>
        </div>
      </section>

      {/* Meet the Doctors */}
      <section className="doctors-section" id="doctors">
        <h2>{en.doctorsTitle}</h2>
        <div className="doctors-cards">
          <div className="doctor-card">
            <div className="doctor-card-left">
              <img src="/thomas.jpg" />
            </div>
            <div className="doctor-card-right">
              <h3 style={{textAlign: 'left'}}>{en.drThomas.name}</h3>
              <p>{en.drThomas.qual}</p>
              <p style={{margin: '0.3em 0 0.5em 0', fontSize: '0.98em'}} dangerouslySetInnerHTML={{__html: en.drThomas.details}} />
              <p>{en.drThomas.spec}</p>
            </div>
          </div>
          <div className="doctor-card">
            <div className="doctor-card-left">
              <img src="/susan.jpg" alt="Dr. Susan Thomas" />
            </div>
            <div className="doctor-card-right">
              <h3 style={{textAlign: 'left'}}>{en.drSusan.name}</h3>
              <p>{en.drSusan.qual}</p>
              <p style={{margin: '0.3em 0 0.5em 0', fontSize: '0.98em'}} dangerouslySetInnerHTML={{__html: en.drSusan.details}} />
              <p>{en.drSusan.spec}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Book an Appointment */}
      {/* <section className="appointment-section" id="appointments">
        <h2>{en.appointmentTitle}</h2>
        <form className="appointment-form">
          <input type="text" placeholder={en.appointment.name} required />
          <input type="tel" placeholder={en.appointment.phone} required />
          <select required>
            <option value="">{en.appointment.choose}</option>
            <option value="ortho">{en.appointment.ortho}</option>
            <option value="ent">{en.appointment.ent}</option>
          </select>
          <input type="datetime-local" required />
          <button type="submit">{en.appointment.submit}</button>
        </form>
      </section> */}

      {/* Clinic Hours & Fees */}
      <section className="hours-section">
        <h2>{en.hoursTitle}</h2>
        <table className="hours-table">
          <thead>
            <tr>
              <th>{en.doctorsTitle.slice(0,6)}</th>
              <th>Timing</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{en.drThomas.name}</td>
              <td>Mon–Fri 10am–2pm</td>
              <td>₹300</td>
            </tr>
            <tr>
              <td>{en.drSusan.name}</td>
              <td>Mon–Fri 10am–2pm</td>
              <td>₹300</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2>{en.testimonialsTitle}</h2>
        <div className="testimonials-slider">
          <blockquote>"Excellent care and friendly staff!"</blockquote>
          <blockquote>"Doctors are very patient and explain everything clearly."</blockquote>
          <blockquote>"Highly recommend for both ortho and ENT needs."</blockquote>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="contact-section" id="contact">
        <h2>{en.contactTitle}</h2>
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
            <p>📍 {en.contact.address}</p>
            <p>📞 <a href="tel:+914792455538">+91-479-2455538</a></p>
            <p>📞 <a href="tel:+919349345538">+91-934-934-5538</a></p>
            <p>📞 <a href="tel:+919388958498">+91-938-895-8498</a></p>
            <p>📞 <a href="tel:+918921042340">+91-892-104-2340</a></p>
            <div style={{ display: 'flex', gap: '1.5rem', margin: '0.5em 0' }}>
              <a href="https://wa.me/919847462563" target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                <WhatsAppIcon size={18} /> WhatsApp (Ortho)
              </a>
              <a href="https://wa.me/919447400188" target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>
                <WhatsAppIcon size={18} /> WhatsApp (ENT)
              </a>
            </div>
            <p>✉️ Email: <a href="mailto:orentclinic@gmail.com">orentclinic@gmail.com</a></p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        {/* <div className="footer-links">
          <a href="#">{en.footer.privacy}</a> | <a href="#">{en.footer.terms}</a> | <a href="#">{en.footer.sitemap}</a>
        </div> */}
        {/* <div className="footer-social">
          {/* Add social icons if any }
        </div> */}
        <div className="footer-copy">{en.footer.copyright}</div>
      </footer>
      {/* AI Chatbot */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
      />
    </div>
  )
}

export default App
