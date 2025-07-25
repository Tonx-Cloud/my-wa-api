# Scripts de Desenvolvimento

## Iniciando o Servidor

Para iniciar o servidor de desenvolvimento, você tem duas opções:

1. Usando PowerShell:
```powershell
.\start-frontend-dev.ps1
```

2. Usando CMD/Terminal:
```bash
start-frontend-dev.bat
```

O script irá:
- Verificar e encerrar qualquer processo usando a porta 3000
- Remover package-lock.json duplicado se necessário
- Instalar dependências se necessário
- Iniciar o servidor Next.js na porta 3000

## Parando os Servidores

Para parar todos os servidores em execução:

1. Usando PowerShell:
```powershell
.\stop-servers.ps1
```

2. Usando CMD/Terminal:
```bash
stop-servers.bat
```

## Problemas Comuns

1. **Porta em uso**: O script já lida automaticamente com processos usando a porta 3000.

2. **Package Lock Conflicts**: O script remove automaticamente o package-lock.json do frontend para evitar conflitos.

3. **Permissões do PowerShell**: Se encontrar erros de execução de scripts, execute:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
