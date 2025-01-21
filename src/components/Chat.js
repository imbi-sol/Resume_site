import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const systemMessage = {
    role: 'system',
    content: 'You are an AI assistant with expertise in blockchain technology, smart contracts, and web3 development. You provide clear, concise, and technically accurate responses. When discussing code or technical concepts, you use specific examples and explain them in a way that\'s easy to understand.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage.content, sender: 'user' }]);

    try {
      // Create array of messages including system message
      const messageHistory = [
        systemMessage,
        ...messages.map(msg => ({
          role: msg.sender,
          content: msg.text
        })),
        userMessage
      ];

      // Create EventSource for streaming response
      const eventSource = new EventSource('https://chat-ai-function.fleek.co/api/chat?' + new URLSearchParams({
        messages: JSON.stringify(messageHistory)
      }));

      let fullContent = '';

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        fullContent += data.content;
        
        // Update only the assistant's message
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.sender === 'assistant') {
            return [...prev.slice(0, -1), { text: fullContent, sender: 'assistant' }];
          } else {
            return [...prev, { text: fullContent, sender: 'assistant' }];
          }
        });
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsLoading(false);
      };

      eventSource.addEventListener('done', () => {
        eventSource.close();
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant'
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="loading">
            Thinking...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
