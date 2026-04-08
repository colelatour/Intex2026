import { useState } from 'react';

interface Props {
  displayName: string;
  onClose: () => void;
}

export default function OutreachModal({ displayName, onClose }: Props) {
  const template =
    `Hi ${displayName},\n\n` +
    `We wanted to reach out and share the impact your support has made. ` +
    `Thanks to donors like you, we've been able to provide safe shelter, education, ` +
    `and care for girls in need across the Philippines.\n\n` +
    `Your generosity truly makes a difference. We'd love to reconnect and share ` +
    `more about how your contributions are changing lives.\n\n` +
    `With gratitude,\nThe Lighthouse Sanctuary Team`;

  const [message, setMessage] = useState(template);
  const [copied,  setCopied]  = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Draft Outreach — {displayName}</h3>
          <button className="slide-over__close" onClick={onClose}>✕</button>
        </div>
        <textarea
          className="outreach-textarea"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={12}
        />
        <div className="form-actions">
          <button className="btn-export" onClick={onClose}>Close</button>
          <button className="btn-add" onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
