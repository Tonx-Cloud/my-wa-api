# 🚀 My-Wa-Api - WhatsApp API Portal - Versão Refatorada

## 📋 Visão Geral

Uma API completa para integração com WhatsApp Web, construída com Node.js e Express no backend, e Next.js 15 no frontend. Oferece funcionalidades de autenticação OAuth, gerenciamento de múltiplas instâncias WhatsApp, interface de chat estilo WhatsApp Web e muito mais.

## ✨ Funcionalidades Principais

- **🔐 Autenticação Segura**: NextAuth.js com Google OAuth e login tradicional
- **💬 Chat Interface**: Interface completa estilo WhatsApp Web
- **📱 Multi-Instância**: Gerencimento de múltiplas conexões WhatsApp
- **📊 Dashboard**: Painel administrativo completo
- **🔄 Real-time**: Atualizações em tempo real de mensagens e status
- **📁 Upload de Arquivos**: Suporte para envio de mídias
- **🔒 Segurança**: Rate limiting, helmet, validação de dados

## 🏗️ Arquitetura

### Stack Tecnológica:
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Next.js 15 + TailwindCSS + NextAuth.js
- **Autenticação**: NextAuth.js com Google OAuth
- **WhatsApp**: whatsapp-web.js
- **Logging**: Winston
- **Segurança**: Helmet, Rate Limiting, Compression

## 📁 Estrutura do Projeto

```
wa-api/
├── 📁 src/                          # Backend Express
│   ├── bot.ts                       # Bot WhatsApp
│   ├── index.ts                     # API Express principal
│   ├── logger.ts                    # Sistema de logs
│   ├── whatsappManager.ts           # Gerenciador WhatsApp
│   ├── types/                       # Tipos TypeScript
│   │   └── index.ts                 # Interfaces principais
│   └── utils/                       # Utilitários
│       ├── config.ts                # Configurações
│       └── cors.ts                  # Configuração CORS
├── 📁 frontend-nextjs/              # Frontend Next.js
│   ├── 📁 src/
│   │   ├── 📁 app/                  # App Router Next.js 15
│   │   │   ├── 📁 api/              # API routes
│   │   │   │   ├── auth/            # NextAuth endpoints
│   │   │   │   └── instances/       # Proxy para backend
│   │   │   ├── 📁 chat/             # Interface de chat
│   │   │   ├── 📁 conexao/          # Gerenciamento de conexões
│   │   │   ├── 📁 configuracoes/    # Configurações
│   │   │   ├── 📁 dashboard/        # Dashboard principal
│   │   │   ├── 📁 login/            # Página de login
│   │   │   ├── layout.tsx           # Layout principal
│   │   │   └── page.tsx             # Página inicial
│   │   ├── 📁 components/           # Componentes React
│   │   │   ├── 📁 chat/             # Componentes do chat
│   │   │   │   ├── ChatSidebar.tsx  # Sidebar com conversas
│   │   │   │   ├── ChatWindow.tsx   # Janela principal do chat
│   │   │   │   ├── MessageBubble.tsx # Bolhas de mensagem
│   │   │   │   └── ChatWelcome.tsx  # Tela de boas-vindas
│   │   │   ├── 📁 layout/           # Layouts
│   │   │   └── 📁 providers/        # Providers (Session, etc)
│   │   ├── 📁 types/                # Tipos NextAuth
│   │   └── middleware.ts            # Middleware de autenticação
│   ├── .env.local                   # Variáveis de ambiente
│   ├── package.json                 # Dependências Next.js
│   └── start-frontend-dev.ps1       # Script PowerShell para desenvolvimento
├── 📁 logs/                         # Logs da aplicação
├── 📁 public/                       # Arquivos públicos
├── 📁 uploads/                      # Uploads de arquivos
├── config.json                      # Configurações WhatsApp
├── wa-instances.json                # Instâncias WhatsApp persistidas
└── package.json                     # Dependências backend
```

## 🔧 Configuração e Instalação

### 1. Pré-requisitos
- Node.js 18 ou superior
- NPM ou Yarn
- Google Cloud Console (para OAuth)

### 2. Clone e Configuração Inicial
```bash
# Clonar o repositório
git clone <seu-repositorio>
cd wa-api

# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd frontend-nextjs
npm install
cd ..
```

### 3. Configuração das Variáveis de Ambiente

#### Backend (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=sua_chave_secreta_muito_forte_de_pelo_menos_32_caracteres
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
SESSION_SECRET=sua_session_secret_super_segura
```

#### Frontend (.env.local)
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-session-secret-super-segura-de-pelo-menos-32-caracteres

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Backend API URL
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 4. Configuração do Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Habilite a API do Google+
4. Configure a tela de consentimento OAuth
5. Crie credenciais OAuth 2.0:
   - **Origens autorizadas**: `http://localhost:3000`
   - **URIs de redirecionamento**: `http://localhost:3000/api/auth/callback/google`

## 🚀 Executando o Projeto

### Desenvolvimento

