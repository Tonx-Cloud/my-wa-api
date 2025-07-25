"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeConfig = exports.readConfig = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const configPath = path.join(__dirname, '../../config.json');
const configCache = new Map();
const readConfig = () => {
    const cacheKey = 'appConfig';
    const cached = configCache.get(cacheKey);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        configCache.set(cacheKey, { data: config, timestamp: Date.now() });
        return config;
    }
    catch (error) {
        console.error('Erro ao ler config.json:', error);
        const default_config = {
            maintenanceMode: false,
            ignoreGroups: true,
            autoReplyPrivate: false,
            ignoreUnsaved: false,
            autoDownloadMedia: true,
            pingPong: false,
            autoReadMessages: false,
            transcribeAudio: false
        };
        configCache.set(cacheKey, { data: default_config, timestamp: Date.now() });
        return default_config;
    }
};
exports.readConfig = readConfig;
const writeConfig = (config) => {
    const cacheKey = 'appConfig';
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        configCache.set(cacheKey, { data: config, timestamp: Date.now() }); // Atualiza o cache após a escrita
    }
    catch (error) {
        console.error('Erro ao escrever config.json:', error);
    }
};
exports.writeConfig = writeConfig;
