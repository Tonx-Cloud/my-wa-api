import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types';

const configPath = path.join(__dirname, '../../config.json');

interface CachedConfig {
  data: Config;
  timestamp: number;
}

const configCache = new Map<string, CachedConfig>();

export const readConfig = (): Config => {
  const cacheKey = 'appConfig';
  const cached = configCache.get(cacheKey);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data) as Config;
    configCache.set(cacheKey, { data: config, timestamp: Date.now() });
    return config;
  } catch (error) {
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

export const writeConfig = (config: Config): void => {
  const cacheKey = 'appConfig';
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    configCache.set(cacheKey, { data: config, timestamp: Date.now() }); // Atualiza o cache após a escrita
  } catch (error) {
    console.error('Erro ao escrever config.json:', error);
  }
};