export interface Instance {
    id: string;
    name: string;
    status: "connected" | "disconnected" | "connecting";
}

export interface QrCodeResponse {
    qrString: string;
}

export interface ErrorResponse {
    error: string;
    details?: string;
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

export interface ChatListResponse {
    chats: Chat[];
    total: number;
}

export interface MessageListResponse {
    messages: Message[];
    total: number;
    hasMore: boolean;
}

export interface SendMessageRequest {
    chatId: string;
    message: string;
    quotedMessageId?: string;
}

export interface SendMessageResponse {
    messageId: string;
    status: 'success' | 'error';
    error?: string;
}
