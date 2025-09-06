import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, 
  FiSearch, 
  FiMoreVertical, 
  FiPhone, 
  FiVideo,
  FiPaperclip,
  FiUsers,
  FiPlus
} from 'react-icons/fi';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import './ChatPage.css';
import '../components/tasks/CreateTaskModal.css';

// Separate component for the global user search
const UserSearch = ({ onUserSelect }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const users = await userService.searchUsers(searchTerm);
        if (user) {
          setSearchResults(users.filter(u => u.id !== user.id));
        } else {
          setSearchResults(users);
        }
      } catch (error) {
        console.error("Failed to search for users:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, user]);

  return (
    <form className="modal-form" style={{ paddingTop: '12px' }} onSubmit={(e) => e.preventDefault()}>
      <div className="form-group">
        <label>To:</label>
        <div className="assignee-input-container">
          <input
            type="text"
            placeholder="Search all users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {(searchResults.length > 0 || isSearching) && (
            <div className="user-search-results">
              {isSearching && <div className="user-search-item">Searching...</div>}
              {!isSearching && searchResults.map((userResult) => (
                <div
                  key={userResult.id}
                  className="user-search-item"
                  onClick={() => onUserSelect(userResult)}
                >
                  <div className="user-avatar">
                    <img
                      src={`https://ui-avatars.com/api/?name=${userResult.full_name}&background=f7d63e&color=1a202c&size=32`}
                      alt={userResult.full_name}
                    />
                  </div>
                  <div className="user-info">
                    <div className="user-name">{userResult.full_name}</div>
                    <div className="user-username">@{userResult.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {!isSearching && searchResults.length === 0 && searchTerm.length > 1 && (
        <div style={{ marginTop: '10px', color: '#6b7280', padding: '0 24px' }}>No users found</div>
      )}
    </form>
  );
};


const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatListSearchTerm, setChatListSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Load initial chats (this would be from your backend in a real app)
  useEffect(() => {
    const initialChats = [
      {
        id: 1,
        userId: 1,
        name: 'Sarah Johnson',
        username: 'sarah_j',
        lastMessage: 'Thanks for the project update!',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        unread: 2,
        online: true,
        type: 'direct'
      }
    ];
    setChats(initialChats);
  }, []);

  // Load messages for the selected chat (mocked)
  useEffect(() => {
    if (selectedChat) {
      const chatMessages = [
        {
          id: 1,
          senderId: selectedChat.userId,
          sender: selectedChat.name,
          content: 'Hey! How are you doing with the new feature implementation?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isOwn: false
        },
        {
          id: 2,
          senderId: user?.id,
          sender: user?.full_name || 'You',
          content: 'Going well! I should have the first version ready by end of day.',
          timestamp: new Date(Date.now() - 3540000).toISOString(),
          isOwn: true
        },
      ];
      setMessages(chatMessages);
    } else {
      setMessages([]);
    }
  }, [selectedChat, user]);

  // Auto-select first chat on load
  useEffect(() => {
    if (!selectedChat && chats.length > 0) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectUser = (targetUser) => {
    setShowNewChatModal(false);
    const existingChat = chats.find(chat => chat.userId === targetUser.id);

    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      const newChat = {
        id: chats.length + 1, // Use a better ID in a real app
        userId: targetUser.id,
        name: targetUser.full_name,
        username: targetUser.username,
        lastMessage: 'Started a new conversation',
        timestamp: new Date().toISOString(),
        unread: 0,
        online: targetUser.online, // This would need to be fetched
        type: 'direct'
      };
      setChats(prevChats => [newChat, ...prevChats]);
      setSelectedChat(newChat);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      const newMessage = {
        id: messages.length + 1,
        senderId: user?.id,
        sender: user?.full_name || 'You',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        isOwn: true
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: message.trim(), timestamp: new Date().toISOString() }
          : chat
      ));
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(chatListSearchTerm.toLowerCase()) ||
    chat.username.toLowerCase().includes(chatListSearchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor((now - date) / (1000 * 60))} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
            <FiPlus size={16} />
          </button>
        </div>

        <div className="chat-search">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={chatListSearchTerm}
              onChange={(e) => setChatListSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="chat-list">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-avatar-wrapper">
                <div className="chat-avatar"><span>{chat.name.charAt(0).toUpperCase()}</span></div>
                {chat.online && <div className="online-indicator"></div>}
              </div>
              <div className="chat-info">
                <div className="chat-header">
                  <div className="chat-name">{chat.name}</div>
                  <span className="chat-time">{formatTimestamp(chat.timestamp)}</span>
                </div>
                <div className="chat-preview">
                  <p className="last-message">{chat.lastMessage}</p>
                  {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-content">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-avatar"><span>{selectedChat.name.charAt(0).toUpperCase()}</span></div>
                <div className="chat-header-info">
                  <h3>{selectedChat.name}</h3>
                  <span className="status">{selectedChat.online ? 'Active now' : 'Offline'}</span>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="action-btn"><FiPhone size={18} /></button>
                <button className="action-btn"><FiVideo size={18} /></button>
                <button className="action-btn"><FiMoreVertical size={18} /></button>
              </div>
            </div>

            <div className="messages-container">
              <div className="messages-list">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.isOwn ? 'own' : 'other'}`}>
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="message-input-container">
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="message-input-wrapper">
                  <button type="button" className="attachment-btn"><FiPaperclip size={18} /></button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="message-input"
                  />
                  <button type="button" className="emoji-btn"><HiOutlineEmojiHappy size={18} /></button>
                </div>
                <button type="submit" className="send-btn" disabled={!message.trim()}>
                  <FiSend size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <FiUsers size={48} />
              <h3>Select a conversation</h3>
              <p>Choose from your existing conversations or start a new one.</p>
            </div>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="modal-backdrop" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button className="modal-close" onClick={() => setShowNewChatModal(false)}>×</button>
            </div>
            <UserSearch onUserSelect={handleSelectUser} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
