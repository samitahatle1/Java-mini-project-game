import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, MessageSquare, Sparkles } from 'lucide-react';
import { ChatMessage, Player } from '../types';
import { wsService } from '../services/websocket';
import { sound } from '../services/audio';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  currentPlayer
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      senderId: 'sys',
      senderName: 'Game Guide',
      text: 'Welcome to the live friendship channel! Send chats or clues to your best friend here.',
      timestamp: Date.now() - 30000
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = wsService.subscribe((data) => {
      if (data.type === 'CHAT_MESSAGE') {
        setMessages(prev => [...prev, {
          id: `${Date.now()}_${Math.random()}`,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp
        }]);
        sound.playClick?.();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    wsService.sendChat(inputText.trim());
    setInputText('');
  };

  const handleQuickEmote = (emote: string) => {
    wsService.sendChat(emote);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200 flex flex-col animate-pop">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#3A3A45]">
              Live In-Game Chat
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Friend
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((m) => {
          const isMe = m.senderId === currentPlayer.id || m.senderName === currentPlayer.name;
          const isSys = m.senderId === 'sys';

          if (isSys) {
            return (
              <div key={m.id} className="text-center my-2">
                <span className="text-[11px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                  {m.text}
                </span>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-400 font-medium px-1 mb-0.5">
                {isMe ? 'You' : m.senderName}
              </span>
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs md:text-sm shadow-2xs leading-relaxed ${
                  isMe
                    ? 'bg-purple-600 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emote Reactions Bar */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
        {['❤️', '🙌', '😂', '🌸', '🕵️', '🔥'].map(emoji => (
          <button
            key={emoji}
            onClick={() => handleQuickEmote(emoji)}
            className="p-1.5 rounded-lg hover:bg-white text-base transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
        <input
          type="text"
          placeholder="Whisper to your friend..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </form>

    </div>
  );
};
