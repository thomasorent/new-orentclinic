// Chatbot Configuration
// This file contains all configuration settings for the AI chatbot

export interface ChatbotConfig {
  // OpenAI Configuration
  openai: {
    enabled: boolean;
    apiKey?: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  
  // Local AI Configuration
  local: {
    enabled: boolean;
    responseDelay: number; // milliseconds
  };
  
  // UI Configuration
  ui: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme: 'light' | 'dark' | 'auto';
    language: string;
    autoOpen: boolean;
    welcomeMessage: string;
  };
  
  // Features
  features: {
    typingIndicator: boolean;
    messageHistory: boolean;
    quickReplies: boolean;
    fileUpload: boolean;
    voiceInput: boolean;
  };
  
  // Clinic Information
  clinic: {
    name: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
    website: string;
  };
}

// Default configuration
export const defaultConfig: ChatbotConfig = {
  openai: {
    enabled: true, // Set to true and add API key for OpenAI integration
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo',
    maxTokens: 200,
    temperature: 0.7
  },
  
  local: {
    enabled: true,
    responseDelay: 1000
  },
  
  ui: {
    position: 'bottom-right',
    theme: 'light',
    language: 'en',
    autoOpen: false,
    welcomeMessage: 'Hello! I\'m your AI assistant. I can help you with information about our clinic, appointments, services, and more. How can I assist you today?'
  },
  
  features: {
    typingIndicator: true,
    messageHistory: true,
    quickReplies: true,
    fileUpload: false,
    voiceInput: false
  },
  
  clinic: {
    name: 'Orent Clinic',
    phone: '934 934 5538',
    whatsapp: '934 934 5538',
    address: 'Chengannur, Kerala, India',
    hours: 'Monday to Friday, 10 AM to 2 PM',
    website: 'orentclinic.com'
  }
};

// Quick reply suggestions
export const quickReplies = [
  'Book an appointment',
  'Clinic hours',
  'Consultation fees',
  'Weekend availability',
  'Location',
  'Contact information',
  'Services offered',
  'Payment methods',
  'Walk-in appointments'
];

// Environment-specific configuration
export const getConfig = (): ChatbotConfig => {
  const config = { ...defaultConfig };
  
  // Override with environment variables
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    config.openai.enabled = true;
    config.openai.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }
  
  // Override with localStorage settings if available
  try {
    const savedConfig = localStorage.getItem('chatbot-config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      Object.assign(config, parsed);
    }
  } catch (error) {
    console.warn('Failed to load chatbot config from localStorage:', error);
  }
  
  return config;
};

// Save configuration to localStorage
export const saveConfig = (config: Partial<ChatbotConfig>) => {
  try {
    const currentConfig = getConfig();
    const updatedConfig = { ...currentConfig, ...config };
    localStorage.setItem('chatbot-config', JSON.stringify(updatedConfig));
  } catch (error) {
    console.warn('Failed to save chatbot config to localStorage:', error);
  }
};

// Reset configuration to defaults
export const resetConfig = () => {
  try {
    localStorage.removeItem('chatbot-config');
  } catch (error) {
    console.warn('Failed to reset chatbot config:', error);
  }
}; 