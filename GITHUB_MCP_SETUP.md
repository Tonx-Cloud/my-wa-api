# Configuração do GitHub MCP Server

## Passos para configurar:

### 1. Criar Personal Access Token no GitHub
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Dê um nome para o token (ex: "MCP GitHub Token")
4. Selecione os escopos necessários:
   - ✅ `repo` (acesso completo aos repositórios)
   - ✅ `read:org` (ler organizações)
   - ✅ `read:user` (ler perfil do usuário)
   - ✅ `read:project` (ler projetos)
5. Clique em "Generate token"
6. Copie o token gerado (você só verá uma vez!)

### 2. Configurar variável de ambiente
Execute no PowerShell:
```powershell
# Temporariamente (apenas para a sessão atual)
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "seu_token_aqui"

# Permanentemente (para o usuário)
[System.Environment]::SetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'seu_token_aqui', 'User')
```

### 3. Verificar configuração
O arquivo `.mcp.json` já foi criado com a configuração necessária.

### 4. Reiniciar VS Code
Após configurar a variável de ambiente, reinicie o VS Code para que as mudanças tenham efeito.

## Funcionalidades disponíveis após configuração:
- Buscar e analisar repositórios GitHub
- Ler issues e pull requests
- Acessar conteúdo de arquivos
- Interagir com discussões
- Visualizar histórico de commits
- E muito mais!

## Testando a configuração:
Após reiniciar o VS Code, você pode testar perguntando ao Copilot:
"Liste os repositórios do meu GitHub" ou "Mostre as issues abertas do repositório X"
