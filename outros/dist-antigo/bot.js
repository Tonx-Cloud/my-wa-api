"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_web_js_1 = require("whatsapp-web.js");
const bull_1 = __importDefault(require("bull"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("./logger"));
const qrcode_1 = __importDefault(require("qrcode"));
const config_1 = require("./utils/config");
const messagesQueue = new bull_1.default('messages', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const client = new whatsapp_web_js_1.Client({
    authStrategy: new whatsapp_web_js_1.LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox'],
    }
});
const stateFilePath = path_1.default.join(__dirname, '../state.json');
async function writeState(state) {
    try {
        await promises_1.default.writeFile(stateFilePath, JSON.stringify(state, null, 2));
    }
    catch (error) {
        logger_1.default.error('Erro ao escrever no arquivo de estado:', { error: error.message });
    }
}
client.on('qr', async (qr) => {
    logger_1.default.info('QR Code recebido, aguardando escaneamento.');
    try {
        const url = await qrcode_1.default.toDataURL(qr);
        await writeState({ status: 'connecting', qrCode: url });
    }
    catch (err) {
        logger_1.default.error('Erro ao gerar Data URL do QR Code:', { error: err.message });
        await writeState({ status: 'error', qrCode: null, errorMessage: err.message });
    }
});
client.on('ready', async () => {
    logger_1.default.info('Cliente do WhatsApp conectado e pronto.');
    await writeState({ status: 'ready', qrCode: null });
});
client.on('disconnected', async (reason) => {
    logger_1.default.warn('Cliente do WhatsApp desconectado', { reason });
    await writeState({ status: 'disconnected', qrCode: null });
    client.initialize();
});
client.on('message', async (message) => {
    const config = (0, config_1.readConfig)(); // Usar a interface Config
    const chat = await message.getChat();
    if (config.ignoreGroups && chat.isGroup) {
        logger_1.default.info(`Mensagem de grupo ignorada: ${message.from}`);
        return;
    }
    const contact = await message.getContact();
    if (config.ignoreUnsaved && !contact.isMyContact) {
        logger_1.default.info(`Mensagem de contato não salvo ignorada: ${message.from}`);
        return;
    }
    if (config.autoReadMessages) {
        logger_1.default.info(`Mensagem de ${message.from} marcada como lida (automático).`);
    }
    logger_1.default.info(`Mensagem recebida de ${message.from}: ${message.body}`);
    if (config.pingPong && message.body === '!ping') {
        message.reply('pong');
    }
    if (config.autoReplyPrivate && !chat.isGroup) {
        if (message.body.toLowerCase() !== '!ping') {
            message.reply('Olá! Recebi sua mensagem. No momento, estou configurado para respostas automáticas. Se precisar de algo específico, por favor, aguarde um atendente.');
            logger_1.default.info(`Auto-resposta enviada para ${message.from}.`);
        }
    }
    if (config.autoDownloadMedia && message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            logger_1.default.info(`Mídia de ${message.from} baixada: ${media.mimetype}`);
        }
        catch (error) {
            logger_1.default.error('Erro ao baixar mídia:', { error: error.message });
        }
    }
    if (config.transcribeAudio && message.type === 'ptt') {
        logger_1.default.info(`Tentando transcrever áudio de ${message.from}. (Funcionalidade a ser implementada)`);
    }
});
messagesQueue.process(async (job) => {
    const { number, message } = job.data;
    const chatId = `${number}@c.us`;
    try {
        await client.sendMessage(chatId, message);
        logger_1.default.info(`Mensagem para ${number} enviada com sucesso via fila.`);
    }
    catch (error) {
        logger_1.default.error(`Erro ao enviar mensagem para ${number} via fila:`, { error: error.message, stack: error.stack });
        throw error;
    }
});
client.initialize();
writeState({ status: 'initializing', qrCode: null });
