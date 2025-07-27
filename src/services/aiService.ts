// AI Service for Chatbot
// This service handles local responses only

export interface AIResponse {
  text: string;
  confidence: number;
  source: 'local';
}

// Local knowledge base for common medical queries
const MEDICAL_KNOWLEDGE_BASE = {
  greeting: {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'],
    responses: [
      'Hello! Welcome to Orent Clinic. I\'m here to help you with information about our clinic, appointments, services, and more. How can I assist you today?',
      'Hi there! Thank you for contacting Orent Clinic. I can help you with appointment booking, clinic hours, consultation fees, doctor information, and other services. What would you like to know?',
      'Hello! I\'m your AI assistant for Orent Clinic. I can provide information about our orthopedic and ENT services, help you book appointments, or answer questions about our doctors. How may I help you?'
    ]
  },
  appointments: {
    keywords: ['appointment', 'book', 'schedule', 'visit', 'consultation'],
    responses: [
      'To book an appointment, you can call us at 934 934 5538 or fill out the appointment form on our website. Our clinic hours are Monday to Friday, 10 AM to 2 PM.',
      'You can schedule an appointment by calling 934 934 5538. We accept both new and review patients during our clinic hours.',
      'For appointments, please call us at 934 934 5538. We\'re open Monday to Friday from 10 AM to 2 PM.'
    ]
  },
  hours: {
    keywords: ['hours', 'timing', 'time', 'open', 'closed', 'schedule'],
    responses: [
      'Our clinic is open Monday to Friday from 10 AM to 2 PM. Both Dr. K. M. Thomas (Orthopedic) and Dr. Susan Thomas (ENT) are available during these hours.',
      'We operate Monday through Friday, 10:00 AM to 2:00 PM. Both our orthopedic and ENT specialists are available during these times.',
      'Clinic hours are Monday to Friday, 10 AM - 2 PM. We\'re closed on weekends and public holidays.'
    ]
  },
  fees: {
    keywords: ['fee', 'cost', 'price', 'charge', 'payment', 'consultation fee'],
    responses: [
      'Our consultation fees are ₹325 for new patients and ₹25 for review patients. This applies to both orthopedic and ENT consultations.',
      'New patient consultation: ₹325, Review consultation: ₹25. These fees apply to both orthopedic and ENT services.',
      'Consultation fees: ₹325 (new patients), ₹25 (review patients). Same rates for both orthopedic and ENT consultations.'
    ]
  },
  location: {
    keywords: ['location', 'address', 'where', 'place', 'directions'],
    responses: [
      'We are located in Chengannur, Kerala, India. You can find our exact location on Google Maps or call us for directions.',
      'Our clinic is situated in Chengannur, Kerala, India. We can provide detailed directions if you call us.',
      'We\'re in Chengannur, Kerala, India. You can use Google Maps to find our exact location or call for directions.'
    ]
  },
  orthopedic: {
    keywords: ['orthopedic', 'ortho', 'bone', 'joint', 'fracture', 'pain', 'dr thomas'],
    responses: [
      'Dr. K. M. Thomas specializes in orthopedic care, treating bone and joint diseases. He has over 40 years of experience with MBBS and D.Ortho qualifications.',
      'Our orthopedic specialist Dr. K. M. Thomas treats bone and joint conditions. He has extensive experience with MBBS and D.Ortho degrees.',
      'Dr. K. M. Thomas is our orthopedic surgeon with MBBS and D.Ortho qualifications. He specializes in bone and joint diseases.'
    ]
  },
  ent: {
    keywords: ['ent', 'ear', 'nose', 'throat', 'dr susan', 'susan thomas'],
    responses: [
      'Dr. Susan Thomas is our ENT specialist, treating ear, nose, and throat conditions. She has MBBS, DLO, and MS. ENT qualifications with extensive experience.',
      'Dr. Susan Thomas specializes in ENT (Ear, Nose, Throat) care. She has MBBS, DLO, and MS. ENT qualifications.',
      'Our ENT specialist Dr. Susan Thomas treats ear, nose, and throat conditions. She has comprehensive qualifications including MBBS, DLO, and MS. ENT.'
    ]
  },
  contact: {
    keywords: ['phone', 'call', 'contact', 'number', 'reach'],
    responses: [
      'You can reach us at 934 934 5538. We also have WhatsApp available for your convenience.',
      'Call us at 934 934 5538. We\'re also available on WhatsApp for your convenience.',
      'Our contact number is 934 934 5538. You can also reach us via WhatsApp.'
    ]
  },
  whatsapp: {
    keywords: ['whatsapp', 'wa', 'message'],
    responses: [
      'You can contact us on WhatsApp at 934 934 5538. We\'re happy to help with appointments and general inquiries.',
      'WhatsApp us at 934 934 5538 for appointments and inquiries. We respond promptly during clinic hours.',
      'We\'re available on WhatsApp at 934 934 5538. Feel free to message us for appointments or questions.'
    ]
  },
  services: {
    keywords: ['services', 'treatment', 'what do you do', 'specialties'],
    responses: [
      'We offer orthopedic care, ENT services, and minor procedures. Our doctors provide comprehensive treatment for bone and joint issues as well as ear, nose, and throat conditions.',
      'Our services include orthopedic care, ENT treatment, and minor procedures. We treat both bone/joint and ear/nose/throat conditions.',
      'We provide orthopedic and ENT services, plus minor procedures. Our specialists handle bone, joint, ear, nose, and throat conditions.'
    ]
  },
  doctors: {
    keywords: ['doctors', 'doctor', 'physician', 'specialist', 'dr thomas', 'dr susan', 'who are the doctors'],
    responses: [
      'We have two experienced doctors: Dr. K. M. Thomas (Orthopedic Surgeon) and Dr. Susan Thomas (ENT Specialist). Dr. Thomas has MBBS and D.Ortho qualifications with over 40 years of experience in bone and joint care. Dr. Susan has MBBS, DLO, and MS. ENT qualifications specializing in ear, nose, and throat conditions.',
      'Our clinic is staffed by Dr. K. M. Thomas (Orthopedic) and Dr. Susan Thomas (ENT). Both doctors are highly qualified with extensive experience. Dr. Thomas treats bone and joint diseases, while Dr. Susan specializes in ENT care.',
      'We have two specialists: Dr. K. M. Thomas for orthopedic care and Dr. Susan Thomas for ENT treatment. Both doctors have excellent qualifications and decades of experience in their respective fields.'
    ]
  },
  qualifications: {
    keywords: ['qualifications', 'education', 'degrees', 'mbbs', 'd.ortho', 'dlo', 'ms ent', 'training', 'background', 'credentials'],
    responses: [
      'Dr. K. M. Thomas: MBBS from Govt. Medical College, Thiruvananthapuram (1981), D.Ortho from Govt. Medical College, Calicut (1986). Dr. Susan Thomas: MBBS from Govt. Medical College, Thiruvananthapuram (1981), DLO and MS. ENT from Govt. Medical College, Calicut (1987). Both doctors have extensive postgraduate training and over 40 years of combined experience.',
      'Our doctors\' qualifications: Dr. Thomas completed MBBS at Govt. Medical College, Thiruvananthapuram in 1981, then specialized in Orthopedics with D.Ortho from Govt. Medical College, Calicut in 1986. Dr. Susan earned her MBBS from the same institution in 1981, followed by DLO and MS. ENT from Govt. Medical College, Calicut in 1987.',
      'Education details: Dr. K. M. Thomas holds MBBS (1981, Thiruvananthapuram) and D.Ortho (1986, Calicut). Dr. Susan Thomas has MBBS (1981, Thiruvananthapuram), DLO and MS. ENT (1987, Calicut). Both graduated from prestigious government medical colleges and have decades of specialized practice experience.'
    ]
  },
  emergency: {
    keywords: ['emergency', 'urgent', 'immediate', 'critical', 'severe'],
    responses: [
      'For medical emergencies, please call emergency services immediately or visit the nearest hospital. For non-emergency consultations, call us at 934 934 5538.',
      'In case of medical emergencies, contact emergency services or go to the nearest hospital. For regular consultations, call us at 934 934 5538.',
      'For urgent medical situations, please call emergency services. For routine consultations, reach us at 934 934 5538.'
    ]
  }
};

