// Interface para usuários
export interface User {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  password?: string;
  profileImageUrl?: string;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para instâncias WhatsApp
export interface WhatsAppInstance {
  id: string;
  userId: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  createdAt: Date;
  lastActivity?: Date;
}

// Interface para configurações
export interface Config {
  maintenanceMode: boolean;
  ignoreGroups: boolean;
  autoReplyPrivate: boolean;
  ignoreUnsaved: boolean;
  autoDownloadMedia: boolean;
  pingPong: boolean;
  autoReadMessages: boolean;
  transcribeAudio: boolean;
}

// Chat Types
export interface Contact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
  isGroup: boolean;
  lastSeen?: Date;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  instanceId: string;
  fromMe: boolean;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker';
  mediaUrl?: string;
  fileName?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  quotedMessageId?: string;
  quotedMessage?: Message;
}

export interface Chat {
  id: string;
  instanceId: string;
  contact: Contact;
  lastMessage?: Message;
  unreadCount: number;
  timestamp: Date;
  isPinned: boolean;
  isArchived: boolean;
}

// Extensão do Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
