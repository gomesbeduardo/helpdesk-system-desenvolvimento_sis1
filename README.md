# Help Desk — Sistema de Chamados

Aplicação web fullstack para gerenciamento de chamados de suporte técnico. Permite que usuários abram chamados, técnicos os atendam e administradores gerenciem tudo com controle total de acesso por perfil.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Configuração](#instalação-e-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Rodando o Projeto](#rodando-o-projeto)
- [Usuários de Teste](#usuários-de-teste)
- [Perfis e Permissões](#perfis-e-permissões)
- [Rotas da API](#rotas-da-api)
- [Funcionalidades](#funcionalidades)
- [Decisões Técnicas](#decisões-técnicas)

---

## Visão Geral

O sistema possui três perfis de usuário com permissões distintas:

- **Usuário comum** — abre chamados e acompanha apenas os seus
- **Técnico** — visualiza e atende todos os chamados, altera status e comenta
- **Administrador** — controle total: edita qualquer chamado, gerencia categorias e usuários

---

## Tecnologias

### Backend
| Tecnologia | Uso |
|---|---|
| Node.js + Express | Servidor HTTP e roteamento |
| TypeScript | Tipagem estática |
| PostgreSQL + pg | Banco de dados relacional |
| JWT (jsonwebtoken) | Autenticação stateless |
| bcryptjs | Hash de senhas |
| Morgan | Log de requisições |
| UUID | Geração de IDs |

### Frontend
| Tecnologia | Uso |
|---|---|
| React 18 + Vite | Interface e bundler |
| TypeScript | Tipagem estática |
| React Router v6 | Roteamento e rotas privadas |
| Axios | Consumo da API com interceptors |
| Context API | Estado global de autenticação |

---

## Estrutura do Projeto

```
helpdesk-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # Pool de conexão PostgreSQL
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── ticket.controller.ts
│   │   │   ├── comment.controller.ts
│   │   │   └── history.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    # JWT + autorização por perfil
│   │   │   ├── validate.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   └── ticket.routes.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── database.sql                 # Script de criação das tabelas
│   ├── seed.ts                      # Usuários de teste
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts             # Instância com interceptor de token
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Desktop + bottom tab bar mobile
│   │   │   ├── Layout.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── EditTicketModal.tsx  # Modal de edição completa (admin)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TicketsPage.tsx
│   │   │   ├── NewTicketPage.tsx
│   │   │   ├── TicketDetailPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   └── UsersPage.tsx
│   │   └── types/
│   │       └── index.ts
│   ├── .env.example
│   └── package.json
│
├── helpdesk.postman_collection.json
└── README.md
```

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **PostgreSQL** 13 ou superior
- **npm** 8 ou superior

---

## Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/gomesbeduardo/helpdesk-system.git
cd helpdesk-system
```

### 2. Configure o banco de dados

Crie o banco de dados e aplique o schema:

```bash
# Criar o banco (como superusuário postgres)
sudo -u postgres createdb helpdesk -O seu_usuario

# Aplicar as tabelas e dados iniciais
psql -U seu_usuario -d helpdesk -f backend/database.sql
```

O script cria todas as tabelas e já insere as 5 categorias padrão.

### 3. Configure o backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas credenciais (veja seção abaixo)
```

### 4. Configure o frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Ajuste VITE_API_URL se necessário
```

---

## Variáveis de Ambiente

### `backend/.env`

```env
PORT=3001

# Conexão com o banco de dados
# Use o caminho do socket Unix para autenticação peer (sem senha):
DB_HOST=/var/run/postgresql
# Ou use localhost para autenticação por senha:
# DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=troque_por_uma_chave_segura_e_longa
JWT_EXPIRES_IN=7d
```

> ⚠️ **Nunca commite o arquivo `.env` real.** O `.gitignore` já o exclui.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3001
```

---

## Banco de Dados

### Diagrama de tabelas

```
users ──────────────────────────────────────────────────────┐
  id (PK)                                                    │
  name, email, password (bcrypt), role, created_at          │
                                                             │
categories                      tickets ────────────────────┤
  id (PK)                         id (PK)                   │
  name, description               title, description        │
                                  status, priority          │
                          ┌──── user_id (FK → users)        │
                          │     category_id (FK → categories)│
                          │     created_at, updated_at       │
                          │                                  │
                          ├── comments                       │
                          │     id, message                  │
                          │     ticket_id (FK)               │
                          │     user_id (FK → users) ────────┘
                          │
                          └── ticket_status_history
                                id, old_status, new_status
                                changed_by (FK → users)
                                created_at
```

### Enums

| Campo | Valores |
|---|---|
| `users.role` | `user` · `technician` · `admin` |
| `tickets.status` | `open` · `in_progress` · `resolved` · `closed` |
| `tickets.priority` | `low` · `medium` · `high` · `urgent` |

---

## Rodando o Projeto

### Desenvolvimento

Em dois terminais separados:

```bash
# Terminal 1 — Backend
cd backend
npm run seed   # apenas na primeira vez
npm run dev    # http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm run dev    # http://localhost:5173
```

### Build para produção

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
# Servir a pasta dist/ com qualquer servidor estático (nginx, serve, etc.)
```

---

## Usuários de Teste

Execute `npm run seed` dentro da pasta `backend` para criar os usuários abaixo:

| E-mail | Senha | Perfil |
|---|---|---|
| admin@helpdesk.com | admin123 | Administrador |
| tecnico@helpdesk.com | tech123 | Técnico |
| joao@helpdesk.com | user123 | Usuário comum |

---

## Perfis e Permissões

| Ação | Usuário | Técnico | Admin |
|---|:---:|:---:|:---:|
| Cadastro e login | ✅ | ✅ | ✅ |
| Abrir chamado | ✅ | ✅ | ✅ |
| Ver os próprios chamados | ✅ | ✅ | ✅ |
| Ver todos os chamados | ❌ | ✅ | ✅ |
| Comentar em chamados próprios | ✅ | ✅ | ✅ |
| Comentar em qualquer chamado | ❌ | ✅ | ✅ |
| Alterar status de chamado | ❌ | ✅ | ✅ |
| Editar título, descrição, prioridade e categoria | ❌ | ❌ | ✅ |
| Criar / editar / excluir categorias | ❌ | ❌ | ✅ |
| Listar usuários e alterar perfis | ❌ | ❌ | ✅ |
| Excluir qualquer chamado | ❌ | ❌ | ✅ |

> As regras de autorização são validadas no **backend** — o frontend apenas adapta a interface.

---

## Rotas da API

Base URL: `http://localhost:3001`

Rotas protegidas exigem o header: `Authorization: Bearer <token>`

### Autenticação

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/auth/login` | — | Login; retorna token JWT |
| `POST` | `/users` | — | Cadastro de novo usuário |

### Usuários

| Método | Rota | Perfil mínimo | Descrição |
|---|---|---|---|
| `GET` | `/users` | Admin | Lista todos os usuários |
| `GET` | `/users/:id` | Autenticado | Busca usuário por ID |
| `PUT` | `/users/:id` | Próprio ou Admin | Atualiza dados (admin pode trocar role) |
| `DELETE` | `/users/:id` | Admin | Remove usuário |

### Categorias

| Método | Rota | Perfil mínimo | Descrição |
|---|---|---|---|
| `GET` | `/categories` | Autenticado | Lista todas as categorias |
| `GET` | `/categories/:id` | Autenticado | Busca categoria por ID |
| `POST` | `/categories` | Admin | Cria categoria |
| `PUT` | `/categories/:id` | Admin | Atualiza categoria |
| `DELETE` | `/categories/:id` | Admin | Remove categoria |

### Chamados

| Método | Rota | Perfil mínimo | Descrição |
|---|---|---|---|
| `GET` | `/tickets` | Autenticado | Lista chamados (user vê só os seus) |
| `POST` | `/tickets` | Autenticado | Cria chamado |
| `GET` | `/tickets/:id` | Autenticado | Detalhe do chamado |
| `PUT` | `/tickets/:id` | Autenticado | Edita chamado (admin edita tudo, inclusive status) |
| `DELETE` | `/tickets/:id` | Autenticado | Remove chamado |
| `PATCH` | `/tickets/:id/status` | Técnico / Admin | Altera apenas o status |

**Parâmetros de consulta em `GET /tickets`:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | string | Filtra por status |
| `category_id` | uuid | Filtra por categoria |
| `search` | string | Busca em título e descrição (ILIKE) |
| `sort` | `priority` | Ordena por prioridade (padrão: data desc) |
| `page` | number | Página (padrão: 1) |
| `limit` | number | Itens por página (padrão: 10, máx: 100) |

### Comentários e Histórico

| Método | Rota | Perfil mínimo | Descrição |
|---|---|---|---|
| `GET` | `/tickets/:id/comments` | Autenticado | Lista comentários do chamado |
| `POST` | `/tickets/:id/comments` | Autenticado | Adiciona comentário |
| `GET` | `/tickets/:id/history` | Autenticado | Histórico de mudanças de status |

---

## Funcionalidades

### Backend
- [x] Autenticação com JWT (geração no login, validação por middleware)
- [x] Senhas com hash bcrypt (custo 10)
- [x] Autorização por perfil em todas as rotas protegidas
- [x] Middleware de autenticação (`authenticate`)
- [x] Middleware de autorização por perfil (`authorize`)
- [x] Middleware de validação de campos obrigatórios (`validateFields`)
- [x] Middleware de tratamento global de erros
- [x] Log de requisições com Morgan
- [x] CRUD completo de usuários, categorias e chamados
- [x] Paginação e filtros na listagem de chamados
- [x] Registro automático de histórico ao alterar status
- [x] Admin pode editar todos os campos do chamado via `PUT /tickets/:id`

### Frontend
- [x] Tela de login e cadastro
- [x] Context API para estado global de autenticação
- [x] Token armazenado no `localStorage`
- [x] Interceptor Axios que injeta o token em todas as requisições
- [x] Redirecionamento automático para `/login` em caso de 401
- [x] Rotas privadas com controle por perfil (`PrivateRoute`)
- [x] Navbar desktop + bottom tab bar iOS para mobile
- [x] Dashboard com contagem de chamados por status
- [x] Listagem com filtros, busca, paginação e ordenação
- [x] Tela de abertura de chamado
- [x] Tela de detalhe com abas: comentários e histórico de status
- [x] Alteração de status (técnico/admin)
- [x] Modal de edição completa do chamado (somente admin)
- [x] Gerenciamento de categorias (somente admin)
- [x] Gerenciamento de usuários com troca de perfil (somente admin)
- [x] Layout responsivo — adaptado para mobile, tablet e desktop

---

## Decisões Técnicas

**Por que UUID no lugar de SERIAL?**
IDs sequenciais expõem volume de dados e facilitam enumeração de recursos. UUIDs são opacos e seguros para uso em URLs públicas.

**Por que autenticação peer no PostgreSQL?**
Em ambiente de desenvolvimento local no Linux, a autenticação peer usa o usuário do sistema operacional, eliminando a necessidade de senha. Em produção, use autenticação `md5` ou `scram-sha-256` com senha forte no `.env`.

**Por que o histórico de status é uma tabela separada?**
Permite auditoria completa de qualquer alteração sem sobrescrever dados. A coluna `changed_by` registra quem fez cada mudança, essencial para suporte e compliance.

**Por que `verbatimModuleSyntax` no frontend?**
O `tsconfig.app.json` gerado pelo Vite 8 habilita `verbatimModuleSyntax: true`, que exige `import type` para importações de interfaces e tipos. Isso garante que o esbuild possa eliminar os imports de tipo em tempo de build sem análise semântica, acelerando o processo.
