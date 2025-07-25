
# PowerShell script para reiniciar API, Bot e Frontend em modo dev com logs

# 1. Parar todos os processos node e PM2 relacionados
Write-Host "Encerrando todos os processos node e PM2..."
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
pm2 delete all | Out-Null

# 2. Iniciar API em modo dev com PM2 e salvar logs
Write-Host "Iniciando API em modo dev com PM2..."
pm2 start src/index.ts --name api --watch --interpreter ./node_modules/.bin/ts-node --log-date-format 'YYYY-MM-DD HH:mm:ss' --output logs/api-out.log --error logs/api-err.log

# 3. Iniciar Bot em modo dev com PM2 e salvar logs
Write-Host "Iniciando Bot em modo dev com PM2..."
pm2 start src/bot.ts --name bot --watch --interpreter ./node_modules/.bin/ts-node --log-date-format 'YYYY-MM-DD HH:mm:ss' --output logs/bot-out.log --error logs/bot-err.log


# 4. Iniciar Frontend Next.js em modo dev via bootstrap JS (compatível Windows)
Write-Host "Iniciando Frontend Next.js em modo dev com PM2 (bootstrap JS)..."
pm2 start start-next-dev.js --name frontend --cwd ./frontend-nextjs --interpreter node --log-date-format 'YYYY-MM-DD HH:mm:ss' --output ../logs/frontend-out.log --error ../logs/frontend-err.log

# 5. Mostrar status dos processos
pm2 ls
Write-Host "API, Bot e Frontend reiniciados em modo dev. Logs em ./logs/"
