# ========================================
# SCRIPT DE TESTE RÁPIDO - SGHSS VidaPlus
# ========================================
# Este script executa todos os testes principais do sistema
# Execute: .\scripts\teste-rapido.ps1

$BASE_URL = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🏥 SGHSS VIDAPLUS - SCRIPT DE TESTE AUTOMÁTICO  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$TestName,
        [scriptblock]$TestCode
    )
    
    $script:totalTests++
    Write-Host "[$script:totalTests] $TestName" -ForegroundColor Yellow -NoNewline
    
    try {
        & $TestCode
        $script:passedTests++
        Write-Host " ✅" -ForegroundColor Green
        return $true
    }
    catch {
        $script:failedTests++
        Write-Host " ❌" -ForegroundColor Red
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ========================================
# TESTE 1: Health Check
# ========================================
Write-Host "`n🔍 VERIFICAÇÃO DE SAÚDE DO SISTEMA" -ForegroundColor Cyan
Write-Host "────────────────────────────────────" -ForegroundColor Cyan

Test-Endpoint "Health Check" {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    if ($health.status -ne "OK") {
        throw "Status diferente de OK"
    }
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2))s | Ambiente: $($health.environment)" -ForegroundColor Gray
}

# ========================================
# TESTE 2: Autenticação
# ========================================
Write-Host "`n🔐 TESTES DE AUTENTICAÇÃO" -ForegroundColor Cyan
Write-Host "──────────────────────────" -ForegroundColor Cyan

$TOKEN_ADMIN = ""
$TOKEN_MEDICO = ""
$TOKEN_ENFERMEIRO = ""
$TOKEN_PACIENTE = ""

