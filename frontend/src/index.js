import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const API_URL = "http://localhost:55222";

export function App() {
  const [senderEmail, setSenderEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchMessages = () => {
    if (senderEmail) {
      fetch(`${API_URL}/messages?sender_email=${encodeURIComponent(senderEmail)}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, senderEmail]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (senderEmail.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSenderEmail('');
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !subject || !body || !sendAt) {
      alert("Please fill in all fields");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          subject,
          body,
          send_at: new Date(sendAt).toISOString()
        })
      });
      if (res.ok) {
        setSuccessMsg("Your message has been scheduled!");
        setRecipientEmail('');
        setSubject('');
        setBody('');
        setSendAt('');
        fetchMessages();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert("Failed to schedule message");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setSending(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>📬 I Told You So</h1>
        <p style={styles.subtitle}>Schedule messages to be delivered in the future. Let the world know you were right!</p>
        <form onSubmit={handleLogin} style={styles.form}>
          <h2>Get Started</h2>
          <input
            style={styles.input}
            type="email"
            placeholder="Your email address"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            required
          />
          <button style={styles.button} type="submit">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📬 I Told You So</h1>
        <div>
          <span style={styles.userEmail}>{senderEmail}</span>
          <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={styles.composeSection}>
        <h2>Compose a Future Message</h2>
        <p style={styles.hint}>Write your message now and have it delivered at the perfect moment.</p>
        {successMsg && <div style={styles.successMsg}>{successMsg}</div>}
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Recipient's email"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
          <textarea
            style={{ ...styles.input, height: '120px', resize: 'vertical' }}
            placeholder="Your message (e.g. 'I told you that Leverkusen is going to win!')"
            value={body}
            onChange={e => setBody(e.target.value)}
            required
          />
          <label style={styles.label}>Deliver on:</label>
          <input
            style={styles.input}
            type="datetime-local"
            value={sendAt}
            onChange={e => setSendAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
          <button style={styles.button} type="submit" disabled={sending}>
            {sending ? "Scheduling..." : "Schedule Message"}
          </button>
        </form>
      </div>

      <div style={styles.messagesSection}>
        <h2>Your Scheduled Messages</h2>
        <button style={styles.refreshButton} onClick={fetchMessages}>Refresh</button>
        {messages.length === 0 ? (
          <p>No messages scheduled yet.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              ...styles.messageCard,
              borderLeft: `4px solid ${msg.status === 'sent' ? '#4caf50' : '#2196f3'}`
            }}>
              <div style={styles.messageHeader}>
                <strong>To:</strong> {msg.recipient_email}
                <span style={{
                  ...styles.statusBadge,
                  background: msg.status === 'sent' ? '#4caf50' : '#2196f3'
                }}>
                  {msg.status === 'sent' ? '✓ Sent' : '⏰ Scheduled'}
                </span>
              </div>
              <div><strong>Subject:</strong> {msg.subject}</div>
              <div style={styles.messageBody}>{msg.body}</div>
              <div style={styles.messageFooter}>
                <small>
                  {msg.status === 'sent'
                    ? `Delivered on ${new Date(msg.sent_at).toLocaleString()}`
                    : `Scheduled for ${new Date(msg.send_at).toLocaleString()}`}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    color: '#333'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px'
  },
  title: {
    color: '#1a237e',
    margin: 0
  },
  subtitle: {
    color: '#555',
    marginBottom: '30px'
  },
  userEmail: {
    marginRight: '10px',
    color: '#555'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '500px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  },
  label: {
    fontWeight: 'bold',
    marginTop: '5px'
  },
  button: {
    padding: '12px 24px',
    background: '#1a237e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  logoutButton: {
    padding: '8px 16px',
    background: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '6px 12px',
    background: '#607d8b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  composeSection: {
    background: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  hint: {
    color: '#666',
    marginBottom: '15px'
  },
  successMsg: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  messagesSection: {
    marginTop: '20px'
  },
  messageCard: {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  statusBadge: {
    color: 'white',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '12px'
  },
  messageBody: {
    margin: '8px 0',
    padding: '8px',
    background: '#f9f9f9',
    borderRadius: '4px',
    fontStyle: 'italic'
  },
  messageFooter: {
    color: '#888',
    marginTop: '8px'
  }
};

if (typeof document !== 'undefined' && document.getElementById('root')) {
  ReactDOM.render(<App />, document.getElementById('root'));
}

