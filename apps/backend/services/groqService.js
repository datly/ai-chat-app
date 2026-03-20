const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.groq = null;
  }

  initializeIfNeeded() {
    if (this.groq) return;

    const apiKey = process.env.GROQ_API_KEY;
    
    console.log('🚀 Initializing Groq API...');
    console.log('- API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
    
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY not found. Using fallback responses.');
      this.groq = null;
    } else {
      console.log('✅ Groq API initialized successfully');
      this.groq = new Groq({ apiKey });
    }
  }

  async generateResponse(userMessage, conversationHistory = []) {
    this.initializeIfNeeded();
    
    if (!this.groq) {
      return this.getFallbackResponse(userMessage);
    }

    const modelsToTry = [
      'llama-3.3-70b-versatile',
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Trying Groq model: ${modelName}`);

        // Build messages array for Groq
        const messages = [];
        
        // Add conversation history
        if (conversationHistory.length > 0) {
          conversationHistory.slice(-5).forEach(msg => {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }
        
        // Add current user message
        messages.push({
          role: 'user',
          content: userMessage
        });

        const chatCompletion = await this.groq.chat.completions.create({
          messages,
          model: modelName,
          temperature: 0.7,
          max_tokens: 2048,
        });

        const text = chatCompletion.choices[0]?.message?.content || '';

        console.log(`✅ Success with Groq model: ${modelName}`);
        return text;
      } catch (error) {
        console.error(`❌ Groq model ${modelName} failed:`, error.message);
        // Continue to next model
      }
    }

    // All models failed, use fallback
    console.error('⚠️ All Groq models failed, using fallback response');
    return this.getFallbackResponse(userMessage);
  }

  getFallbackResponse(userMessage) {
    const responses = [
      "I'm here to help! However, the AI service is currently not configured. Please add your GROQ_API_KEY to the .env file.",
      "To enable AI responses, please get a free API key from https://console.groq.com/ and add it to your .env file.",
      "AI service is not available. Please configure GROQ_API_KEY in your environment variables."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = new GroqService();
