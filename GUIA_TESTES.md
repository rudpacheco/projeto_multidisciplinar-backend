# 🧪 Guia Completo de Testes - SGHSS VidaPlus

## 📋 Índice
1. [Variáveis de Ambiente](#variáveis-de-ambiente)
2. [Teste 1: Health Check](#teste-1-health-check)
3. [Teste 2: Registro de Usuários](#teste-2-registro-de-usuários)
4. [Teste 3: Login e Autenticação](#teste-3-login-e-autenticação)
5. [Teste 4: Gerenciamento de Pacientes](#teste-4-gerenciamento-de-pacientes)
6. [Teste 5: Agendamento de Consultas](#teste-5-agendamento-de-consultas)
7. [Teste 6: Autorização por Papel](#teste-6-autorização-por-papel)
8. [Dados de Teste Disponíveis](#dados-de-teste-disponíveis)

---

## Variáveis de Ambiente

Configure estas variáveis no PowerShell antes de iniciar os testes:

```powershell
# URL base da API
$BASE_URL = "http://localhost:3000"

# Tokens de autenticação (serão preenchidos após login)
$TOKEN_ADMIN = ""
$TOKEN_MEDICO = ""
$TOKEN_ENFERMEIRO = ""
$TOKEN_PACIENTE = ""
```

---

## Teste 1: Health Check

### Verificar se o servidor está rodando

```powershell
# Health Check
Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get | ConvertTo-Json -Depth 3
```

**Resultado Esperado:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-18T15:01:11.593Z",
  "uptime": 35.54,
  "environment": "development"
}
```

---

## Teste 2: Registro de Usuários

### 2.1 Registrar um Novo Médico

```powershell
$novoMedico = @{
    nome = "Dr. Roberto Fernandes"
    cpf = "12345678901"
    email = "roberto.fernandes@vidaplus.com.br"
    senha = "Senha@123"
    tipo = "MEDICO"
    crm = "CRM/SP 123456"
    especialidade = "Cardiologia"
    telefone = "(11) 98765-4321"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $novoMedico -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 2.2 Registrar uma Nova Enfermeira

```powershell
$novaEnfermeira = @{
    nome = "Fernanda Lima"
    cpf = "98765432100"
    email = "fernanda.lima@vidaplus.com.br"
    senha = "Senha@456"
    tipo = "ENFERMEIRO"
    coren = "COREN/SP 234567"
    telefone = "(11) 97654-3210"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $novaEnfermeira -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 2.3 Registrar um Novo Paciente

```powershell
$novoPaciente = @{
    nome = "Maria da Silva"
    cpf = "11122233344"
    email = "maria.silva@email.com"
    senha = "Senha@789"
    tipo = "PACIENTE"
    data_nascimento = "1985-05-15"
    tipo_sanguineo = "A+"
    telefone = "(11) 96543-2109"
    endereco = "Rua das Flores, 123 - São Paulo/SP"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $novoPaciente -ContentType "application/json" | ConvertTo-Json -Depth 3
```

---

## Teste 3: Login e Autenticação

### 3.1 Login como Administrador

```powershell
$loginAdmin = @{
    email = "admin@vidaplus.com.br"
    senha = "Admin@123"
} | ConvertTo-Json

$responseAdmin = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginAdmin -ContentType "application/json"
$TOKEN_ADMIN = $responseAdmin.token
Write-Host "Token Admin: $TOKEN_ADMIN" -ForegroundColor Green
$responseAdmin | ConvertTo-Json -Depth 3
```

### 3.2 Login como Médico

```powershell
$loginMedico = @{
    email = "joao.silva@vidaplus.com.br"
    senha = "Medico@123"
} | ConvertTo-Json

$responseMedico = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginMedico -ContentType "application/json"
$TOKEN_MEDICO = $responseMedico.token
Write-Host "Token Médico: $TOKEN_MEDICO" -ForegroundColor Green
$responseMedico | ConvertTo-Json -Depth 3
```

### 3.3 Login como Enfermeiro

```powershell
$loginEnfermeiro = @{
    email = "ana.costa@vidaplus.com.br"
    senha = "Enfermeiro@123"
} | ConvertTo-Json

$responseEnfermeiro = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginEnfermeiro -ContentType "application/json"
$TOKEN_ENFERMEIRO = $responseEnfermeiro.token
Write-Host "Token Enfermeiro: $TOKEN_ENFERMEIRO" -ForegroundColor Green
$responseEnfermeiro | ConvertTo-Json -Depth 3
```

### 3.4 Login como Paciente

```powershell
$loginPaciente = @{
    email = "carlos.oliveira@email.com"
    senha = "Paciente@123"
} | ConvertTo-Json

$responsePaciente = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginPaciente -ContentType "application/json"
$TOKEN_PACIENTE = $responsePaciente.token
Write-Host "Token Paciente: $TOKEN_PACIENTE" -ForegroundColor Green
$responsePaciente | ConvertTo-Json -Depth 3
```

### 3.5 Obter Perfil do Usuário Autenticado

```powershell
# Perfil do Admin
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
Invoke-RestMethod -Uri "$BASE_URL/api/auth/profile" -Method Get -Headers $headers | ConvertTo-Json -Depth 3
```

---

## Teste 4: Gerenciamento de Pacientes

### 4.1 Listar Todos os Pacientes (como Admin)

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$pacientes = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
Write-Host "Total de pacientes: $($pacientes.data.Count)" -ForegroundColor Cyan
$pacientes | ConvertTo-Json -Depth 3
```

### 4.2 Buscar Paciente Específico

```powershell
# Usar o ID do primeiro paciente da lista
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$pacienteId = 1  # Ajuste conforme necessário

Invoke-RestMethod -Uri "$BASE_URL/api/pacientes/$pacienteId" -Method Get -Headers $headers | ConvertTo-Json -Depth 3
```

### 4.3 Atualizar Dados do Paciente

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$pacienteId = 1

$atualizacao = @{
    telefone = "(11) 99999-8888"
    endereco = "Rua Nova, 456 - São Paulo/SP"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/pacientes/$pacienteId" -Method Put -Headers $headers -Body $atualizacao -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 4.4 Buscar Histórico do Paciente

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$pacienteId = 1

Invoke-RestMethod -Uri "$BASE_URL/api/pacientes/$pacienteId/historico" -Method Get -Headers $headers | ConvertTo-Json -Depth 3
```

---

## Teste 5: Agendamento de Consultas

### 5.1 Verificar Disponibilidade

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_MEDICO" }
$profissionalId = 2  # ID do médico
$data = "2025-11-25"

Invoke-RestMethod -Uri "$BASE_URL/api/consultas/disponibilidade?profissional_id=$profissionalId&data=$data" -Method Get -Headers $headers | ConvertTo-Json -Depth 3
```

### 5.2 Agendar Consulta Presencial

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }

$novaConsulta = @{
    paciente_id = 1
    profissional_id = 2
    data_hora = "2025-11-25T10:00:00"
    tipo = "PRESENCIAL"
    motivo = "Consulta de rotina - Check-up cardiológico"
    unidade_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Post -Headers $headers -Body $novaConsulta -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 5.3 Agendar Consulta de Telemedicina

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }

$consultaTele = @{
    paciente_id = 2
    profissional_id = 3
    data_hora = "2025-11-26T14:00:00"
    tipo = "TELEMEDICINA"
    motivo = "Acompanhamento pós-operatório"
    link_telemedicina = "https://meet.vidaplus.com.br/consulta-12345"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Post -Headers $headers -Body $consultaTele -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 5.4 Listar Todas as Consultas

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Get -Headers $headers | ConvertTo-Json -Depth 3
```

### 5.5 Atualizar Status da Consulta

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_MEDICO" }
$consultaId = 1

$statusUpdate = @{
    status = "CONFIRMADA"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/consultas/$consultaId/status" -Method Patch -Headers $headers -Body $statusUpdate -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 5.6 Cancelar Consulta

```powershell
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$consultaId = 1

$cancelamento = @{
    motivo_cancelamento = "Paciente solicitou reagendamento"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/api/consultas/$consultaId/cancelar" -Method Delete -Headers $headers -Body $cancelamento -ContentType "application/json" | ConvertTo-Json -Depth 3
```

---

## Teste 6: Autorização por Papel

### 6.1 Teste de Acesso Negado (Paciente tentando listar todos os pacientes)

```powershell
# Isso deve retornar erro 403 - Forbidden
$headers = @{ Authorization = "Bearer $TOKEN_PACIENTE" }

try {
    Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
} catch {
    Write-Host "❌ Acesso negado (esperado): $($_.Exception.Message)" -ForegroundColor Yellow
    $_.Exception.Response.StatusCode
}
```

### 6.2 Teste de Acesso Sem Token

```powershell
# Isso deve retornar erro 401 - Unauthorized
try {
    Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get
} catch {
    Write-Host "❌ Não autenticado (esperado): $($_.Exception.Message)" -ForegroundColor Yellow
    $_.Exception.Response.StatusCode
}
```

---

## Dados de Teste Disponíveis

### 👥 Usuários Cadastrados (após seed)

#### 1. Administrador
- **Email:** admin@vidaplus.com.br
- **Senha:** Admin@123
- **Tipo:** ADMINISTRADOR
- **Nome:** Administrador do Sistema

#### 2. Médico 1
- **Email:** joao.silva@vidaplus.com.br
- **Senha:** Medico@123
- **Tipo:** MEDICO
- **Nome:** Dr. João Silva
- **CRM:** CRM/SP 123456
- **Especialidade:** Cardiologia

#### 3. Médico 2
- **Email:** maria.santos@vidaplus.com.br
- **Senha:** Medico@456
- **Tipo:** MEDICO
- **Nome:** Dra. Maria Santos
- **CRM:** CRM/RJ 654321
- **Especialidade:** Pediatria

#### 4. Enfermeiro
- **Email:** ana.costa@vidaplus.com.br
- **Senha:** Enfermeiro@123
- **Tipo:** ENFERMEIRO
- **Nome:** Ana Costa
- **COREN:** COREN/SP 987654

#### 5. Paciente 1
- **Email:** carlos.oliveira@email.com
- **Senha:** Paciente@123
- **Tipo:** PACIENTE
- **Nome:** Carlos Oliveira
- **Prontuário:** PRONT001
- **Tipo Sanguíneo:** O+
- **Data Nascimento:** 1990-05-15

#### 6. Paciente 2
- **Email:** paula.mendes@email.com
- **Senha:** Paciente@456
- **Tipo:** PACIENTE
- **Nome:** Paula Mendes
- **Prontuário:** PRONT002
- **Tipo Sanguíneo:** A+
- **Data Nascimento:** 1985-08-20

### 🏥 Unidades Hospitalares

#### 1. Hospital VidaPlus - Unidade Central
- **ID:** 1
- **Telefone:** (11) 3000-0000
- **Endereço:** Av. Paulista, 1000 - São Paulo/SP

#### 2. Hospital VidaPlus - Unidade Zona Sul
- **ID:** 2
- **Telefone:** (11) 3000-0001
- **Endereço:** Av. Santo Amaro, 2000 - São Paulo/SP

### 🛏️ Leitos Disponíveis
- 10 leitos criados (5 em cada unidade)
- Status: DISPONIVEL
- Tipos: UTI, ENFERMARIA, QUARTO_PRIVADO

---

## 📝 Script Completo de Teste Rápido

Salve este script em um arquivo `.ps1` para executar todos os testes de uma vez:

```powershell
# SCRIPT DE TESTE COMPLETO - SGHSS VidaPlus

$BASE_URL = "http://localhost:3000"

Write-Host "`n🏥 INICIANDO TESTES DO SGHSS VIDAPLUS" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1️⃣ Testando Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# 2. Login Admin
Write-Host "2️⃣ Fazendo login como Administrador..." -ForegroundColor Yellow
$loginAdmin = @{ email = "admin@vidaplus.com.br"; senha = "Admin@123" } | ConvertTo-Json
$responseAdmin = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginAdmin -ContentType "application/json"
$TOKEN_ADMIN = $responseAdmin.token
Write-Host "✅ Login realizado: $($responseAdmin.usuario.nome)" -ForegroundColor Green
Write-Host ""

# 3. Login Médico
Write-Host "3️⃣ Fazendo login como Médico..." -ForegroundColor Yellow
$loginMedico = @{ email = "joao.silva@vidaplus.com.br"; senha = "Medico@123" } | ConvertTo-Json
$responseMedico = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginMedico -ContentType "application/json"
$TOKEN_MEDICO = $responseMedico.token
Write-Host "✅ Login realizado: $($responseMedico.usuario.nome)" -ForegroundColor Green
Write-Host ""

# 4. Listar Pacientes
Write-Host "4️⃣ Listando pacientes..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $TOKEN_ADMIN" }
$pacientes = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
Write-Host "✅ Total de pacientes: $($pacientes.data.Count)" -ForegroundColor Green
foreach ($p in $pacientes.data) {
    Write-Host "   - $($p.nome) | Prontuário: $($p.numero_prontuario) | Tipo Sanguíneo: $($p.tipo_sanguineo)" -ForegroundColor White
}
Write-Host ""

# 5. Agendar Consulta
Write-Host "5️⃣ Agendando nova consulta..." -ForegroundColor Yellow
$novaConsulta = @{
    paciente_id = 1
    profissional_id = 2
    data_hora = "2025-11-25T10:00:00"
    tipo = "PRESENCIAL"
    motivo = "Consulta de rotina - Check-up"
    unidade_id = 1
} | ConvertTo-Json
$consulta = Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Post -Headers $headers -Body $novaConsulta -ContentType "application/json"
Write-Host "✅ Consulta agendada - ID: $($consulta.data.id)" -ForegroundColor Green
Write-Host ""

# 6. Listar Consultas
Write-Host "6️⃣ Listando consultas..." -ForegroundColor Yellow
$consultas = Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Get -Headers $headers
Write-Host "✅ Total de consultas: $($consultas.data.Count)" -ForegroundColor Green
Write-Host ""

# 7. Teste de Autorização
Write-Host "7️⃣ Testando controle de acesso..." -ForegroundColor Yellow
$loginPaciente = @{ email = "carlos.oliveira@email.com"; senha = "Paciente@123" } | ConvertTo-Json
$responsePaciente = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginPaciente -ContentType "application/json"
$TOKEN_PACIENTE = $responsePaciente.token
$headersPaciente = @{ Authorization = "Bearer $TOKEN_PACIENTE" }

try {
    Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headersPaciente
    Write-Host "❌ Erro: Paciente conseguiu acessar lista de todos os pacientes!" -ForegroundColor Red
} catch {
    Write-Host "✅ Acesso negado corretamente (403 Forbidden)" -ForegroundColor Green
}
Write-Host ""

Write-Host "🎉 TESTES CONCLUÍDOS COM SUCESSO!" -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Cyan
```

---

## 🔧 Troubleshooting

### Servidor não inicia
```powershell
# Verificar se a porta 3000 está em uso
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

# Matar processo na porta 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}
```

### Erro de conexão com banco de dados
```powershell
# Verificar se o PostgreSQL está rodando
Get-Service postgresql*

# Testar conexão
psql -U postgres -h localhost -p 5432 -d sghss_vidaplus
```

### Token expirado
```powershell
# Fazer login novamente
$login = @{ email = "admin@vidaplus.com.br"; senha = "Admin@123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $login -ContentType "application/json"
$TOKEN_ADMIN = $response.token
```

---

## 📊 Endpoints Disponíveis

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil (requer autenticação)
- `PUT /api/auth/change-password` - Alterar senha (requer autenticação)

### Pacientes
- `GET /api/pacientes` - Listar pacientes (ADMIN, MEDICO, ENFERMEIRO)
- `GET /api/pacientes/:id` - Buscar paciente específico
- `PUT /api/pacientes/:id` - Atualizar paciente (ADMIN, MEDICO, ENFERMEIRO)
- `GET /api/pacientes/:id/historico` - Histórico do paciente
- `DELETE /api/pacientes/:id` - Desativar paciente (ADMIN)

### Consultas
- `POST /api/consultas` - Agendar consulta (ADMIN, MEDICO, ENFERMEIRO)
- `GET /api/consultas` - Listar consultas
- `GET /api/consultas/:id` - Buscar consulta específica
- `PATCH /api/consultas/:id/status` - Atualizar status (ADMIN, MEDICO)
- `DELETE /api/consultas/:id/cancelar` - Cancelar consulta
- `GET /api/consultas/disponibilidade` - Verificar disponibilidade

---

**Desenvolvido para o Projeto Multidisciplinar - VidaPlus**
