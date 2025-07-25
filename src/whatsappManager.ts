// whatsappManager.ts
// Gerencia múltiplas instâncias WhatsApp usando whatsapp-web.js

import { Client, LocalAuth, Message, Chat, Contact, MessageMedia } from 'whatsapp-web.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import logger from './logger';
import fs from 'fs';
import Queue, { Job } from 'bull';
import { readConfig } from './utils/config';
import { Config } from './types';
import { Instance, MessageJobData, ConnectionStatus, ConnectionState } from './types/whatsapp';

// Configurações
const QR_TIMEOUT = 2 * 60 * 1000; // 2 minutos
const MAX_RECONNECT_ATTEMPTS = 10;
const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 segundos
const INITIAL_RECONNECT_DELAY = 5000; // 5 segundos

const INSTANCES_FILE = './wa-instances.json';

let instances: Record<string, Instance> = {};

// Cache do estado de conexão
const connectionStates = new Map<string, ConnectionState>();

function updateConnectionState(id: string, state: Partial<ConnectionState>) {
  const currentState = connectionStates.get(id) || {
    status: 'disconnected',
    reconnectAttempts: 0
  };
  
  connectionStates.set(id, {
    ...currentState,
    ...state
  });
  
  // Salvar estado em disco
  saveInstances();
}

// Carregar instâncias do disco ao iniciar
function loadInstances() {
  if (fs.existsSync(INSTANCES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(INSTANCES_FILE, 'utf-8'));
      for (const id in data) {
        // Não restaura o client, só metadados
        instances[id] = { ...data[id], client: undefined, messagesQueue: undefined };
      }
    } catch (e) { logger.error('[WA] Erro ao carregar instâncias:', e); }
  }
}

function saveInstances() {
  const toSave: Record<string, any> = {};
  for (const id in instances) {
    const { client, messagesQueue, reconnectTimeout, qrTimeout, healthCheckInterval, ...meta } = instances[id];
    // Apenas salvar propriedades serializáveis, evitando objetos complexos
    toSave[id] = {
      id: meta.id,
      name: meta.name,
      status: meta.status,
      qr: meta.qr,
      lastConnected: meta.lastConnected,
      lastError: meta.lastError,
      reconnectAttempts: meta.reconnectAttempts
      // Não incluir timeout objects e outras propriedades não serializáveis
    };
  }
  
  try {
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(toSave, null, 2));
  } catch (error) {
    logger.error('[WA] Erro ao salvar instâncias:', error);
  }
}

loadInstances();

export function listInstances() {
  return Object.values(instances).map(({ id, name, status }) => ({ id, name, status }));
}

export function getInstance(id: string) {
  return instances[id];
}

