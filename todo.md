# To-Do List - WA API

## Fase 1: Estrutura e Servidor Básico

- [x] Criar arquivo `todo.md` com o plano de ação.
- [x] Iniciar o projeto Node.js com `npm init`.
- [x] Criar a estrutura de pastas: `src`, `public`.
- [x] Instalar dependências iniciais: `express`, `whatsapp-web.js`.
- [x] Criar um servidor Express básico em `src/index.js`.
- [x] Configurar o `pm2` para gerenciar o processo do servidor.

## Fase 2: API e Integração com WhatsApp

- [x] Criar a lógica de conexão com o WhatsApp em um arquivo separado (`src/whatsapp.js`).
- [x] Criar rotas na API para:
    - [x] Enviar mensagens.
    - [x] Verificar o status da conexão.
    - [x] Obter o QR Code de conexão.
- [x] Implementar o sistema de `spawn` para controlar os processos do bot e da API de forma independente.

## Fase 3: Interface Web (Frontend)

- [x] Criar um `index.html` em `public` para a interface.
- [x] Adicionar um campo para exibir o QR Code.
- [x] Criar um formulário para enviar mensagens.
- [x] Adicionar um indicador de status da conexão.

## Fase 4: Funcionalidades Adicionais

- [x] Criar sistema de logs para registrar as interações.
- [x] Adicionar um painel com status em tempo real dos serviços.
- [x] Implementar um sistema de auto-restart para o bot.
- [x] Criar um modo de manutenção.

## Fase 5: Refinamentos e Correções

- [x] Corrigir erros de sintaxe e referência no JavaScript do frontend.
- [x] Gerar QR Code como Data URL no backend (`src/bot.js`).
- [x] Exibir QR Code como imagem no frontend (`public/index.html`).

## Fase 6: Expansão de Funcionalidades

- [x] Implementar Ações dos Botões de Controle (`public/index.html` e `src/index.js`):
    - [x] Reiniciar Bot
    - [x] Reiniciar API
- [x] Criar Página de Configurações Avançadas (`public/settings.html` e `src/index.js`):
    - [x] Backend: Adicionar rota para servir `public/settings.html`.
    - [x] Frontend (`public/settings.html`): Criar interface com checkboxes para as funcionalidades.
    - [x] Backend (`src/index.js`): Adicionar rotas para `GET /api/settings` (ler `config.json`) e `POST /api/settings` (salvar `config.json`).
- [x] Integrar Configurações com a Lógica do Bot (`src/bot.js`):
    - [x] Ler as configurações do `config.json`.
    - [x] Modificar o comportamento do bot com base nessas configurações (ex: Não responder a grupos, ping-pong).
- [x] Configurar links de navegação no cabeçalho (`public/index.html`).

## Fase 7: Refatoração

- [x] Criar `src/utils/config.js` para centralizar `readConfig` e `writeConfig`.
- [x] Atualizar `src/index.js` para usar `src/utils/config.js`.
- [x] Atualizar `src/bot.js` para usar `src/utils/config.js`.

## Fase 8: Implementação de Funcionalidades Avançadas

- [x] Corrigir `ENOENT` error em `src/bot.js` (substituir `fs.watch` por polling e usar `fs.promises`).
- [x] Implementar Lógica para Configurações Avançadas no Bot (`src/bot.js`):
    - [x] Auto-responder a mensagens privadas.
    - [x] Ignorar mensagens de contatos não salvos.
    - [x] Baixar automaticamente mídias.
    - [x] Marcar mensagens como lidas automaticamente.
    - [x] Habilitar/Desabilitar transcrição de áudios (placeholder).
- [x] Corrigir lógica de `ignoreGroups` em `src/bot.js`.

## Fase 9: Autenticação e Nova Interface

- [x] Renomear `public/index.html` para `public/dashboard.html`.
- [x] Criar `public/index.html` para a nova landing page.
- [x] Criar `public/login.html` para a página de login.
- [x] Criar `public/register.html` para a página de cadastro.
- [x] Atualizar `src/index.js` para servir as novas páginas.
- [x] Implementar a lógica de backend para cadastro e login de usuários.
- [x] Adicionar autenticação do Google (OAuth).
    - [x] Configurar credenciais no Google Cloud Platform (Client ID, Client Secret).
    - [x] Instalar dependências: `passport`, `passport-google-oauth20`.
    - [x] Configurar o Passport no backend.
    - [x] Criar rotas para iniciar o fluxo OAuth e para o callback.
    - [x] Integrar o login do Google com o sistema de usuários existente (criar/encontrar usuário e gerar JWT).

- [x] Proteger as rotas do dashboard, exigindo autenticação.
- [x] Implementar submenu do usuário (Dados Cadastrados, Opções de Faturamento, Sair) em todas as páginas logadas.
- [x] Destacar o link de navegação ativo no cabeçalho das páginas logadas.
- [x] Implementar exibição da imagem de perfil do usuário e adicionar borda ao ícone.
- [x] Melhorar o layout da página de perfil.
- [x] Redesenhar o cabeçalho e a logo.

