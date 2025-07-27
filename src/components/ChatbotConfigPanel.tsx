import React, { useState } from 'react';
import { getConfig, saveConfig, resetConfig, defaultConfig } from '../config/chatbotConfig';
import './ChatbotConfigPanel.css';

interface ChatbotConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChange: () => void;
}

const ChatbotConfigPanel: React.FC<ChatbotConfigPanelProps> = ({ isOpen, onClose, onConfigChange }) => {
  const [config, setConfig] = useState(getConfig());

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config };
    
    // Handle nested object updates
    if (key.includes('.')) {
      const [section, field] = key.split('.');
      (newConfig as any)[section] = {
        ...(newConfig as any)[section],
        [field]: value
      };
    } else {
      (newConfig as any)[key] = value;
    }
    
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange();
  };

  const handleReset = () => {
    resetConfig();
    setConfig(defaultConfig);
    onConfigChange();
  };

  if (!isOpen) return null;

  return (
    <div className="config-overlay" onClick={onClose}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h3>Chatbot Configuration</h3>
          <button onClick={onClose} className="config-close">×</button>
        </div>
        
        <div className="config-content">
          {/* UI Settings */}
          <section className="config-section">
            <h4>UI Settings</h4>
            <div className="config-item">
              <label>Position:</label>
              <select 
                value={config.ui.position} 
                onChange={(e) => handleConfigChange('ui.position', e.target.value)}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            
            <div className="config-item">
              <label>Theme:</label>
              <select 
                value={config.ui.theme} 
                onChange={(e) => handleConfigChange('ui.theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div className="config-item">
              <label>Auto Open:</label>
              <input 
                type="checkbox" 
                checked={config.ui.autoOpen}
                onChange={(e) => handleConfigChange('ui.autoOpen', e.target.checked)}
              />
            </div>
          </section>

          {/* Features */}
          <section className="config-section">
            <h4>Features</h4>
            <div className="config-item">
              <label>Quick Replies:</label>
              <input 
                type="checkbox" 
                checked={config.features.quickReplies}
                onChange={(e) => handleConfigChange('features.quickReplies', e.target.checked)}
              />
            </div>
            
            <div className="config-item">
              <label>Typing Indicator:</label>
              <input 
                type="checkbox" 
                checked={config.features.typingIndicator}
                onChange={(e) => handleConfigChange('features.typingIndicator', e.target.checked)}
              />
            </div>
            
            <div className="config-item">
              <label>Message History:</label>
              <input 
                type="checkbox" 
                checked={config.features.messageHistory}
                onChange={(e) => handleConfigChange('features.messageHistory', e.target.checked)}
              />
            </div>
          </section>

          {/* AI Settings */}
          <section className="config-section">
            <h4>AI Settings</h4>
            <div className="config-item">
              <label>OpenAI Enabled:</label>
              <input 
                type="checkbox" 
                checked={config.openai.enabled}
                onChange={(e) => handleConfigChange('openai.enabled', e.target.checked)}
              />
            </div>
            
            <div className="config-item">
              <label>Response Delay (ms):</label>
              <input 
                type="number" 
                value={config.local.responseDelay}
                onChange={(e) => handleConfigChange('local.responseDelay', parseInt(e.target.value))}
                min="0"
                max="5000"
              />
            </div>
          </section>

          {/* Clinic Info */}
          <section className="config-section">
            <h4>Clinic Information</h4>
            <div className="config-item">
              <label>Phone:</label>
              <input 
                type="text" 
                value={config.clinic.phone}
                onChange={(e) => handleConfigChange('clinic.phone', e.target.value)}
              />
            </div>
            
            <div className="config-item">
              <label>WhatsApp:</label>
              <input 
                type="text" 
                value={config.clinic.whatsapp}
                onChange={(e) => handleConfigChange('clinic.whatsapp', e.target.value)}
              />
            </div>
          </section>
        </div>
        
        <div className="config-footer">
          <button onClick={handleReset} className="config-reset">Reset to Defaults</button>
          <button onClick={onClose} className="config-save">Save & Close</button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConfigPanel; 