# Login Admin
Test-Endpoint "Login como Administrador" {
    $loginAdmin = @{
        email = "admin@vidaplus.com.br"
        senha = "Admin@123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginAdmin -ContentType "application/json"
    $script:TOKEN_ADMIN = $response.token
    Write-Host "   Usuário: $($response.usuario.nome) | Token recebido" -ForegroundColor Gray
}

# Login Médico
Test-Endpoint "Login como Médico" {
    $loginMedico = @{
        email = "joao.silva@vidaplus.com.br"
        senha = "Medico@123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginMedico -ContentType "application/json"
    $script:TOKEN_MEDICO = $response.token
    Write-Host "   Médico: $($response.usuario.nome) | CRM: $($response.usuario.profissional.crm)" -ForegroundColor Gray
}

# Login Enfermeiro
Test-Endpoint "Login como Enfermeiro" {
    $loginEnfermeiro = @{
        email = "ana.costa@vidaplus.com.br"
        senha = "Enfermeiro@123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginEnfermeiro -ContentType "application/json"
    $script:TOKEN_ENFERMEIRO = $response.token
    Write-Host "   Enfermeiro: $($response.usuario.nome) | COREN: $($response.usuario.profissional.coren)" -ForegroundColor Gray
}

# Login Paciente
Test-Endpoint "Login como Paciente" {
    $loginPaciente = @{
        email = "carlos.oliveira@email.com"
        senha = "Paciente@123"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginPaciente -ContentType "application/json"
    $script:TOKEN_PACIENTE = $response.token
    Write-Host "   Paciente: $($response.usuario.nome) | Prontuário: $($response.usuario.paciente.numero_prontuario)" -ForegroundColor Gray
}

# Perfil do usuário
Test-Endpoint "Obter perfil do usuário autenticado" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
    $perfil = Invoke-RestMethod -Uri "$BASE_URL/api/auth/profile" -Method Get -Headers $headers
    Write-Host "   Nome: $($perfil.usuario.nome) | Email: $($perfil.usuario.email)" -ForegroundColor Gray
}

# ========================================
# TESTE 3: Gerenciamento de Pacientes
# ========================================
Write-Host "`n👥 TESTES DE GERENCIAMENTO DE PACIENTES" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

$pacienteId = $null

# Listar pacientes
Test-Endpoint "Listar todos os pacientes" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
    $pacientes = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
    Write-Host "   Total de pacientes: $($pacientes.data.Count)" -ForegroundColor Gray
    
    if ($pacientes.data.Count -gt 0) {
        $script:pacienteId = $pacientes.data[0].id
        Write-Host "   Primeiro paciente: $($pacientes.data[0].nome) | Prontuário: $($pacientes.data[0].numero_prontuario)" -ForegroundColor Gray
    }
}

# Buscar paciente específico
if ($pacienteId) {
    Test-Endpoint "Buscar paciente por ID" {
        $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
        $paciente = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes/$script:pacienteId" -Method Get -Headers $headers
        Write-Host "   Nome: $($paciente.data.nome) | Tipo Sanguíneo: $($paciente.data.tipo_sanguineo)" -ForegroundColor Gray
    }
    
    # Histórico do paciente
    Test-Endpoint "Buscar histórico do paciente" {
        $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
        $historico = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes/$script:pacienteId/historico" -Method Get -Headers $headers
        Write-Host "   Registros no histórico: $($historico.data.Count)" -ForegroundColor Gray
    }
}

# ========================================
# TESTE 4: Agendamento de Consultas
# ========================================
Write-Host "`n📅 TESTES DE AGENDAMENTO DE CONSULTAS" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────" -ForegroundColor Cyan

$consultaId = $null

# Agendar consulta presencial
Test-Endpoint "Agendar consulta presencial" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
    $novaConsulta = @{
        paciente_id = 1
        profissional_id = 2
        data_hora = "2025-12-01T10:00:00"
        tipo = "PRESENCIAL"
        motivo = "Consulta de rotina - Check-up cardiológico"
        unidade_id = 1
    } | ConvertTo-Json
    
    $consulta = Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Post -Headers $headers -Body $novaConsulta -ContentType "application/json"
    $script:consultaId = $consulta.data.id
    Write-Host "   Consulta ID: $($consulta.data.id) | Status: $($consulta.data.status) | Data: $($consulta.data.data_hora)" -ForegroundColor Gray
}

# Agendar telemedicina
Test-Endpoint "Agendar consulta de telemedicina" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
    $consultaTele = @{
        paciente_id = 2
        profissional_id = 3
        data_hora = "2025-12-02T14:00:00"
        tipo = "TELEMEDICINA"
        motivo = "Acompanhamento pós-operatório"
        link_telemedicina = "https://meet.vidaplus.com.br/consulta-teste"
    } | ConvertTo-Json
    
    $consulta = Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Post -Headers $headers -Body $consultaTele -ContentType "application/json"
    Write-Host "   Consulta ID: $($consulta.data.id) | Tipo: TELEMEDICINA | Link: $($consulta.data.link_telemedicina)" -ForegroundColor Gray
}

# Listar consultas
Test-Endpoint "Listar todas as consultas" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_ADMIN" }
    $consultas = Invoke-RestMethod -Uri "$BASE_URL/api/consultas" -Method Get -Headers $headers
    Write-Host "   Total de consultas: $($consultas.data.Count)" -ForegroundColor Gray
}

# Atualizar status da consulta
if ($consultaId) {
    Test-Endpoint "Atualizar status da consulta" {
        $headers = @{ Authorization = "Bearer $script:TOKEN_MEDICO" }
        $statusUpdate = @{
            status = "CONFIRMADA"
        } | ConvertTo-Json
        
        $consulta = Invoke-RestMethod -Uri "$BASE_URL/api/consultas/$script:consultaId/status" -Method Patch -Headers $headers -Body $statusUpdate -ContentType "application/json"
        Write-Host "   Novo status: $($consulta.data.status)" -ForegroundColor Gray
    }
}

# Verificar disponibilidade
Test-Endpoint "Verificar disponibilidade de profissional" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_MEDICO" }
    $profissionalId = 2
    $data = "2025-12-05"
    
    $disponibilidade = Invoke-RestMethod -Uri "$BASE_URL/api/consultas/disponibilidade?profissional_id=$profissionalId&data=$data" -Method Get -Headers $headers
    Write-Host "   Horários disponíveis: $($disponibilidade.data.horariosDisponiveis.Count)" -ForegroundColor Gray
}

# ========================================
# TESTE 5: Controle de Acesso
# ========================================
Write-Host "`n🔒 TESTES DE CONTROLE DE ACESSO (RBAC)" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────" -ForegroundColor Cyan

