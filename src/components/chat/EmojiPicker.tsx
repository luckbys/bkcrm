import React from 'react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface EmojiPickerWrapperProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerWrapperProps> = ({
  onEmojiSelect,
  onClose,
  className
}) => {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <div className={cn(
      "relative bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden",
      "animate-in zoom-in-95 duration-200",
      className
    )}>
      {/* Header do emoji picker */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <span className="text-sm font-medium text-gray-700">Selecione um emoji</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Emoji picker */}
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        theme={Theme.LIGHT}
        height={350}
        width={320}
        searchDisabled={false}
        skinTonesDisabled={false}
        previewConfig={{
          showPreview: true,
          defaultEmoji: "1f60a",
          defaultCaption: "Que emoji voce esta procurando?"
        }}
      />
    </div>
  );
}; 