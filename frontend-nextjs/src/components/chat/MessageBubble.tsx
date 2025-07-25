import { useState } from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Reply, Download } from 'lucide-react';
import { Message } from '@/types/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
  showSender: boolean;
  onQuote: () => void;
}

export default function MessageBubble({ message, showSender, onQuote }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock size={14} className="text-gray-400" />;
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      case 'failed':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <img
                src={message.mediaUrl}
                alt="Imagem"
                className="max-w-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.mediaUrl, '_blank')}
              />
            )}
            {message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-64 rounded-lg"
                preload="metadata"
              />
            )}
            {message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            {message.mediaUrl && (
              <audio
                src={message.mediaUrl}
                controls
                className="w-64"
                preload="metadata"
              />
            )}
            {message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📄</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.fileName || 'Documento'}
              </p>
              {message.body && (
                <p className="text-sm text-gray-600 truncate">{message.body}</p>
              )}
            </div>
            {message.mediaUrl && (
              <button
                onClick={() => window.open(message.mediaUrl, '_blank')}
                className="flex-shrink-0 p-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Download size={16} />
              </button>
            )}
          </div>
        );
      
      case 'sticker':
        return (
          <div>
            {message.mediaUrl ? (
              <img
                src={message.mediaUrl}
                alt="Sticker"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🙂</span>
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <p className="text-gray-500 italic">Tipo de mensagem não suportado</p>
        );
    }
  };

  return (
    <div
      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md relative ${message.fromMe ? 'order-2' : 'order-1'}`}>
        {/* Mensagem Citada */}
        {message.quotedMessage && (
          <div className="mb-1 p-2 bg-gray-100 border-l-4 border-green-500 rounded text-sm">
            <p className="font-medium text-gray-700">
              {message.quotedMessage.fromMe ? 'Você' : 'Contato'}
            </p>
            <p className="text-gray-600 truncate">
              {message.quotedMessage.type === 'text' 
                ? message.quotedMessage.body 
                : `📎 ${message.quotedMessage.type}`
              }
            </p>
          </div>
        )}

        {/* Bolha da Mensagem */}
        <div
          className={`px-4 py-2 rounded-lg ${
            message.fromMe
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-900 border border-gray-200'
          }`}
        >
          {getMessageContent()}
          
          {/* Timestamp e Status */}
          <div className="flex items-center justify-end mt-1 space-x-1">
            <span className={`text-xs ${
              message.fromMe ? 'text-green-100' : 'text-gray-500'
            }`}>
              {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
            </span>
            {message.fromMe && getStatusIcon()}
          </div>
        </div>

        {/* Ações da Mensagem */}
        {showActions && (
          <div className={`absolute top-0 ${
            message.fromMe ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'
          } bg-white shadow-lg rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
            <button
              onClick={onQuote}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Responder"
            >
              <Reply size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