## Fase 10: Melhorias de UX

- [x] Criar duas páginas iniciais diferentes (para usuário logado e não logado).
- [x] Juntar páginas de início e configurações em um layout mais profissional e intuitivo.

## Fase 11: Refatoração do Frontend (Vanilla JS)

- [x] Revisar o frontend e criar um plano de ação com base no `dicas-uteis2.txt`.
- [x] Criar a nova estrutura de pastas: `public/css`, `public/js/components`, `public/js/routes`, `public/lang`.
- [x] Mover o CSS de `public/index.html` para `public/css/styles.css`.
- [x] Mover o JavaScript de `public/index.html` para `public/js/app.js`.
- [x] Mover as traduções de `public/index.html` para `public/lang/pt.json` e `public/lang/en.json`.
- [x] Atualizar `public/index.html` para carregar os novos arquivos CSS e JS.
- [x] Modularizar `public/js/app.js`:
    - [x] Criar `public/js/components/sidebar.js`.
    - [x] Criar `public/js/components/navbar.js`.
    - [x] Criar `public/js/components/toast.js`.
    - [x] Criar arquivos de rota em `public/js/routes/` para cada seção (Dashboard, Conexão, etc.).
- [x] Implementar o roteamento baseado em hash em `public/js/app.js`.
- [x] Implementar a lógica de carregamento de idioma e tema.
- [x] Refatorar o conteúdo de cada seção do `index.html` para os respectivos arquivos de rota.
- [x] Substituir o conteúdo estático das seções por chamadas `fetch` para a API.

## Fase 12: Aplicação de Melhorias de Usabilidade e Correções (dicas-uteis_1.txt)

- [x] **Correção 1: Estrutura HTML/Markup duplicada ("nested header")**
    - [x] Modificar `public/js/components/navbar.js`:
        - [x] Remover o `<header>` aninhado.
        - [x] Aplicar as classes `bg-white`, `shadow-sm`, `border-b`, `border-gray-200`, `px-6`, `py-4` diretamente no elemento `#navbar`.
        - [x] Garantir que o `div` interno (`.flex items-center justify-between`) tenha `w-full`.
- [x] **Correção 2: Lógica de tradução (i18n) incompleta**
    - [x] Modificar `public/js/components/language.js` (ou onde a lógica de tradução estiver):
        - [x] Despachar um evento `languageChanged` após carregar um novo idioma.
    - [x] Modificar `public/js/app.js`:
        - [x] Escutar o evento `languageChanged`.
        - [x] Chamar `renderSidebar()` após carregar um novo idioma.
        - [x] Chamar `renderNavbar()` após carregar um novo idioma.
        - [x] Chamar `router()` após carregar um novo idioma.
- [x] **Outros pontos de melhoria:**
    - [x] Verificar e garantir que os `addEventListener('click')` em `.sidebar-item` cubram todos os itens (inclusive os adicionados dinamicamente).
    - [x] Verificar `z-index` e `overflow` para menus dropdown (`z-50`).
    - [ ] Avaliar e implementar melhorias de responsividade para mobile (sidebar como drawer/collapsible, ajuste do header para telas pequenas), se necessário.
    - [ ] Avaliar e implementar melhorias de organização (extrair templates para arquivos HTML parciais ou usar mini-template engine), se necessário.

## Fase 13: Implementação de Melhorias de Segurança e Arquitetura (dicas-uteis_1.md)

- [x] **Segurança e Gestão de Segredos**
    - [x] Instalar `dotenv`.
    - [x] Criar arquivo `.env` com `JWT_SECRET` e `GOOGLE_CLIENT_ID`.
    - [x] Adicionar `.env` ao `.gitignore`.
    - [x] Carregar variáveis de ambiente em `src/index.js`.
    - [x] **Logs sem pasta**: Garantir que o diretório `logs` seja criado antes de instanciar o logger em `src/logger.js`.
    - [x] **Rota de download de logs exposta**: Proteger a rota `GET /logs` com middleware de papel (`ensureAdmin`).
- [x] **Interface e UX**
    - [x] **Dropdowns abertos e sem offset**: Ajustar o comportamento dos dropdowns (idioma, usuário) para que abram e fechem corretamente e tenham o posicionamento adequado.
    - [x] **Header sem logo/nome**: Adicionar logo e nome ao header.
    - [x] **Botão “Nova instância” sem validação**: Implementar validação de login e plano antes de redirecionar para a criação de nova instância.
- [x] **Arquitetura e Consistência**
    - [x] **Vanilla JS × React misturados**: Confirmar que todo o frontend está em Vanilla JS e remover qualquer resquício de React.
    - [x] **Autenticação fragmentada**: Padronizar o modelo de usuário e unificar a autenticação (local e Google OAuth).
    - [x] **Validações insuficientes**: Implementar validações mais robustas para entradas de usuário (ex: email, senha) usando uma biblioteca como Joi.