#### Método 1: Scripts Automatizados (Recomendado)
```bash
# Terminal 1 - Backend (porta 3001)
npm run dev-server

# Terminal 2 - Frontend (porta 3000) - Windows PowerShell
cd frontend-nextjs
.\start-frontend-dev.ps1
```

#### Método 2: Manual
```bash
# Terminal 1 - Backend
npm run dev-server

# Terminal 2 - Frontend
cd frontend-nextjs
npm run dev
```

### Produção
```bash
# Build do frontend
cd frontend-nextjs
npm run build

# Build do backend (se necessário)
npm run build

# Iniciar com PM2
npm start
```

## 🔐 Sistema de Autenticação

### Funcionalidades:
- **NextAuth.js**: Gerenciamento completo de sessões
- **Google OAuth**: Login rápido com Google
- **Login Tradicional**: Email e senha com bcrypt
- **Middleware de Proteção**: Rotas protegidas automaticamente
- **Sincronização**: Backend sincroniza usuários OAuth automaticamente

### Fluxo de Autenticação:
1. Usuário acessa página protegida
2. Redirecionamento para `/login`
3. Opções: Google OAuth ou email/senha
4. Validação e criação de sessão JWT
5. Sincronização com backend via `/api/auth/sync-session`
6. Redirecionamento para página solicitada

## 💬 Sistema de Chat

### Características:
- **Interface WhatsApp Web**: Design familiar e intuitivo
- **Tempo Real**: Atualizações instantâneas de mensagens
- **Multi-Chat**: Suporte a múltiplas conversas simultâneas
- **Histórico**: Persistência de mensagens e conversas
- **Status de Leitura**: Controle de mensagens lidas/não lidas
- **Contatos**: Lista e busca de contatos

### Componentes Principais:
- **ChatSidebar**: Lista de conversas ativas
- **ChatWindow**: Janela principal de conversa
- **MessageBubble**: Renderização de mensagens
- **ChatWelcome**: Tela inicial quando nenhum chat está selecionado

## 🔗 Gerenciamento de Conexões WhatsApp

### Funcionalidades:
- **Multi-Instância**: Múltiplas conexões WhatsApp simultâneas
- **QR Code**: Geração automática para conexão
- **Status Real-Time**: Monitoramento de status das conexões
- **Persistência**: Reconexão automática após reinício
- **Gerenciamento**: CRUD completo de instâncias

### Como Usar:
1. Acesse "Conexões" no menu lateral
2. Clique em "Nova Instância"
3. Informe um nome para a instância
4. Escaneie o QR code com seu WhatsApp
5. Monitore o status da conexão

## 📊 Dashboard e Monitoramento

- **Visão Geral**: Estatísticas de uso e conexões
- **Logs**: Sistema de logging com Winston
- **Saúde do Sistema**: Monitoramento de recursos
- **Configurações**: Painel de configurações

## 🔒 Segurança

### Medidas Implementadas:
- **Rate Limiting**: Proteção contra spam e ataques
- **Helmet**: Headers de segurança HTTP
- **CORS**: Configuração adequada de CORS
- **Validação**: Validação rigorosa de dados de entrada
- **Sanitização**: Limpeza de inputs para prevenir XSS
- **JWT Seguro**: Tokens com expiração e refresh

## 🧪 Testes e Qualidade

```bash
# Testes do backend
npm run test

# Testes do frontend
cd frontend-nextjs
npm run test

# Lint
npm run lint
```

## 📝 Scripts Disponíveis

### Backend:
- `npm run dev-server`: Desenvolvimento com nodemon
- `npm run build`: Build de produção
- `npm start`: Iniciar produção
- `npm run test`: Executar testes

### Frontend:
- `npm run dev`: Desenvolvimento Next.js
- `npm run build`: Build de produção
- `npm run start`: Iniciar produção
- `npm run lint`: Verificar código
- `.\start-frontend-dev.ps1`: Script PowerShell otimizado

## � Troubleshooting

### Problemas Comuns:

1. **Erro de Porta Ocupada**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /F /PID <PID>
   
   # Ou use o script PowerShell que faz isso automaticamente
   .\start-frontend-dev.ps1
   ```

2. **Problemas de Dependências**:
   ```bash
   # Limpar e reinstalar
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Erro de Autenticação OAuth**:
   - Verifique as URLs de callback no Google Console
   - Confirme as variáveis de ambiente
   - Verifique se as origens estão corretas

4. **Problemas de Conexão Backend/Frontend**:
   - Confirme que o backend está rodando na porta 3001
   - Verifique as variáveis `BACKEND_URL` e `NEXT_PUBLIC_BACKEND_URL`

## 🚧 Desenvolvimento

### Estrutura de Commits:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes

### Próximas Funcionalidades:
- [ ] Webhook para recebimento de mensagens
- [ ] Sistema de templates de mensagem
- [ ] Integração com bancos de dados externos
- [ ] Dashboard com métricas avançadas
- [ ] API de chatbot
- [ ] Agendamento de mensagens

## 📄 Licença

ISC - Uso comercial permitido

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## � Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através dos canais oficiais.

---

**Desenvolvido com ❤️ para facilitar a integração com WhatsApp Web**


