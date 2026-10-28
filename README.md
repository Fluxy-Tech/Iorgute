# Iorgutê — iogurte artesanal

Sistema da Iorgutê: app do cliente (mobile-first, seguindo o layout de `ProjetoIorgute.jpeg`) e painel administrativo.

**Stack:** Next.js 16 (App Router) · Prisma 7 (PostgreSQL, adapter `pg`) · Better Auth · shadcn/ui · Tailwind 4 · Recharts · dnd-kit

## Rodando localmente

```bash
cp .env.example .env        # ajuste DATABASE_URL e BETTER_AUTH_SECRET
npm install                 # também roda `prisma generate`
npm run db:deploy           # aplica as migrations
npm run db:seed             # produtos, configurações e cupom BEMVINDO10
npm run dev                 # http://localhost:7601
```

Produção: `npm run build && npm start` (porta 7601).

> **O primeiro usuário cadastrado vira Administrador.** Os seguintes entram como Cliente; o admin libera acesso em **Painel → Usuários e acessos**.

## Docker

```bash
docker build -t iorgute .
docker run -p 7601:7601 --env-file .env iorgute
```

O arquivo precisa ter `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e as variáveis `SEAWEEDFS_S3_*` das fotos (veja `.env.example`). Atenção: o `--env-file` do Docker **não remove aspas** — use valores sem aspas (`CHAVE=valor`) no arquivo passado ao container.

O container aplica `prisma migrate deploy` ao iniciar (desative com `-e RUN_MIGRATIONS=false`). Em produção, `BETTER_AUTH_URL` deve ser a URL pública da aplicação.

## Funcionalidades

### App do cliente
| Tela | Rota |
|---|---|
| Login / Criar conta (com endereço) / Esqueci a senha | `/login`, `/cadastro`, `/esqueci-senha` |
| Início — catálogo e carrinho | `/inicio`, `/carrinho` |
| Produto — carrossel de fotos, descrição, preço, adicionar e outros produtos | `/produto/[id]` |
| Conta (menu) | `/conta` |
| Meus pedidos (Em andamento / Histórico) e acompanhamento da esteira | `/pedidos`, `/pedidos/[id]` |
| Meu endereço (+ verificação de área de entrega) | `/conta/endereco` |
| Garrafas devolvidas (crédito, histórico, "Como funciona") | `/conta/garrafas` |
| Meus descontos (crédito de garrafas + cupons) | `/conta/descontos` |
| Meus dados (senha, dados, preferências) | `/conta/dados` |
| Notificações (mudanças de status, coletas) | `/notificacoes` |

No checkout o cliente pode usar o crédito de garrafas e um cupom; o estoque é baixado e devolvido em cancelamentos.

### Painel administrativo (`/admin`)
| Módulo | Admin | Operador |
|---|:-:|:-:|
| Painel de métricas (vendas, ticket, garrafas coletadas, taxa de retorno, rankings) | ✅ | ✅ |
| Esteira de pedidos (kanban com arrastar-e-soltar) | ✅ | ✅ |
| Coleta de vasilhames | ✅ | ✅ |
| Produtos (com fotos), Cupons, Configurações | ✅ | |
| Usuários e acessos (roles, ativar/desativar) | ✅ | |
| Auditoria e Log de requisições | ✅ | |

**Esteira:** Recebido → Em produção → Em separação → Saiu para entrega → Entregue (ou Cancelado). Cada movimento grava histórico (`order_status_log`), notifica o cliente e gera auditoria.

### Fotos dos produtos
Enviadas em **Painel → Produtos → Fotos** (até 8 por produto, 3 MB cada; a primeira é a capa). Os arquivos vão para o bucket S3 (SeaweedFS) configurado nas variáveis `SEAWEEDFS_S3_*`, na pasta `SEAWEEDFS_S3_PREFIX/<id do produto>/`; o banco guarda só a chave do objeto (tabela `product_image`). Remover a foto no painel apaga também o arquivo do bucket.

- **Bucket privado** (`UPLOAD_PUBLIC_READ=false`, padrão): a aplicação entrega as fotos em `/api/produtos/imagens/[id]`, lendo do S3 com as credenciais, com cache imutável no navegador.
- **Bucket público** (`UPLOAD_PUBLIC_READ=true`): o navegador busca direto de `SEAWEEDFS_S3_ENDPOINT/SEAWEEDFS_S3_BUCKET/<chave>`.

Sem fotos, o produto exibe a garrafinha ilustrada na cor do sabor.

### Observabilidade
- **Log de requisições** (`request_log`): `src/proxy.ts` registra toda chamada HTTP (páginas, navegações, server actions, API) com usuário, IP e user-agent. Erros de servidor são gravados com status 500 via `src/instrumentation.ts`.
- **Auditoria** (`audit_log`): login/logout/falhas de login, cadastro, alterações de dados/senha/endereço, pedidos, mudanças de status, coletas, produtos, cupons, roles e configurações — com estado *antes/depois*, IP e user-agent.

### Redefinição de senha
Não há provedor de e-mail configurado: o link de redefinição é impresso no log do servidor e registrado na auditoria. Para enviar por e-mail, implemente `sendResetPassword` em `src/lib/auth.ts`.

## Scripts
| Script | O que faz |
|---|---|
| `npm run dev` / `npm start` | Desenvolvimento / produção na porta 7601 |
| `npm run db:migrate` | Cria e aplica migration (dev) |
| `npm run db:deploy` | Aplica migrations pendentes |
| `npm run db:seed` | Dados iniciais |
| `npm run typecheck` / `npm run lint` | Verificações |
