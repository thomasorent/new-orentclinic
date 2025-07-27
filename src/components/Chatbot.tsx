import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import QuickReplies from './QuickReplies';
import { SendIcon, CloseIcon, MessageIcon, LoaderIcon } from './Icons';
import { getConfig } from '../config/chatbotConfig';
import './Chatbot.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onToggle }) => {
  const config = getConfig();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: config.ui.welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [showQuickReplies, setShowQuickReplies] = useState(config.features.quickReplies);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Add configurable delay for local responses
    if (config.local.enabled && config.local.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.local.responseDelay));
    }
    
    // Using local AI only
    
    return await aiService.generateResponse(userMessage);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowQuickReplies(false);
    setIsLoading(true);

    try {
      const response = await generateResponse(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble responding right now. Please call us at 934 934 5538 for immediate assistance.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowQuickReplies(false);
    setIsLoading(true);

    try {
      const response = await generateResponse(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble responding right now. Please call us at 934 934 5538 for immediate assistance.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle ${config.ui.position}`}
        onClick={onToggle}
        aria-label="Open chat"
      >
        <MessageIcon size={24} />
      </button>

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="chatbot-overlay" onClick={onToggle}>
          <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-title">
                <MessageIcon size={20} />
                <span>Orent Clinic Assistant</span>
              </div>
              <button 
                className="chatbot-close"
                onClick={onToggle}
                aria-label="Close chat"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-content">
                    {message.text}
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
                             {isLoading && (
                 <div className="message bot-message">
                   <div className="message-content">
                     <LoaderIcon size={16} />
                     <span>Typing...</span>
                   </div>
                 </div>
               )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {config.features.quickReplies && (
              <QuickReplies 
                onQuickReply={handleQuickReply}
                visible={showQuickReplies && messages.length === 1}
              />
            )}

            {/* Input */}
            <div className="chatbot-input">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="send-button"
                aria-label="Send message"
              >
                <SendIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot; 