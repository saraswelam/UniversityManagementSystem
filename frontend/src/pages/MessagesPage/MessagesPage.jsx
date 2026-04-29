import { useState, useEffect } from 'react';
import { messagesApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './MessagesPage.css';

function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [formData, setFormData] = useState({ recipient: '', subject: '', content: '' });
  const toast = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await messagesApi.getAll();
      setMessages(data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await messagesApi.send(formData);
      toast.success('Message sent');
      setShowModal(false);
      setFormData({ recipient: '', subject: '', content: '' });
      fetchMessages();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRead = async (message) => {
    setSelectedMessage(message);
    if (!message.read) {
      try {
        await messagesApi.markAsRead(message._id);
        fetchMessages();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      try {
        await messagesApi.delete(id);
        toast.success('Message deleted');
        fetchMessages();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading) return <div className="loading">Loading messages...</div>;

  return (
    <div className="messages-page">
      <div className="page-header">
        <h2>Messages {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          ✉️ Compose
        </button>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message._id}
                className={`message-item ${!message.read ? 'unread' : ''}`}
                onClick={() => handleRead(message)}
              >
                <div className="message-sender">{message.sender?.name || 'Unknown'}</div>
                <div className="message-subject">{message.subject}</div>
                <div className="message-preview">{message.content?.substring(0, 50)}...</div>
                <div className="message-time">
                  {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : ''}
                </div>
                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(message._id); }}>
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <p className="empty-message">No messages</p>
          )}
        </div>

        {selectedMessage && (
          <div className="message-detail">
            <div className="detail-header">
              <h3>{selectedMessage.subject}</h3>
              <button className="close-btn" onClick={() => setSelectedMessage(null)}>✕</button>
            </div>
            <div className="detail-meta">
              <span>From: {selectedMessage.sender?.name || 'Unknown'}</span>
              <span>{selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : ''}</span>
            </div>
            <div className="detail-content">{selectedMessage.content}</div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Compose Message">
        <form onSubmit={handleSend} className="message-form">
          <div className="form-group">
            <label>Recipient</label>
            <input type="text" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} placeholder="Recipient name or email" required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="5" required />
          </div>
          <button type="submit" className="submit-btn">Send</button>
        </form>
      </Modal>
    </div>
  );
}

export default MessagesPage;