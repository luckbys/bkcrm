// 💬 COMPONENTE DE PRÉVIA DE RESPOSTA (QUOTING)
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface ReplyPreviewProps {
  replyingTo: any;
  onCancel: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyingTo, onCancel }) => {
  if (!replyingTo) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
      <div className="flex-1">
        <div className="text-sm text-gray-600">
          Respondendo a <span className="font-medium">{replyingTo.senderName}</span>
        </div>
        <div className="text-sm text-gray-800 truncate">
          {replyingTo.content}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
 