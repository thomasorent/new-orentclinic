import React from 'react';
import './QuickReplies.css';

interface QuickReply {
  id: string;
  text: string;
  icon?: string;
}

interface QuickRepliesProps {
  onQuickReply: (text: string) => void;
  visible: boolean;
}

const quickReplies: QuickReply[] = [
  { id: '2', text: 'Clinic hours', icon: '🕐' },
  { id: '3', text: 'Consultation fees', icon: '💰' },
  { id: '4', text: 'Location', icon: '📍' },
  { id: '5', text: 'Contact information', icon: '📞' },
  { id: '6', text: 'Services offered', icon: '🩺' },
  { id: '7', text: 'About the doctors', icon: '👨‍⚕️' },
  { id: '8', text: 'Doctor qualifications', icon: '🎓' }
];

const QuickReplies: React.FC<QuickRepliesProps> = ({ onQuickReply, visible }) => {
  if (!visible) return null;

  return (
    <div className="quick-replies">
      <div className="quick-replies-title">Quick questions:</div>
      <div className="quick-replies-grid">
        {quickReplies.map((reply) => (
          <button
            key={reply.id}
            className="quick-reply-button"
            onClick={() => onQuickReply(reply.text)}
          >
            {reply.icon && <span className="quick-reply-icon">{reply.icon}</span>}
            <span className="quick-reply-text">{reply.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplies; 