
# Frontend Next.js - Portal WhatsApp API

## Como rodar o projeto

```bash
# Instale as dependências
npm install

# Ambiente de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Lint do projeto
npm run lint

# Testes (configure com jest ou testing-library)


# Build com análise de bundle
npm run build:analyze
```

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto e configure as variáveis necessárias para autenticação, integração com backend, etc.

## Estrutura recomendada

- `src/app/` - Rotas e páginas principais
- `src/components/` - Componentes reutilizáveis
- `src/types/` - Tipos TypeScript
- `src/providers/` - Providers de contexto

## Deploy

Para deploy, utilize plataformas como Vercel, Netlify ou seu próprio servidor Node.js.
