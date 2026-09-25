import React, { useState } from 'react';
import { X, Check, Sparkles, Smile } from 'lucide-react';
import { Player, Account, AvatarConfig } from '../types';
import { api } from '../services/api';
import { sound } from '../services/audio';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  currentPlayer: Player;
  currentRole: 'user1' | 'user2';
  onUpdatePlayer: (player: Player) => void;
}

const PASTEL_COLORS = [
  { name: 'Blush Pink', hex: '#FFE3EC' },
  { name: 'Sky Blue', hex: '#DCEEFF' },
  { name: 'Mint Green', hex: '#DFF7EA' },
  { name: 'Buttercream', hex: '#FFF4D6' },
  { name: 'Soft Lavender', hex: '#E7DFFF' },
  { name: 'Peach Coral', hex: '#FFD8BE' }
];

const EMOJIS = ['🌸', '⭐', '🐱', '🐼', '🦊', '🍀', '✨', '☕', '🎮', '🍓'];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  account,
  currentPlayer,
  currentRole,
  onUpdatePlayer
}) => {
  if (!isOpen) return null;

  const [color, setColor] = useState(currentPlayer.avatar?.color || '#FFE3EC');
  const [emoji, setEmoji] = useState(currentPlayer.avatar?.emoji || '🌸');
  const [hair, setHair] = useState(currentPlayer.avatar?.hair || 'curly');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    sound.playClick?.();

    try {
      const updatedAvatar: AvatarConfig = {
        color,
        accent: color,
        emoji,
        hair: hair as any,
        style: 'casual'
      };

      await api.updateAvatar(account.id, currentRole, updatedAvatar);

      const updatedPlayer: Player = {
        ...currentPlayer,
        avatar: updatedAvatar
      };

      onUpdatePlayer(updatedPlayer);
      sound.playCorrect();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-pop">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#FFE3EC] via-[#E7DFFF] to-[#DCEEFF] flex items-center justify-between border-b border-purple-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <div>
              <h3 className="font-heading font-bold text-base text-[#3A3A45]">
                Customize {currentPlayer.name}'s Avatar
              </h3>
              <p className="text-[11px] text-slate-500">
                Personalize your in-world exploration sprite
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Sprite Preview */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-purple-200 flex flex-col items-center justify-center shadow-inner relative">
              <span className="text-3xl">{emoji}</span>
              <div 
                className="w-10 h-7 rounded-xl mt-1 border border-white shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-bold text-slate-600 mt-1">{currentPlayer.name}</span>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Outfit Pastel Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PASTEL_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`h-10 rounded-2xl border-2 transition-all flex items-center justify-center shadow-2xs ${
                    color === c.hex ? 'border-purple-600 scale-105' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {color === c.hex && <Check size={14} className="text-purple-800" />}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Badge Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Companion Symbol
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map(em => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`h-10 rounded-2xl border text-xl flex items-center justify-center transition-all ${
                    emoji === em ? 'bg-purple-100 border-purple-400 scale-105 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{saving ? 'Saving Sprite...' : 'Save & Wear in Expedition'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
