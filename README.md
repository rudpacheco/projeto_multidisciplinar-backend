# SGHSS - Sistema de Gestão Hospitalar e de Serviços de Saúde
## VidaPlus - Projeto Multidisciplinar Backend

### 📋 Sobre o Projeto
Sistema completo de gestão hospitalar desenvolvido para a instituição VidaPlus, que administra hospitais, clínicas, laboratórios e equipes de home care.

### 🚀 Tecnologias Utilizadas
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação e autorização
- **Bcrypt** - Criptografia de senhas
- **Winston** - Sistema de logs
- **Helmet** - Segurança HTTP

### 📦 Instalação

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd novoBACK
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
- Copie o arquivo `.env.example` para `.env`
- Ajuste as configurações conforme necessário

4. **Configure o banco de dados PostgreSQL**
- Certifique-se de que o PostgreSQL está instalado e rodando
- Execute o script de setup:
```bash
npm run db:setup
```

5. **Popular o banco com dados de exemplo (opcional)**
```bash
npm run db:seed
```

### 🏃‍♂️ Executando o Projeto

**Modo desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor estará disponível em: `http://localhost:3000`

### 📚 Documentação da API

Veja a documentação completa dos endpoints em: [DOCUMENTACAO_API.md](./docs/DOCUMENTACAO_API.md)

### 🔐 Perfis de Usuário
- **PACIENTE** - Acesso a consultas, exames e prontuários
- **MEDICO** - Gestão de consultas, prontuários e prescrições
- **ENFERMEIRO** - Suporte a atendimentos e registros
- **ADMINISTRADOR** - Gestão completa do sistema

### 🔒 Segurança e LGPD
- Criptografia de senhas com bcrypt
- Autenticação via JWT
- Logs de auditoria
- Controle de acesso por perfil
- Proteção contra ataques comuns (XSS, CSRF, etc)

### 👨‍💻 Autor
Rudney Pacheco - Projeto Multidisciplinar  2025

