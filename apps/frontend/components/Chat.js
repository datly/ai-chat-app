import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Loader2 } from 'lucide-react';
import chatApi from '../services/api/chatApi';
import config from '../config/env';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversationId, setConversationId] = useState(() => {
    // Load conversationId from localStorage on mount
    return localStorage.getItem('currentConversationId') || null;
  });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // Save conversationId to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('currentConversationId', conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      // Get conversationId from localStorage to ensure we have the latest
      const savedConversationId = localStorage.getItem('currentConversationId');
      console.log('🔄 Fetching chat history with conversationId:', savedConversationId);
      
      const data = await chatApi.getChatHistory(savedConversationId);
      console.log('📦 Received data:', data);
      
      if (data.messages) {
        setMessages(data.messages);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      } else if (Array.isArray(data)) {
        // Backward compatibility if backend returns array
        setMessages(data);
      } else {
        // No messages yet
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    const currentInput = inputValue;
    const currentFile = selectedFile;
    
    console.log('📤 Sending message with conversationId:', conversationId);
    console.log('📤 localStorage conversationId:', localStorage.getItem('currentConversationId'));

    // Create optimistic user message for immediate display
    const optimisticUserMessage = {
      role: 'user',
      content: currentInput,
      timestamp: new Date().toISOString(),
      fileUrl: currentFile ? URL.createObjectURL(currentFile) : null,
      fileName: currentFile ? currentFile.name : null,
      isOptimistic: true
    };

    // Show user message immediately
    setMessages(prev => [...prev, optimisticUserMessage]);

    // Clear input immediately
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSelectedFile(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', currentInput);
      if (conversationId) {
        formData.append('conversationId', conversationId);
        console.log('✅ Added conversationId to FormData:', conversationId);
      } else {
        console.log('⚠️ No conversationId to add to FormData');
      }
      if (currentFile) {
        formData.append('file', currentFile);
      }

      const response = await chatApi.sendMessage(formData);
      
      console.log('📥 Received response:', response);
      
      // Save conversationId if received
      if (response.conversationId) {
        console.log('💾 Saving conversationId to localStorage:', response.conversationId);
        localStorage.setItem('currentConversationId', response.conversationId);
        setConversationId(response.conversationId);
      }
      
      // Replace optimistic messages with real ones
      setMessages(prev => {
        const withoutOptimistic = prev.slice(0, -1);
        
        // Clean up blob URL
        const optimistic = prev[prev.length - 1];
        if (optimistic?.isOptimistic && optimistic?.fileUrl) {
          URL.revokeObjectURL(optimistic.fileUrl);
        }
        
        // Add real user message and AI response
        return [...withoutOptimistic, response.userMessage, response.aiResponse];
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    autoResizeTextarea();
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <h1>AI Chat Generator</h1>
              <p>Start a conversation with AI. Ask anything you want to know.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => {
                // Check fileName for image type (works for both blob URLs and server URLs)
                const isImage = message.fileName 
                  ? /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileName)
                  : message.fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl);
                
                // Use blob URL for optimistic messages, API URL for saved messages
                const imageUrl = message.isOptimistic 
                  ? message.fileUrl 
                  : `${config.apiBaseUrl}${message.fileUrl}`;
                
                return (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                  >
                    <div className="message-bubble">
                      {message.fileUrl && (
                        <div className="message-file">
                          {isImage ? (
                            <img 
                              src={imageUrl} 
                              alt={message.fileName || 'Uploaded image'}
                              className="message-image"
                            />
                          ) : (
                            <div className="message-file-info">
                              <span className="file-icon">📎</span>
                              <span className="file-name">{message.fileName}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.content && (
                        <div className={`message-text ${message.isStreaming ? 'streaming' : ''}`}>
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="message ai-message">
                  <div className="message-bubble">
                    <div className="message-text loading">
                      <Loader2 className="spinner" size={18} />
                      {/* <span>Generating response...</span> */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {selectedFile && (
            <div className="selected-file">
              <span>📎 {selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)}>×</button>
            </div>
          )}
          <div className="chat-input-wrapper">
            <div className="input-group">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Ask template.net"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                rows={1}
                disabled={isLoading}
              />
              <div className="input-actions">
                <button
                  className="tools-button"
                  onClick={handleUploadClick}
                  title="Upload"
                >
                  <Plus size={18} />
                  <span>Upload</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <button
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputValue.trim() && !selectedFile)}
                  title="Send"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
