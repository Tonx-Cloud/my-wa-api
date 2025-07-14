
# 📋 **GEMINI.MD - MY-WA-API**

## **1. Instruções Gerais**

* **Nome do projeto/site**: My-Wa-Api
* **Idioma**: Português (pt‑BR) - todas as respostas e documentações
* **Objetivo**: Criar um site semelhante a [https://portal.api-wa.me/](https://portal.api-wa.me/), com toda a estrutura frontend e backend rodando em servidor local em `C:\Projetos\wa-api`.

* **Controle de tarefas**: Utilize um arquivo **TODO.md** para descrever planos de ação, registrar novas tarefas e acompanhar o progresso.
  * **Fluxo obrigatório**: Sempre que iniciar uma tarefa, primeiro crie o plano de ação detalhado no TODO.md e só então comece a implementação.
  * **Atualização constante**: Marque tarefas como concluídas `[x]` e adicione novas conforme necessário.

* **Revisão de arquivos**: Analise todos os arquivos do projeto sempre que tiver dúvidas ou buscar soluções, garantindo consistência e alinhamento.

* **Segurança de credenciais**:
  * Toda credencial ou segredo (JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, SESSION_SECRET) **DEVE** ser armazenado em um arquivo `.env` não versionado.
  * Use a biblioteca [dotenv](https://www.npmjs.com/package/dotenv) para carregá-las.
  * **NUNCA** commitar credenciais no código.

---

## **2. Processo de Desenvolvimento**

1. **Planejamento**: Registrar escopo e tarefas no TODO.md antes de qualquer implementação.

2. **Desenvolvimento iterativo**: 
   * Sprints curtos (1–2 semanas)
   * Revisão de código a cada entrega
   * Atualização do TODO.md com status atual

3. **Testes e validação**:
   * **Unitários**: Jest (backend) e React Testing Library (frontend)
   * **Integração**: Supertest (API) e Cypress (end‑to‑end)
   * **Usabilidade**: Testes manuais em diferentes dispositivos e navegadores
   * **Segurança**: Validação de autenticação, autorização e sanitização de dados

4. **Deploy local**: Configure um ambiente que simule produção usando:
   * **PM2** com `ecosystem.config.js` aprimorado (clusters, logs rotativos, variáveis de ambiente)
   * **Docker Compose** (opcional, para isolar dependências)
   * **Nginx** (opcional, para proxy reverso)

5. **Migração para produção**: Após aprovação nos testes, publicar em servidor online ou cloud.

---

## **3. Padrões de Código e Arquitetura**

### **Stack Tecnológica Escolhida**:

* **Linguagem**:
  * **TypeScript** para backend e frontend (TSX) - tipagem estática e maior segurança
  * **Node.js 18+** para runtime

* **Frontend**:
  * **React 18+** com Vite (build mais rápido)
  * **Tailwind CSS** para estilos utilitários
  * **shadcn/ui** para componentes reutilizáveis
  * **lucide-react** para ícones
  * **React Router** para navegação

* **Backend**:
  * **Express** com TypeScript
  * **Mongoose** (MongoDB) ou **Prisma** (PostgreSQL/MySQL)
  * **JWT** + **Passport.js** para autenticação
  * **Joi** para validação de dados
  * **Winston** para logs estruturados

### **Arquitetura e Organização**:

* **Component Pattern**:
  * Componentes isolados, reutilizáveis
  * **CamelCase** para nomes de componentes
  * **kebab-case** para arquivos
  * **Atomic Design** (Átomos → Moléculas → Organismos → Templates → Páginas)
  
  *Estrutura de Pastas Recomendada:
		C:\Projetos\wa-api\
		├── src/
		│   ├── middleware/
		│   │   ├── auth.js
		│   │   └── validation.js
		│   ├── validation/
		│   │   └── schemas.js
		│   ├── config/
		│   │   └── manager.js
		│   ├── queue/
		│   │   └── messageQueue.js
		│   ├── routes/
		│   │   ├── auth.js
		│   │   ├── api.js
		│   │   └── admin.js
		│   ├── services/
		│   │   └── whatsapp.js
		│   ├── utils/
		│   │   └── logger.js
		│   ├── index.js
		│   └── bot.js
		├── public/
		│   ├── js/
		│   │   ├── dropdown.js
		│   │   ├── navigation.js
		│   │   └── dashboard.js
		│   ├── css/
		│   │   ├── main.css
		│   │   ├── header.css
		│   │   └── dropdown.css
		│   └── uploads/
		├── logs/
		├── messages/
		├── .env
		├── .gitignore
		├── package.json
		├── ecosystem.config.js
		└── todo.md

* **Estrutura modular backend**:
  ```
  src/
  ├── controllers/     # Lógica de controle das rotas
  ├── services/        # Lógica de negócio
  ├── models/          # Modelos de dados
  ├── routes/          # Definição de rotas
  ├── middlewares/     # Middlewares customizados
  ├── validation/      # Schemas de validação
  ├── config/          # Configurações da aplicação
  ├── utils/           # Utilitários diversos
  └── types/           # Definições de tipos TypeScript
  ```

* **Boas práticas**:
  * Princípios **DRY** e **SOLID**
  * **ESLint** + **Prettier** para lint e formatação
  * **Husky** + **commitlint** para manter histórico consistente
  * **JSDoc** ou **TSDoc** para documentação
  * **Tratamento de erros centralizado**
  * **Sistema de papéis (RBAC)** para autorização

---

## **4. Design de Interface**

* **Referência visual**: [https://portal.api-wa.me/dashboard](https://portal.api-wa.me/dashboard)
* **Protótipo**: Acesse o projeto no Figma (link centralizado no TODO.md)
* **Atomic Design**: Organize em Átomos, Moléculas, Organismos, Templates e Páginas
* **Mobile‑first**: Grid flexíveis, media queries, sidebar colapsável em dispositivos móveis
* **Acessibilidade (a11y)**:
  * Contraste mínimo **4.5:1**
  * `alt` em imagens
  * Roles ARIA e navegação por teclado
  * Foco visível em elementos interativos

### **Componentes Essenciais**:
* Header responsivo com logo, navegação e dropdowns funcionais
* Sistema de autenticação visual (login/logout)
* Indicadores de plano do usuário (free/premium)
* Feedback visual para ações (loading, success, error)
* Sidebar responsiva que vira drawer em mobile

---

## **5. Infraestrutura e Ferramentas**

### **Frontend**:
```
React 18+ + TypeScript + Vite
Tailwind CSS + shadcn/ui + lucide-react
React Router + React Hook Form
Axios para requisições HTTP
```

### **Backend**:
```
Node.js 18+ + Express + TypeScript
MongoDB (Mongoose) ou PostgreSQL (Prisma)
JWT + Passport.js + bcrypt
Joi para validação + Winston para logs
dotenv para variáveis de ambiente
```

### **Filas e Jobs**:
```
Bull + Redis para agendamento e execução de tarefas
(evitar polling desnecessário)
```

### **Process Management**:
```
PM2 com ecosystem.config.js configurado para:
- Cluster mode
- Logs rotativos
- Variáveis de ambiente
- Auto-restart
```

### **Desenvolvimento**:
```
ESLint + Prettier + Husky
Jest + React Testing Library
Supertest + Cypress
```

---

## **6. Configuração de Segurança**

### **Variáveis de Ambiente (.env)**:
```env
# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=sua-chave-jwt-super-segura-de-pelo-menos-32-caracteres

# Google OAuth
GOOGLE_CLIENT_ID=495601781938-1ttkedgoamniqn70tl95ar5568i05m2t.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Sessão
SESSION_SECRET=sua-session-secret-super-segura-de-pelo-menos-32-caracteres

# Banco de dados
DATABASE_URL=mongodb://localhost:27017/wa-api
# ou
DATABASE_URL=postgresql://user:password@localhost:5432/wa-api

# Redis (para filas)
REDIS_URL=redis://localhost:6379

# Logs
LOG_LEVEL=info
LOG_DIR=./logs
```

### **Credenciais Google OAuth**:
* **Client ID**: `495601781938-1ttkedgoamniqn70tl95ar5568i05m2t.apps.googleusercontent.com`
* **Secrets disponíveis**:
  * Antigo: `****V7nC` (30/06/2025)
  * Novo: `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` (07/07/2025)
* **Armazenamento**: **SEMPRE** em variáveis de ambiente no `.env`
* **Monitoramento**: Renovar antes de 6 meses de inatividade

---

## **7. Fluxos de Negócio Críticos**

### **Autenticação e Autorização**:
```
1. Login local (email/senha) ou Google OAuth
2. Verificação de JWT válido
3. Verificação de papel do usuário (user/admin)
4. Verificação de plano ativo (free/premium)
5. Redirecionamento baseado em permissões
```

### **Gestão de Instâncias**:
```
1. Usuário clica "Nova Instância"
2. Sistema verifica autenticação (JWT válido)
3. Sistema verifica plano ativo
4. Se plano = free → redireciona para /plans
5. Se plano = premium → permite criar instância
6. QR Code gerado e exibido
7. Callback de conexão atualiza status
```

### **Sistema de Mensagens**:
```
1. Validação rigorosa de entrada (Joi)
2. Enfileiramento na fila Bull/Redis
3. Processamento assíncrono em background
4. Feedback em tempo real para usuário
5. Log estruturado de todas as ações
```

---

## **8. Critérios de Qualidade**

### **Segurança (Obrigatório)**:
- [ ] Todos os segredos em variáveis de ambiente
- [ ] Sistema de papéis (RBAC) implementado
- [ ] Validação de entrada em **todas** as rotas
- [ ] Sanitização de dados de saída
- [ ] Logs seguros sem informações sensíveis
- [ ] Rate limiting em APIs públicas
- [ ] Headers de segurança (helmet)

### **Performance**:
- [ ] Filas para processamento assíncrono
- [ ] Logs com rotação automática
- [ ] Caching de configurações
- [ ] Compressão de assets
- [ ] Lazy loading de componentes
- [ ] Otimização de bundle (tree-shaking)

### **UX/UI**:
- [ ] Dropdowns funcionais e bem posicionados
- [ ] Header completo com logo e navegação
- [ ] Feedback visual para todas as ações
- [ ] Loading states apropriados
- [ ] Responsividade completa
- [ ] Indicadores de plano do usuário
- [ ] Dark mode (opcional)

### **Manutenibilidade**:
- [ ] Código modular e bem documentado
- [ ] Tratamento de erros centralizado
- [ ] Testes unitários e de integração
- [ ] Estrutura de pastas consistente
- [ ] Dependências atualizadas
- [ ] Documentação da API (Swagger/OpenAPI)

---

## **9. Ambiente de Desenvolvimento**

### **Máquina**:
- **Device**: TonBook
- **Processor**: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
- **RAM**: 16,0 GB
- **OS**: Windows 11 Home Single Language (Build 26100.4351)

### **Ferramentas**:
- **Editor**: VSCode com extensões ESLint, Prettier, GitLens, TypeScript
- **Terminal**: Windows Terminal ou PowerShell
- **Node.js**: Versão LTS (18+)
- **Package Manager**: npm ou yarn
- **Git**: Para controle de versão

---

## **10. Migração e Roadmap**

### **Fase 1: Migração para TypeScript + React (2 semanas)**
- [ ] Configurar Vite + React + TypeScript
- [ ] Migrar componentes existentes
- [ ] Implementar Tailwind CSS + shadcn/ui
- [ ] Configurar ESLint + Prettier + Husky

### **Fase 2: Backend com TypeScript (2 semanas)**
- [ ] Migrar para TypeScript
- [ ] Implementar validação com Joi
- [ ] Configurar sistema de papéis (RBAC)
- [ ] Implementar filas com Bull + Redis

### **Fase 3: Segurança e Performance (1 semana)**
- [ ] Migrar todas as credenciais para .env
- [ ] Implementar rate limiting
- [ ] Configurar logs rotativos
- [ ] Otimizar performance geral

### **Fase 4: Testes e Deploy (1 semana)**
- [ ] Configurar Jest + React Testing Library
- [ ] Implementar testes e2e com Cypress
- [ ] Configurar PM2 para produção
- [ ] Documentar API com Swagger

---

## **11. Comandos Úteis**

### **Desenvolvimento**:
```bash
# Instalar dependências
npm install

# Desenvolvimento (frontend + backend)
npm run dev

# Build para produção
npm run build

# Testes
npm test

# Linting
npm run lint

# Formatação
npm run format
```

### **Produção**:
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Monitorar processos
pm2 monit

# Logs
pm2 logs

# Restart
pm2 restart all
```

---

> **⚠️ IMPORTANTE**: Este documento **substitui** completamente a versão anterior de `gemini.md`. Mantenha o TODO.md sempre atualizado e em sincronia com as tarefas futuras. Toda implementação deve seguir rigorosamente estas diretrizes para garantir qualidade, segurança e manutenibilidade do projeto.

---