export function createInstance(name: string) {
  const id = uuidv4();
  const messagesQueue = new Queue<MessageJobData>(`messages-${id}`, process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  const client = makeClient(id, messagesQueue);
  
  instances[id] = { 
    id, 
    name, 
    status: 'connecting', 
    client, 
    messagesQueue,
    reconnectAttempts: 0
  };
  
  updateConnectionState(id, {
    status: 'connecting',
    reconnectAttempts: 0,
    lastConnected: new Date()
  });
  
  // startHealthCheck(id); // TODO: Implementar health check se necessário
  saveInstances();
  return instances[id];
}

function makeClient(id: string, messagesQueue: Queue.Queue<MessageJobData>) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: id }),
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox'] 
    }
  });

  client.on('qr', async (qr: string) => {
    logger.info(`[WA] QR recebido para instância ${id}`);
    const instance = instances[id];
    if (!instance) return;

    try {
      const qrPng = await QRCode.toDataURL(qr);
      instance.qr = qrPng;
      instance.status = 'connecting';
      
      // Limpa timeout anterior do QR se existir
      if (instance.qrTimeout) {
        clearTimeout(instance.qrTimeout);
      }

      // Define novo timeout para o QR
      instance.qrTimeout = setTimeout(() => {
        if (instances[id]?.status === 'connecting') {
          logger.warn(`[WA] Timeout do QR code para instância ${id}`);
          instances[id].qr = undefined;
          instances[id].status = 'qr_timeout';
          updateConnectionState(id, {
            status: 'qr_timeout',
            lastError: 'QR Code expirou'
          });
          saveInstances();
        }
      }, QR_TIMEOUT);

      logger.info(`[WA] QR code convertido para base64 para instância ${id}`);
    } catch (e) {
      logger.error(`[WA] Erro ao converter QR code para base64: ${e}`);
      instance.qr = undefined;
      updateConnectionState(id, {
        status: 'failed',
        lastError: e instanceof Error ? e.message : String(e)
      });
    }
    saveInstances();
  });

  client.on('ready', () => {
    logger.info(`[WA] Cliente conectado para instância ${id}`);
    const instance = instances[id];
    if (instance) {
      instance.status = 'connected';
      instance.qr = undefined;
      instance.reconnectAttempts = 0;
      instance.lastConnected = new Date();
      
      // Limpar timeout de reconexão se existir
      if (instance.reconnectTimeout) {
        clearTimeout(instance.reconnectTimeout);
        instance.reconnectTimeout = undefined;
      }
      
      updateConnectionState(id, {
        status: 'connected',
        reconnectAttempts: 0,
        lastConnected: new Date()
      });
    }
    saveInstances();
  });

  client.on('disconnected', async (reason) => {
    logger.warn(`[WA] Cliente desconectado para instância ${id}`, { reason });
    const instance = instances[id];
    if (!instance) return;

    instance.status = 'disconnected';
    updateConnectionState(id, {
      status: 'disconnected',
      lastError: reason
    });

    // Implementa reconexão com backoff exponencial
    if (instance.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY * Math.pow(2, instance.reconnectAttempts),
        300000 // máximo 5 minutos
      );

      instance.reconnectAttempts++;
      logger.info(`[WA] Tentando reconexão para instância ${id} em ${delay}ms (tentativa ${instance.reconnectAttempts})`);
      
      // Limpa timeout anterior se existir
      if (instance.reconnectTimeout) {
        clearTimeout(instance.reconnectTimeout);
      }

      instance.reconnectTimeout = setTimeout(async () => {
        try {
          await client.initialize();
        } catch (error) {
          logger.error(`[WA] Erro na tentativa de reconexão para instância ${id}:`, error);
          updateConnectionState(id, {
            status: 'failed',
            lastError: error instanceof Error ? error.message : String(error)
          });
        }
      }, delay);
    } else {
      logger.error(`[WA] Máximo de tentativas de reconexão atingido para instância ${id}`);
      updateConnectionState(id, {
        status: 'failed',
        lastError: 'Máximo de tentativas de reconexão atingido'
      });
    }
    saveInstances();
  });

  client.on('auth_failure', (msg) => {
    logger.error(`[WA] Falha na autenticação para instância ${id}: ${msg}`);
    instances[id].status = 'disconnected';
    instances[id].qr = undefined;
    saveInstances();
  });

  client.on('message', async (message: Message) => {
    const config: Config = readConfig(); // Usar a interface Config

    const chat: Chat = await message.getChat();
    if (config.ignoreGroups && chat.isGroup) {
        logger.info(`[WA][${id}] Mensagem de grupo ignorada: ${message.from}`);
        return;
    }

    const contact: Contact = await message.getContact();
    if (config.ignoreUnsaved && !contact.isMyContact) {
        logger.info(`[WA][${id}] Mensagem de contato não salvo ignorada: ${message.from}`);
        return;
    }

    if (config.autoReadMessages) {
        logger.info(`[WA][${id}] Mensagem de ${message.from} marcada como lida (automático).`);
    }

    logger.info(`[WA][${id}] Mensagem recebida de ${message.from}: ${message.body}`);

    if (config.pingPong && message.body === '!ping') {
		message.reply('pong');
	}

    if (config.autoReplyPrivate && !chat.isGroup) {
        if (message.body.toLowerCase() !== '!ping') {
            message.reply('Olá! Recebi sua mensagem. No momento, estou configurado para respostas automáticas. Se precisar de algo específico, por favor, aguarde um atendente.');
            logger.info(`[WA][${id}] Auto-resposta enviada para ${message.from}.`);
        }
    }

    if (config.autoDownloadMedia && message.hasMedia) {
        try {
            const media: MessageMedia = await message.downloadMedia();
            logger.info(`[WA][${id}] Mídia de ${message.from} baixada: ${media.mimetype}`);
        } catch (error: any) {
            logger.error(`[WA][${id}] Erro ao baixar mídia:`, { error: error.message });
        }
    }

    if (config.transcribeAudio && message.type === 'ptt') {
        logger.info(`[WA][${id}] Tentando transcrever áudio de ${message.from}. (Funcionalidade a ser implementada)`);
    }
  });

  messagesQueue.process(async (job: Job<MessageJobData>) => {
    const { number, message } = job.data;
    const chatId = `${number}@c.us`;
    try {
        await client.sendMessage(chatId, message);
        logger.info(`[WA][${id}] Mensagem para ${number} enviada com sucesso via fila.`);
    } catch (error: any) {
        logger.error(`[WA][${id}] Erro ao enviar mensagem para ${number} via fila:`, { error: error.message, stack: error.stack });
        throw error; 
    }
  });

  client.initialize();
  return client;
}

