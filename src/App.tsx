/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { generateGujuBotImage, getGujuResponse, generateSpeech } from './services/geminiService';
import { MessageCircle, Send, Volume2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function App() {
  const [botImage, setBotImage] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState('smiling');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initBot();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initBot = async (action: string = 'smiling') => {
    setIsGeneratingImage(true);
    setCurrentAction(action);
    try {
      const img = await generateGujuBotImage(action);
      setBotImage(img);
      if (messages.length === 0) {
        setMessages([{ role: 'bot', content: 'નમસ્તે! હું ડોરેમોન છું. હું તમને કેવી રીતે મદદ કરી શકું? (Hello! I am Doraemon. How can I help you?)' }]);
      }
    } catch (error) {
      console.error("Failed to initialize bot:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await getGujuResponse(userMsg);
      if (response) {
        setMessages(prev => [...prev, { role: 'bot', content: response }]);
        // Automatically speak the response
        handleSpeak(response);
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages(prev => [...prev, { role: 'bot', content: 'ક્ષમા કરશો, કંઈક ભૂલ થઈ છે. (Sorry, something went wrong.)' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioUrl = await generateSpeech(text);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("Speech generation failed:", error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans selection:bg-orange-200">
      {/* Header */}
      <header className="border-b border-black/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Doraemon</h1>
              <p className="text-xs text-black/50 uppercase tracking-widest font-medium">Futuristic Companion</p>
            </div>
          </div>
          <button 
            onClick={() => initBot('smiling')}
            disabled={isGeneratingImage}
            className="p-2 hover:bg-black/5 rounded-full transition-colors disabled:opacity-50"
            title="Regenerate Bot Appearance"
          >
            <RefreshCw size={20} className={cn(isGeneratingImage && "animate-spin")} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Bot Character Display */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-black/5 group">
            {isGeneratingImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50/50 backdrop-blur-sm">
                <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                <p className="text-sm font-medium text-blue-600 animate-pulse">Designing your companion...</p>
              </div>
            ) : botImage ? (
              <img 
                src={botImage} 
                alt="Doraemon" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-gray-400">No image generated</p>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-black/5 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">3D Mode Active</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'smiling', label: 'Smile', icon: '😊' },
              { id: 'eating', label: 'Eat', icon: '🥞' },
              { id: 'flying', label: 'Fly', icon: '🚁' },
              { id: 'gadget', label: 'Gadget', icon: '🔦' },
              { id: 'dancing', label: 'Dance', icon: '💃' },
            ].map((action) => (
              <button
                key={action.id}
                onClick={() => initBot(action.id)}
                disabled={isGeneratingImage}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all shadow-sm",
                  currentAction === action.id 
                    ? "bg-blue-600 border-blue-600 text-white shadow-blue-200" 
                    : "bg-white border-black/5 text-black/60 hover:bg-gray-50"
                )}
              >
                <span className="text-xl mb-1">{action.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-black/5">
            <h2 className="text-lg font-serif italic mb-2">About Doraemon</h2>
            <p className="text-sm text-black/70 leading-relaxed">
              Doraemon is the famous robotic cat from the future, here to help you with anything while celebrating Gujarati culture. He's smart, friendly, and always has a gadget ready from his 4D pocket!
            </p>
          </div>
        </div>

        {/* Right Side: Chat Interface */}
        <div className="lg:col-span-7 flex flex-col h-[70vh] lg:h-[80vh] bg-white rounded-[2rem] shadow-2xl border border-black/5 overflow-hidden">
          {/* Chat Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-[#f5f5f0] text-[#1a1a1a] rounded-tl-none border border-black/5"
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'bot' && (
                  <button 
                    onClick={() => handleSpeak(msg.content)}
                    disabled={isSpeaking}
                    className="mt-2 p-1.5 text-black/40 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Volume2 size={14} className={cn(isSpeaking && "animate-pulse text-blue-500")} />
                    {isSpeaking ? "Speaking..." : "Listen"}
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="bg-[#f5f5f0] px-4 py-3 rounded-2xl rounded-tl-none border border-black/5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#fcfcfc] border-t border-black/5">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Doraemon something in Gujarati..."
                className="w-full bg-white border border-black/10 rounded-full px-6 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-blue-600 shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="mt-3 text-[10px] text-center text-black/40 font-medium uppercase tracking-widest">
              Doraemon typically responds in Gujarati
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-50">
        <div className="text-xs font-medium uppercase tracking-widest">© 2026 Doraemon Labs</div>
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs font-medium uppercase tracking-widest hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#" className="text-xs font-medium uppercase tracking-widest hover:text-blue-600 transition-colors">Terms</a>
          <a href="#" className="text-xs font-medium uppercase tracking-widest hover:text-blue-600 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
