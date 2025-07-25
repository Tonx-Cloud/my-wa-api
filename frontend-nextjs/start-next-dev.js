#!/usr/bin/env node

/**
 * Script Bootstrap para iniciar Next.js em modo desenvolvimento
 * Compatível com PM2 e Windows
 * Autor: Sistema WA-API
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Next.js em modo desenvolvimento...');
console.log('📁 Diretório:', process.cwd());
console.log('🌐 URL: http://localhost:3000');
console.log('');

// Configurar o processo Next.js
const nextProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
});

// Tratar sinais de encerramento
process.on('SIGINT', () => {
    console.log('\n⚠️  Recebido sinal de interrupção...');
    nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  Recebido sinal de término...');
    nextProcess.kill('SIGTERM');
});

// Tratar saída do processo
nextProcess.on('exit', (code, signal) => {
    console.log(`\n📊 Next.js encerrado com código: ${code}, sinal: ${signal}`);
    process.exit(code);
});

// Tratar erros
nextProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar Next.js:', error);
    process.exit(1);
});