export async function deleteInstance(id: string) {
  if (instances[id]) {
    if (instances[id].client) await instances[id].client.destroy();
    if (instances[id].messagesQueue) await instances[id].messagesQueue.close();
    delete instances[id];
    saveInstances();
    return true;
  }
  return false;
}

export async function restartInstance(id: string) {
  const inst = instances[id];
  if (inst) {
    if (inst.client) await inst.client.destroy();
    // A fila não precisa ser recriada, apenas o cliente
    inst.status = 'connecting';
    inst.qr = undefined;
    inst.client = makeClient(id, inst.messagesQueue);
    saveInstances();
    return true;
  }
  return false;
}

export async function disconnectInstance(id: string) {
  const inst = instances[id];
  if (inst && inst.client) {
    await inst.client.logout();
    inst.status = 'disconnected';
    saveInstances();
    return true;
  }
  return false;
}

export function getQr(id: string) {
  return instances[id]?.qr;
}

// Reconectar instâncias ao iniciar
for (const id in instances) {
  if (!instances[id].client) {
    const messagesQueue = new Queue<MessageJobData>(`messages-${id}`, process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    instances[id].messagesQueue = messagesQueue;
    instances[id].client = makeClient(id, messagesQueue);
  }
}

// ============================================================================
// CHAT FUNCTIONS
// ============================================================================

export async function getChats(instanceId: string): Promise<any[]> {
  const instance = instances[instanceId];
  if (!instance || !instance.client || instance.status !== 'connected') {
    logger.warn(`[Chat] Instância ${instanceId} não disponível para buscar chats`);
    return [];
  }

  try {
    const chats = await instance.client.getChats();
    
    return chats.map(chat => ({
      id: chat.id._serialized,
      instanceId,
      contact: {
        id: chat.id._serialized,
        name: chat.name || chat.id.user,
        phone: chat.id.user,
        profilePicUrl: null, // Pode ser implementado posteriormente
        isGroup: chat.isGroup,
        lastSeen: null,
        isOnline: false
      },
      lastMessage: chat.lastMessage ? {
        id: chat.lastMessage.id._serialized,
        chatId: chat.id._serialized,
        instanceId,
        fromMe: chat.lastMessage.fromMe,
        from: chat.lastMessage.from,
        to: chat.lastMessage.to,
        body: chat.lastMessage.body,
        type: chat.lastMessage.type as any,
        timestamp: new Date(chat.lastMessage.timestamp * 1000),
        status: 'sent' as any
      } : undefined,
      unreadCount: chat.unreadCount || 0,
      timestamp: chat.lastMessage ? new Date(chat.lastMessage.timestamp * 1000) : new Date(),
      isPinned: false,
      isArchived: false
    })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    logger.error(`[Chat] Erro ao buscar chats da instância ${instanceId}:`, error);
    return [];
  }
}

export async function getChatMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
  // Encontrar a instância que contém este chat
  let targetInstance = null;
  let targetInstanceId = '';

  for (const [instanceId, instance] of Object.entries(instances)) {
    if (instance.client && instance.status === 'connected') {
      try {
        const chat = await instance.client.getChatById(chatId);
        if (chat) {
          targetInstance = instance;
          targetInstanceId = instanceId;
          break;
        }
      } catch (error) {
        // Chat não encontrado nesta instância, continuar procurando
        continue;
      }
    }
  }

  if (!targetInstance) {
    logger.warn(`[Chat] Chat ${chatId} não encontrado em nenhuma instância`);
    return [];
  }

  try {
    const chat = await targetInstance.client.getChatById(chatId);
    const messages = await chat.fetchMessages({ limit });

    return messages.map(msg => ({
      id: msg.id._serialized,
      chatId: chatId,
      instanceId: targetInstanceId,
      fromMe: msg.fromMe,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      type: msg.type as any,
      mediaUrl: null, // Pode ser implementado posteriormente
      fileName: null,
      timestamp: new Date(msg.timestamp * 1000),
      status: msg.fromMe ? 'sent' as any : 'read' as any,
      quotedMessageId: msg.hasQuotedMsg ? 'quoted' : undefined // Simplificado
    })).reverse(); // Ordem cronológica
  } catch (error) {
    logger.error(`[Chat] Erro ao buscar mensagens do chat ${chatId}:`, error);
    return [];
  }
}

export async function sendMessage(chatId: string, message: string, quotedMessageId?: string): Promise<any> {
  // Encontrar a instância que contém este chat
  let targetInstance = null;
  let targetInstanceId = '';

  for (const [instanceId, instance] of Object.entries(instances)) {
    if (instance.client && instance.status === 'connected') {
      try {
        const chat = await instance.client.getChatById(chatId);
        if (chat) {
          targetInstance = instance;
          targetInstanceId = instanceId;
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  if (!targetInstance) {
    return { success: false, error: 'Chat não encontrado em nenhuma instância conectada' };
  }

  try {
    const chat = await targetInstance.client.getChatById(chatId);
    
    let options: any = {};
    if (quotedMessageId) {
      try {
        const quotedMessage = await targetInstance.client.getMessageById(quotedMessageId);
        options.quotedMessageId = quotedMessage.id._serialized;
      } catch (error) {
        logger.warn(`[Chat] Mensagem citada ${quotedMessageId} não encontrada`);
      }
    }

    const sentMessage = await chat.sendMessage(message, options);
    
    logger.info(`[Chat] Mensagem enviada no chat ${chatId}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    return {
      success: true,
      messageId: sentMessage.id._serialized
    };
  } catch (error) {
    logger.error(`[Chat] Erro ao enviar mensagem no chat ${chatId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

export async function markChatAsRead(chatId: string): Promise<boolean> {
  // Encontrar a instância que contém este chat
  for (const [instanceId, instance] of Object.entries(instances)) {
    if (instance.client && instance.status === 'connected') {
      try {
        const chat = await instance.client.getChatById(chatId);
        if (chat) {
          await chat.sendSeen();
          logger.info(`[Chat] Chat ${chatId} marcado como lido`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
  }

  logger.warn(`[Chat] Chat ${chatId} não encontrado para marcar como lido`);
  return false;
}

export async function getContacts(instanceId: string, search?: string): Promise<any[]> {
  const instance = instances[instanceId];
  if (!instance || !instance.client || instance.status !== 'connected') {
    logger.warn(`[Chat] Instância ${instanceId} não disponível para buscar contatos`);
    return [];
  }

  try {
    const contacts = await instance.client.getContacts();
    
    let filteredContacts = contacts.filter(contact => !contact.isGroup);
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact => 
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.id.user.includes(search)
      );
    }

    return filteredContacts.map(contact => ({
      id: contact.id._serialized,
      name: contact.name || contact.id.user,
      phone: contact.id.user,
      profilePicUrl: null, // Pode ser implementado posteriormente
      isGroup: contact.isGroup,
      lastSeen: null,
      isOnline: false
    }));
  } catch (error) {
    logger.error(`[Chat] Erro ao buscar contatos da instância ${instanceId}:`, error);
    return [];
  }
}