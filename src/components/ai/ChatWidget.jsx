'use client';

import { useState, useEffect, useRef } from 'react';
import { RiChatSmileAiLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import { FiSend } from "react-icons/fi";
import { FaClock, FaPhoneAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('bg');
  const messagesEndRef = useRef(null);

  const initializeGreeting = (lang) => ({
    role: 'assistant',
    content: lang === 'bg'
      ? 'Здравейте! Аз съм вашият личен AI асистент. Как мога да Ви бъда полезен?'
      : 'Hello! I am your AI assistant for Yotto Stones. How can I assist you today?'
  });

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && messages.length === 0) {
      setMessages([initializeGreeting(language)]);
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    setLanguage(selectedLanguage);

    setMessages(prev => prev.length <= 1
      ? [initializeGreeting(selectedLanguage)]
      : [...prev, { role: 'assistant', content: selectedLanguage === 'bg' ? 'Смени езика на български.' : 'Switched language to English.' }]
    );
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, language }),
      });
      const data = await response.json();
      const botMessage = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div>
      {/* Floating Button */}
      <button
      
        className="fixed bottom-6 right-6 bg-darkGold hover:bg-darkGoldHover text-white p-4 rounded-full shadow-lg z-[2000] transition-all"
        onClick={toggleChat}
        aria-label="Open chat"
      >
        {isOpen ? 'Затвори чат' : <RiChatSmileAiLine className="text-2xl" />}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <motion.div 
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-0 right-0 w-full h-full md:bottom-24 md:right-6 md:w-[400px] md:h-[80%] bg-white rounded-none md:rounded-xl shadow-md flex flex-col z-[2002]">

          {/* Header */}
          <div className="flex flex-col bg-darkGold/70 md:rounded-t-xl text-white relative">
            {/* Close Button */}
            <button onClick={toggleChat} className="absolute top-2 right-2 hover:text-royalGold transition-colors">
              <IoClose className="text-xl" />
            </button>

            {/* Main Title */}
            <div className="flex flex-col items-center p-3">
              <RiChatSmileAiLine className="text-3xl" />
              <span className="font-bold text-md tracking-widest mt-1">Yotto AI</span>
            </div>

            {/* Contact & Hours */}
            <div className="flex flex-col text-center px-4 text-gray-100 text-sm space-y-1 pb-2">
              <p>Връзка с наш служител:</p>
              <a href="tel:+359895198805" className="flex justify-center items-center space-x-2 hover:text-royalGold transition-colors">
                <FaPhoneAlt />
                <span>0895 198 805</span>
              </a>
              <div className="flex justify-center items-center space-x-2 text-xs">
                <FaClock />
                <span>Пон-Пет 9:00 - 18:00</span>
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex justify-end p-2 border-b border-gray-200">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-royalGold"
            >
              <option value="en">English</option>
              <option value="bg">Български</option>
            </select>
          </div>

          {/* Messages */}
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm leading-snug shadow-sm
                  ${msg.role === 'user' ? 'bg-darkGold text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-1 text-gray-400 text-sm">
                <span className="animate-typing-dot">•</span>
                <span className="animate-typing-dot delay-400">•</span>
                <span className="animate-typing-dot delay-800">•</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center p-2 border-t border-gray-200">
            <div className="relative w-full">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-royalGold"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Попитай ме нещо..."
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-darkGold hover:text-darkGoldHover disabled:opacity-50"
                onClick={sendMessage}
                disabled={loading}
              >
                <FiSend className="text-lg" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
