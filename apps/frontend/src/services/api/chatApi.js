import apiClient from '../apiClient';

const chatApi = {
  /**
   * Get chat history
   * @param {string} conversationId - Optional conversation ID
   * @returns {Promise} Object with messages and conversationId
   */
  getChatHistory: async (conversationId = null) => {
    try {
      const params = conversationId ? { conversationId } : {};
      const response = await apiClient.get('/api/chat/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  /**
   * Send a message to AI
   * @param {FormData} formData - FormData with message, conversationId, and optional file
   * @returns {Promise} Response with userMessage, aiResponse, and conversationId
   */
  sendMessage: async (formData) => {
    try {
      const response = await apiClient.post('/api/chat/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Clear chat history
   * @returns {Promise}
   */
  clearHistory: async () => {
    try {
      const response = await apiClient.delete('/api/chat/history');
      return response.data;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  },

  /**
   * Send a message with streaming response
   * @param {string} message - User message
   * @param {File} file - Optional file attachment
   * @param {string} conversationId - Optional conversation ID
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onComplete - Callback when done (receives finalMessage, conversationId)
   * @param {Function} onError - Callback on error
   */
  sendMessageStream: async (message, file = null, conversationId = null, onChunk, onComplete, onError) => {
    try {
      const formData = new FormData();
      formData.append('message', message);
      
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`${apiClient.defaults.baseURL}/api/chat/send-stream`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'userMessage') {
              // User message saved
              continue;
            } else if (data.type === 'chunk') {
              onChunk(data.data);
            } else if (data.type === 'done') {
              onComplete(data.data, data.conversationId);
            } else if (data.type === 'error') {
              onError(new Error(data.data));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming:', error);
      onError(error);
    }
  },

  /**
   * Health check
   * @returns {Promise}
   */
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};

export default chatApi;
