# 🚀 Roteiro de Instalação em Outra Máquina

## 📋 Checklist de Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [ ] Node.js 14 ou superior ([Download](https://nodejs.org/))
- [ ] PostgreSQL 12 ou superior ([Download](https://www.postgresql.org/download/))
- [ ] Git (opcional, para clonar o projeto)
- [ ] Editor de código (VS Code, recomendado)

---

## 🔧 Passo 1: Instalação do Node.js

### Windows
1. Baixe o instalador em: https://nodejs.org/
2. Execute o instalador e siga as instruções
3. Verifique a instalação:
```powershell
node --version
npm --version
```

### Linux/Ubuntu
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### macOS
```bash
brew install node
```

---

## 🐘 Passo 2: Instalação do PostgreSQL

### Windows
1. Baixe o instalador em: https://www.postgresql.org/download/windows/
2. Durante a instalação:
   - **ANOTE A SENHA** que você definir para o usuário `postgres`
   - Porta padrão: `5432` (mantenha esta)
   - Locale: `Portuguese, Brazil` ou `Default locale`

3. Verifique se o serviço está rodando:
```powershell
Get-Service postgresql*
```

### Linux/Ubuntu
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

---

## 📦 Passo 3: Copiar o Projeto

### Opção A: Se você tem o projeto em um pendrive/pasta
```powershell
# Copie a pasta novoBACK para um local de sua preferência
# Exemplo: C:\Projetos\novoBACK
```

### Opção B: Se o projeto estiver no GitHub
```powershell
git clone <URL_DO_REPOSITORIO>
cd novoBACK
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### 4.1 Abrir o arquivo `.env`

Navegue até a pasta do projeto e abra o arquivo `.env` em um editor de texto.

### 4.2 **IMPORTANTE: Ajustar estas variáveis**

```env
# ===================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ===================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sghss_vidaplus
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_POSTGRESQL_AQUI  # ⚠️ ALTERAR PARA SUA SENHA!

# ===================================
# CONFIGURAÇÃO DO SERVIDOR
# ===================================
PORT=3000
NODE_ENV=development

# ===================================
# SEGURANÇA - JWT
# ===================================
# ⚠️ GERAR UMA NOVA SECRET KEY!
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GERAR_UMA_NOVA_SECRET_AQUI
JWT_EXPIRES_IN=24h

# ===================================
# CONFIGURAÇÃO DE LOGS
# ===================================
LOG_LEVEL=info
LOG_FILE=logs/combined.log
LOG_ERROR_FILE=logs/error.log
LOG_AUDIT_FILE=logs/audit.log
```

### 4.3 Gerar uma nova JWT_SECRET

```powershell
# Execute este comando para gerar uma secret key segura
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copie o resultado e cole no arquivo .env na variável JWT_SECRET
```

---

## 📂 Passo 5: Instalar Dependências

Abra o PowerShell na pasta do projeto e execute:

```powershell
# Navegar até a pasta do projeto
cd C:\Projetos\novoBACK  # Ajuste o caminho conforme necessário

# Instalar todas as dependências
npm install
```

**Aguarde a instalação** (pode levar alguns minutos na primeira vez).

Você deve ver algo como:
```
added 164 packages, and audited 165 packages in 45s
```

---

## 🗄️ Passo 6: Criar e Configurar o Banco de Dados

### 6.1 Adicionar PostgreSQL ao PATH (Windows)

**Se o comando `psql` não for reconhecido:**

```powershell
# Adicionar PostgreSQL ao PATH temporariamente
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"

# OU adicionar permanentemente (execute como Administrador)
# Painel de Controle > Sistema > Configurações Avançadas > Variáveis de Ambiente
# Adicione: C:\Program Files\PostgreSQL\17\bin ao PATH
```

### 6.2 Criar o Banco de Dados

```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Quando pedir a senha, digite a senha que você definiu na instalação
# Depois, execute:
```

```sql
-- Criar o banco de dados
CREATE DATABASE sghss_vidaplus;

-- Sair do psql
\q
```

### 6.3 Executar Setup das Tabelas

```powershell
npm run db:setup
```

**Saída esperada:**
```
✅ Conectado ao PostgreSQL
✅ Tabela usuarios criada
✅ Tabela pacientes criada
✅ Tabela profissionais_saude criada
...
🎉 Setup do banco de dados concluído com sucesso!
```

### 6.4 Popular com Dados de Teste

```powershell
npm run db:seed
```

**Saída esperada:**
```
🌱 Iniciando população do banco de dados...
✅ Unidades hospitalares criadas
✅ Usuários criados
✅ Leitos criados
🎉 Banco de dados populado com sucesso!
```

---

## 🚀 Passo 7: Iniciar o Servidor

### Modo Desenvolvimento (com auto-reload)
```powershell
npm run dev
```

### Modo Produção
```powershell
npm start
```

**Saída esperada:**
```
🚀 Servidor rodando na porta 3000
✅ Ambiente: development
✅ SGHSS VidaPlus Backend iniciado com sucesso!
```

---

## ✅ Passo 8: Testar a Instalação

### 8.1 Abrir o navegador

Acesse: http://localhost:3000

Você deve ver a página de boas-vindas do SGHSS VidaPlus.

### 8.2 Testar a API via PowerShell

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get | ConvertTo-Json

# Login de teste
$login = @{
    email = "admin@vidaplus.com.br"
    senha = "Admin@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
$response | ConvertTo-Json -Depth 3
```

### 8.3 Verificar logs

```powershell
# Ver os últimos logs
Get-Content .\logs\combined.log -Tail 20
```

---

## 🔄 O Que Muda de Máquina para Máquina?

### ✏️ SEMPRE Alterar:
1. **DB_PASSWORD** no arquivo `.env` - usar sua senha do PostgreSQL
2. **JWT_SECRET** no arquivo `.env` - gerar uma nova secret key
3. **Caminho do PostgreSQL no PATH** (se necessário)

### ⚠️ Pode Precisar Alterar:
1. **DB_PORT** - se você mudou a porta padrão do PostgreSQL (normalmente 5432)
2. **PORT** - se a porta 3000 já estiver em uso
3. **DB_HOST** - se o PostgreSQL estiver em outro servidor (normalmente localhost)

### ✅ NÃO Precisa Alterar:
- Código-fonte do projeto
- Scripts npm (package.json)
- Estrutura de pastas
- Arquivos de documentação

---

## 🐛 Solução de Problemas Comuns

### Problema 1: "psql não é reconhecido"
**Solução:**
```powershell
# Adicionar PostgreSQL ao PATH
$env:Path += ";C:\Program Files\PostgreSQL\17\bin"
```

### Problema 2: "Erro de conexão com banco de dados"
**Verificações:**
1. PostgreSQL está rodando?
```powershell
Get-Service postgresql*
```
2. Senha no `.env` está correta?
3. Banco de dados foi criado?
```powershell
psql -U postgres -c "\l"
```

### Problema 3: "Porta 3000 já em uso"
**Solução:**
```powershell
# Verificar processo na porta 3000
Get-NetTCPConnection -LocalPort 3000

# Alterar a porta no arquivo .env
# PORT=3001
```

### Problema 4: "npm install falhou"
**Solução:**
```powershell
# Limpar cache e tentar novamente
npm cache clean --force
rm -r node_modules
rm package-lock.json
npm install
```

### Problema 5: "Erro ao executar db:setup"
**Solução:**
1. Verificar se o banco foi criado:
```sql
psql -U postgres
\l
\q
```
2. Verificar credenciais no `.env`
3. Recriar o banco:
```sql
psql -U postgres
DROP DATABASE sghss_vidaplus;
CREATE DATABASE sghss_vidaplus;
\q
```
4. Executar novamente:
```powershell
npm run db:setup
```

---

## 📱 Próximos Passos

Após a instalação bem-sucedida:

1. **Ler a documentação:**
   - `README.md` - Visão geral do projeto
   - `docs/DOCUMENTACAO_API.md` - Referência completa da API
   - `GUIA_TESTES.md` - Como testar todas as funcionalidades

2. **Importar no Postman:**
   - Abrir o Postman
   - Import > `docs/SGHSS_VidaPlus_Postman_Collection.json`

3. **Iniciar o desenvolvimento:**
   - Criar novas funcionalidades
   - Conectar com frontend
   - Personalizar conforme necessário

---

## 📞 Suporte

### Usuários de Teste Criados

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@vidaplus.com.br | Admin@123 |
| Médico | joao.silva@vidaplus.com.br | Medico@123 |
| Médico | maria.santos@vidaplus.com.br | Medico@456 |
| Enfermeiro | ana.costa@vidaplus.com.br | Enfermeiro@123 |
| Paciente | carlos.oliveira@email.com | Paciente@123 |
| Paciente | paula.mendes@email.com | Paciente@456 |

### Comandos Úteis

```powershell
# Iniciar servidor
npm run dev

# Parar servidor (se rodando em primeiro plano)
Ctrl + C

# Ver logs em tempo real
Get-Content .\logs\combined.log -Wait -Tail 20

# Resetar banco de dados
npm run db:setup
npm run db:seed

# Verificar versões
node --version
npm --version
psql --version

# Listar bancos de dados
psql -U postgres -c "\l"

# Conectar ao banco
psql -U postgres -d sghss_vidaplus
```

---

## ✅ Checklist Final

Antes de considerar a instalação completa, verifique:

- [ ] Node.js instalado e funcionando
- [ ] PostgreSQL instalado e rodando
- [ ] Arquivo `.env` configurado com SUAS credenciais
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados criado
- [ ] Tabelas criadas (`npm run db:setup`)
- [ ] Dados de teste inseridos (`npm run db:seed`)
- [ ] Servidor iniciado sem erros
- [ ] Página web acessível em http://localhost:3000
- [ ] API respondendo (teste de login funcionou)

---

**🎉 Parabéns! Se todos os itens acima estão marcados, sua instalação está completa!**

**Desenvolvido para o Projeto Multidisciplinar - VidaPlus**
