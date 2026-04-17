import { useState, useEffect } from 'react';
import { messagesApi, parentApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Modal from '../../components/Modal';
import './MessagesPage.css';

function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [formData, setFormData] = useState({ recipient: '', subject: '', content: '' });
  const [childCourses, setChildCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [messageTemplates] = useState([
    { label: 'Request Meeting', text: 'I would like to schedule a meeting to discuss my child\'s progress in your course.' },
    { label: 'Academic Concern', text: 'I have some concerns about my child\'s performance and would appreciate your guidance.' },
    { label: 'General Inquiry', text: 'I have a question regarding the course requirements and expectations.' },
    { label: 'Thank You', text: 'Thank you for your dedication and support in helping my child succeed.' },
  ]);
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isParent = user.role === 'parent';

  useEffect(() => {
    fetchMessages();
    if (isParent) {
      fetchChildCoursesAndInstructors();
    }
  }, []);

  const fetchChildCoursesAndInstructors = async () => {
    try {
      const [coursesData, instructorsData] = await Promise.all([
        parentApi.getChildCourses(),
        parentApi.getInstructors(),
      ]);
      setChildCourses(coursesData.courses || []);
      setInstructors(instructorsData || []);
    } catch (error) {
      console.error('Failed to load child courses:', error);
    }
  };

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
      toast.success('Message sent successfully');
      setShowModal(false);
      setFormData({ recipient: '', subject: '', content: '' });
      setSelectedCourse('');
      fetchMessages();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourse(courseId);
    const course = childCourses.find(c => c._id === courseId);
    if (course && course.instructor) {
      setFormData({
        ...formData,
        recipient: course.instructor.email,
        subject: `Regarding ${course.code}: ${course.name}`,
      });
    }
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      content: template.text,
    });
  };

  const openComposeModal = () => {
    setFormData({ recipient: '', subject: '', content: '' });
    setSelectedCourse('');
    setShowModal(true);
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
        <button className="add-btn" onClick={openComposeModal}>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isParent ? "Message Instructor" : "Compose Message"}>
        <form onSubmit={handleSend} className="message-form">
          {isParent && childCourses.length > 0 && (
            <>
              <div className="form-group">
                <label>Select Course (Optional)</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="course-select"
                >
                  <option value="">-- Select a course --</option>
                  {childCourses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name} ({course.instructor?.name})
                    </option>
                  ))}
                </select>
                <small className="helper-text">Select your child's course to auto-fill instructor details</small>
              </div>

              {!selectedCourse && instructors.length > 0 && (
                <div className="form-group">
                  <label>Or Select Instructor Directly</label>
                  <select 
                    value={formData.recipient} 
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="instructor-select"
                  >
                    <option value="">-- Select an instructor --</option>
                    {instructors.map((instructor) => (
                      <option key={instructor.email} value={instructor.email}>
                        {instructor.name} - {instructor.department}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Recipient {isParent && '(Instructor Email)'}</label>
            <input 
              type="text" 
              value={formData.recipient} 
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} 
              placeholder={isParent ? "Instructor email address" : "Recipient name or email"}
              required 
              readOnly={isParent && selectedCourse}
            />
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              value={formData.subject} 
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
              placeholder="Message subject"
              required 
            />
          </div>

          {isParent && (
            <div className="form-group">
              <label>Quick Templates</label>
              <div className="template-buttons">
                {messageTemplates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    className="template-btn"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={formData.content} 
              onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
              rows="6" 
              placeholder={isParent ? "Write your message to the instructor..." : "Write your message..."}
              required 
            />
          </div>

          <button type="submit" className="submit-btn">
            {isParent ? '📤 Send to Instructor' : '📤 Send Message'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default MessagesPage;