# Sistema de Chamados / Help Desk

Aplicação web completa para gerenciamento de chamados de suporte técnico.

## Tecnologias

**Backend:** Node.js · Express · TypeScript · PostgreSQL · JWT · bcrypt  
**Frontend:** React · TypeScript · React Router · Axios · Context API

## Pré-requisitos

- Node.js 18+
- PostgreSQL 13+

## Configuração do Banco de Dados

```bash
# Entrar no psql
psql -U postgres

# Executar o script de criação
\i backend/database.sql
```

Isso criará o banco `helpdesk` com todas as tabelas e categorias iniciais.

## Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do PostgreSQL

# Popular banco com usuários de teste
npm run seed

# Rodar em modo desenvolvimento
npm run dev
```

O backend estará disponível em `http://localhost:3001`

### Variáveis de ambiente (backend/.env)

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=helpdesk_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
```

## Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar em modo desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Variáveis de ambiente (frontend/.env)

```
VITE_API_URL=http://localhost:3001
```

## Usuários de Teste

Após executar `npm run seed` no backend:

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@helpdesk.com | admin123 | Administrador |
| tecnico@helpdesk.com | tech123 | Técnico |
| joao@helpdesk.com | user123 | Usuário comum |

## Rotas da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /auth/login | Login |

### Usuários
| Método | Rota | Acesso |
|--------|------|--------|
| POST | /users | Público (cadastro) |
| GET | /users | Admin |
| GET | /users/:id | Autenticado |
| PUT | /users/:id | Próprio ou Admin |
| DELETE | /users/:id | Admin |

### Categorias
| Método | Rota | Acesso |
|--------|------|--------|
| GET | /categories | Autenticado |
| GET | /categories/:id | Autenticado |
| POST | /categories | Admin |
| PUT | /categories/:id | Admin |
| DELETE | /categories/:id | Admin |

### Chamados
| Método | Rota | Acesso |
|--------|------|--------|
| GET | /tickets | Autenticado (usuário vê só os seus) |
| POST | /tickets | Autenticado |
| GET | /tickets/:id | Autenticado (com restrição) |
| PUT | /tickets/:id | Dono ou Técnico/Admin |
| DELETE | /tickets/:id | Dono ou Admin |
| PATCH | /tickets/:id/status | Técnico ou Admin |

### Comentários & Histórico
| Método | Rota | Acesso |
|--------|------|--------|
| GET | /tickets/:id/comments | Autenticado |
| POST | /tickets/:id/comments | Autenticado |
| GET | /tickets/:id/history | Autenticado |

## Funcionalidades

- [x] Cadastro e login com JWT
- [x] Senhas criptografadas com bcrypt
- [x] Autorização por perfil (user / technician / admin)
- [x] CRUD de chamados com restrições por perfil
- [x] CRUD de categorias (somente admin)
- [x] Comentários em chamados
- [x] Histórico de alterações de status
- [x] Filtros por status, categoria e busca textual
- [x] Paginação e ordenação
- [x] Dashboard com estatísticas
- [x] Gerenciamento de usuários (admin)
- [x] Rotas privadas no frontend
- [x] Interceptor axios com token automático
- [x] Middleware de log (morgan)
- [x] Middleware de tratamento global de erros
- [x] Middleware de validação de campos obrigatórios