export class AIService {
  constructor() {
    // Local AI service - no external dependencies
  }

  // Generate response using local knowledge base
  private generateLocalResponse(userMessage: string): AIResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check each knowledge category
    for (const [category, data] of Object.entries(MEDICAL_KNOWLEDGE_BASE)) {
      const hasKeyword = data.keywords.some(keyword => 
        lowerMessage.includes(keyword)
      );
      
      if (hasKeyword) {
        const randomResponse = data.responses[
          Math.floor(Math.random() * data.responses.length)
        ];
        
        return {
          text: randomResponse,
          confidence: 0.8,
          source: 'local'
        };
      }
    }

    // Default response if no specific category matches
    return {
      text: 'Thank you for your message. For specific medical advice or to book an appointment, please call us at 934 934 5538. I\'m here to help with general information about our clinic and services.',
      confidence: 0.3,
      source: 'local'
    };
  }

  // Main method to generate response
  async generateResponse(userMessage: string): Promise<string> {
    try {
      // Use local responses only
      const localResponse = this.generateLocalResponse(userMessage);
      return localResponse.text;
    } catch (error) {
      console.error('AI service error:', error);
      return 'Sorry, I\'m having trouble responding right now. Please call us at 934 934 5538 for immediate assistance.';
    }
  }
}

// Create singleton instance
export const aiService = new AIService(); 