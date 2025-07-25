// types/whatsapp.ts
import { Client } from 'whatsapp-web.js';
import Queue from 'bull';

export interface MessageJobData {
  number: string;
  message: string;
}

export interface Instance {
  id: string;
  name: string;
  status: ConnectionStatus;
  client: Client;
  qr?: string;
  messagesQueue: Queue.Queue<MessageJobData>;
  lastConnected?: Date;
  lastError?: string;
  reconnectAttempts: number;
  reconnectTimeout?: NodeJS.Timeout;
  qrTimeout?: NodeJS.Timeout;
  healthCheckInterval?: NodeJS.Timeout;
}

export type ConnectionStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'connecting' 
  | 'failed' 
  | 'qr_timeout' 
  | 'authenticated';

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnected?: Date;
  lastError?: string;
  reconnectAttempts: number;
}