# Teste 1: Paciente tentando acessar lista de todos os pacientes (deve falhar)
Test-Endpoint "Paciente NÃO pode listar todos os pacientes" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_PACIENTE" }
    
    try {
        Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
        throw "Paciente conseguiu acessar lista de pacientes (não deveria!)"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "   Acesso corretamente negado (403 Forbidden)" -ForegroundColor Gray
        }
        else {
            throw
        }
    }
}

# Teste 2: Acesso sem token (deve falhar)
Test-Endpoint "Requisição sem token é rejeitada" {
    try {
        Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get
        throw "Acesso sem token foi permitido (não deveria!)"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   Acesso corretamente negado (401 Unauthorized)" -ForegroundColor Gray
        }
        else {
            throw
        }
    }
}

# Teste 3: Médico pode acessar lista de pacientes
Test-Endpoint "Médico PODE listar todos os pacientes" {
    $headers = @{ Authorization = "Bearer $script:TOKEN_MEDICO" }
    $pacientes = Invoke-RestMethod -Uri "$BASE_URL/api/pacientes" -Method Get -Headers $headers
    Write-Host "   Acesso permitido | Pacientes: $($pacientes.data.Count)" -ForegroundColor Gray
}

# ========================================
# TESTE 6: Registro de Novos Usuários
# ========================================
Write-Host "`n➕ TESTES DE REGISTRO DE USUÁRIOS" -ForegroundColor Cyan
Write-Host "──────────────────────────────────" -ForegroundColor Cyan

# Registrar novo médico
Test-Endpoint "Registrar novo médico" {
    $timestamp = Get-Date -Format "HHmmss"
    $novoMedico = @{
        nome = "Dr. Roberto Fernandes"
        cpf = "12345678$timestamp"
        email = "roberto.fernandes$timestamp@vidaplus.com.br"
        senha = "Senha@123"
        tipo = "MEDICO"
        crm = "CRM/SP 123456"
        especialidade = "Cardiologia"
        telefone = "(11) 98765-4321"
    } | ConvertTo-Json
    
    $medico = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $novoMedico -ContentType "application/json"
    Write-Host "   Médico criado: $($medico.usuario.nome) | Email: $($medico.usuario.email)" -ForegroundColor Gray
}

# Registrar novo paciente
Test-Endpoint "Registrar novo paciente" {
    $timestamp = Get-Date -Format "HHmmss"
    $novoPaciente = @{
        nome = "Maria da Silva"
        cpf = "11122233$timestamp"
        email = "maria.silva$timestamp@email.com"
        senha = "Senha@789"
        tipo = "PACIENTE"
        data_nascimento = "1985-05-15"
        tipo_sanguineo = "A+"
        telefone = "(11) 96543-2109"
        endereco = "Rua das Flores, 123 - São Paulo/SP"
    } | ConvertTo-Json
    
    $paciente = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method Post -Body $novoPaciente -ContentType "application/json"
    Write-Host "   Paciente criado: $($paciente.usuario.nome) | Prontuário: $($paciente.usuario.paciente.numero_prontuario)" -ForegroundColor Gray
}

# ========================================
# RELATÓRIO FINAL
# ========================================
Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            📊 RELATÓRIO DE TESTES                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total de testes executados: " -NoNewline
Write-Host "$totalTests" -ForegroundColor Cyan

Write-Host "Testes bem-sucedidos: " -NoNewline
Write-Host "$passedTests" -ForegroundColor Green

Write-Host "Testes com falha: " -NoNewline
Write-Host "$failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

Write-Host "Taxa de sucesso: " -NoNewline
Write-Host "$successRate%" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })

Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM COM SUCESSO!" -ForegroundColor Green
    Write-Host "✅ O sistema está funcionando corretamente." -ForegroundColor Green
} else {
    Write-Host "⚠️  ATENÇÃO: Alguns testes falharam." -ForegroundColor Yellow
    Write-Host "   Revise os erros acima e corrija os problemas." -ForegroundColor Yellow
}

Write-Host "`n════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Retornar código de saída baseado no resultado
exit $failedTests
