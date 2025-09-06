import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, 
  FiSearch, 
  FiMoreVertical, 
  FiPhone, 
  FiVideo,
  FiPaperclip,
  FiSmile,
  FiUser,
  FiUsers,
  FiPlus
} from 'react-icons/fi';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Fetch available users for chat
  useEffect(() => {
    // This would normally fetch from the backend
    // For now, we'll use mock data but make it dynamic
    const mockUsers = [
      { id: 1, username: 'sarah_j', full_name: 'Sarah Johnson', online: true },
      { id: 2, username: 'mike_chen', full_name: 'Mike Chen', online: true },
      { id: 3, username: 'alex_dev', full_name: 'Alex Developer', online: false },
      { id: 4, username: 'lisa_pm', full_name: 'Lisa Product Manager', online: true }
    ];
    setAvailableUsers(mockUsers);
  }, []);

  // Load chats (would normally come from backend)
  useEffect(() => {
    const userChats = [
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
      },
      {
        id: 2,
        userId: 2,
        name: 'Mike Chen',
        username: 'mike_chen',
        lastMessage: 'Can you review the code changes?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        unread: 1,
        online: true,
        type: 'direct'
      }
    ];
    setChats(userChats);
  }, []);

  // Load messages for selected chat
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
        {
          id: 3,
          senderId: selectedChat.userId,
          sender: selectedChat.name,
          content: 'Perfect! Let me know if you need any help with the testing.',
          timestamp: new Date(Date.now() - 3480000).toISOString(),
          isOwn: false
        }
      ];
      setMessages(chatMessages);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    if (chats.length > 0 && !selectedChat) {
      setSelectedChat(chats[0]);
    }
  }, [chats, selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      // Update last message in chat list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: message.trim(), timestamp: new Date().toISOString() }
          : chat
      ));
    }
  };

  const startNewChat = (targetUser) => {
    const existingChat = chats.find(chat => chat.userId === targetUser.id);
    
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      const newChat = {
        id: chats.length + 1,
        userId: targetUser.id,
        name: targetUser.full_name,
        username: targetUser.username,
        lastMessage: '',
        timestamp: new Date().toISOString(),
        unread: 0,
        online: targetUser.online,
        type: 'direct'
      };
      
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
    }
    
    setShowNewChatModal(false);
    setUserSearchTerm('');
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = availableUsers.filter(user =>
    user.username !== (user?.username) && (
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
  );

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          <button 
            className="new-chat-btn"
            onClick={() => setShowNewChatModal(true)}
          >
            <FiPlus size={16} />
          </button>
        </div>

        <div className="chat-search">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <div className="chat-avatar">
                  {chat.type === 'group' ? (
                    <FiUsers className="group-icon" />
                  ) : (
                    <span>{chat.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {chat.online && <div className="online-indicator"></div>}
              </div>

              <div className="chat-info">
                <div className="chat-header">
                  <div className="chat-name">{chat.name}</div>
                  <span className="chat-time">{formatTimestamp(chat.timestamp)}</span>
                </div>
                <div className="chat-preview">
                  <p className="last-message">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat Content */}
      <div className="chat-content">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-avatar">
                  {selectedChat.type === 'group' ? (
                    <FiUsers className="group-icon" />
                  ) : (
                    <span>{selectedChat.avatar}</span>
                  )}
                </div>
                <div className="chat-header-info">
                  <h3>{selectedChat.name}</h3>
                  <span className="status">
                    {selectedChat.online ? 'Active now' : 'Last seen 1 hour ago'}
                  </span>
                </div>
              </div>

              <div className="chat-header-actions">
                <button className="action-btn">
                  <FiPhone size={18} />
                </button>
                <button className="action-btn">
                  <FiVideo size={18} />
                </button>
                <button className="action-btn">
                  <FiMoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              <div className="messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.isOwn ? 'own' : 'other'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">{formatMessageTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="message-input-wrapper">
                  <button type="button" className="attachment-btn">
                    <FiPaperclip size={18} />
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="message-input"
                  />

                  <button type="button" className="emoji-btn">
                    <HiOutlineEmojiHappy size={18} />
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={!message.trim()}
                >
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
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button 
                className="modal-close"
                onClick={() => setShowNewChatModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-search">
                <div className="search-input-wrapper">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="users-list">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-item"
                    onClick={() => startNewChat(user)}
                  >
                    <div className="user-avatar">
                      {user.full_name.charAt(0).toUpperCase()}
                      {user.online && <div className="online-indicator"></div>}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{user.full_name}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