- [x] **Configuração e Deploy**
    - [x] **Ecosystem PM2 básico**: Atualizar `ecosystem.config.js` com configurações mais robustas (múltiplas instâncias, watch, logs separados).
    - [x] **`package.json` sem scripts**: Adicionar scripts úteis ao `package.json` (dev, build, lint, test).
- [x] **Funcionalidade e Performance**
    - [x] **Polling a cada 5s para agendar mensagens**: Substituir o polling por um sistema de fila (Bull + Redis) para agendamento de mensagens.
    - [x] **Exec de PM2 sem controle de acesso**: Proteger as rotas de `restart-bot` e `restart-api` com controle de acesso.
- [x] **Organização de Código e Boas Práticas**
    - [x] **DRY & Middlewares**: Implementar middlewares reutilizáveis para proteção de rotas com base em papéis de usuário.
    - [x] **UUID para IDs**: Utilizar UUIDs para geração de IDs de usuário e outras entidades.
    - [x] **Middleware global de erro**: Implementar um middleware global para tratamento de erros.
    - [x] **Rotação de logs**: Configurar rotação de logs usando `winston-daily-rotate-file`.
    - [x] **Modularização de templates**: Modularizar templates HTML (header, footer) para melhor organização e reutilização.

## Fase 14: Correções de Bugs e Estabilização

- [x] **Correção de Rota Express**: Corrigido erro `TypeError: Missing parameter name` no `path-to-regexp` ajustando a rota "catch-all" em `src/index.js`.
- [x] **Correção de Sintaxe JS**: Corrigido `Uncaught SyntaxError: Unexpected token '{'` movendo o `import` para o topo do arquivo em `public/js/components/sidebar.js`.
- [x] **Unificação do Fluxo de Autenticação**: Ajustado o callback do Google OAuth para passar o token JWT via parâmetro de URL e o frontend para capturá-lo e salvá-lo no `localStorage`, resolvendo inconsistências de login.
- [x] **Correção de Roteamento SPA**: Reordenadas as rotas no `src/index.js` para garantir que páginas estáticas como `/login.html` sejam servidas corretamente antes da rota "catch-all" da SPA.
- [x] **Estabilização do Ambiente de Desenvolvimento**:
    - [x] Desativada temporariamente a integração com Redis/Bull para evitar erros de conexão (`ECONNREFUSED`).
    - [x] Criado `nodemon.json` para ignorar a pasta `logs/` e `public/`, prevenindo reinicializações em loop do servidor.

## Fase 15: Refatoração do Fluxo de Navegação

- [x] Criar a página de boas-vindas `public/home.html`.
- [x] Criar arquivo de estilo dedicado `public/css/home.css`.
- [x] Atualizar a rota raiz (`/`) no `src/index.js` para servir a `home.html`.
- [x] Garantir que o logout redirecione para a nova home page.

## Fase 16: Migração para TypeScript e React

- [ ] **Configuração do Ambiente**
    - [ ] Instalar `typescript`, `@types/node`, `@types/express`.
    - [ ] Criar `tsconfig.json`.
    - [ ] Configurar `package.json` para compilar e rodar TypeScript.
- [ ] **Migração do Backend**
    - [ ] Renomear arquivos `.js` para `.ts` em `src/`.
    - [ ] Adicionar tipagem estática para variáveis, parâmetros e retornos de função.
    - [ ] Criar interfaces/tipos para objetos complexos (ex: `User`, `WhatsAppClient`).
    - [ ] Substituir `require` por `import`.
- [ ] **Configuração do Frontend com Vite + React**
    - [ ] Criar uma nova pasta `frontend/`.
    - [ ] Iniciar um projeto Vite com o template `react-ts`.
    - [ ] Instalar `tailwindcss`, `shadcn/ui`, `lucide-react`, `react-router-dom`.
- [ ] **Migração do Frontend**
    - [ ] Converter a estrutura de `public/` para componentes React em `frontend/src/components/`.
    - [ ] Recriar as rotas usando `react-router-dom`.
    - [ ] Substituir a manipulação manual do DOM por hooks do React (`useState`, `useEffect`).
    - [ ] Utilizar `axios` para as chamadas à API.
    - [ ] Aplicar estilos com Tailwind CSS e componentes `shadcn/ui`.

## Tarefas Futuras

- [ ] Implementar testes unitários (Jest) e de integração (Supertest).
- [ ] Implementar testes end-to-end (Cypress).
- [ ] Documentar a API com Swagger/OpenAPI.
- [ ] Configurar CI/CD com GitHub Actions.
- [ ] Criar um Dockerfile para a aplicação.
- [ ] Implementar um sistema de pagamento (Stripe/PayPal).
- [ ] Adicionar mais funcionalidades ao bot (respostas automáticas com IA, etc.).
- [ ] Melhorar a acessibilidade (a11y) da interface.
- [ ] Adicionar dark mode.
