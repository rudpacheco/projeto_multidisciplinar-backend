# 📚 Documentação da API - SGHSS VidaPlus

## 🔐 Autenticação

Todos os endpoints (exceto registro e login) requerem autenticação via JWT Token.

**Como autenticar:**
1. Faça login em `/api/auth/login`
2. Copie o `token` retornado
3. Inclua o token no header `Authorization` de todas as requisições:
   ```
   Authorization: Bearer SEU_TOKEN_AQUI
   ```

---

## 📋 Endpoints

### 1. AUTENTICAÇÃO

#### 1.1. Registrar Novo Usuário
```http
POST /api/auth/register
Content-Type: application/json
```

**Body - Exemplo Paciente:**
```json
{
  "nome": "João da Silva",
  "email": "joao.silva@email.com",
  "senha": "senha123",
  "tipo": "PACIENTE",
  "cpf": "12345678901",
  "telefone": "11987654321",
  "data_nascimento": "1990-05-15",
  "endereco": "Rua ABC, 123 - São Paulo/SP",
  "dados_adicionais": {
    "tipo_sanguineo": "O+",
    "alergias": "Nenhuma",
    "condicoes_preexistentes": "Hipertensão",
    "contato_emergencia": "Maria Silva",
    "telefone_emergencia": "11987654322",
    "plano_saude": "Unimed",
    "numero_carteirinha": "123456789"
  }
}
```

**Body - Exemplo Médico:**
```json
{
  "nome": "Dr. Carlos Santos",
  "email": "carlos.santos@vidaplus.com.br",
  "senha": "senha123",
  "tipo": "MEDICO",
  "cpf": "98765432100",
  "telefone": "11999999999",
  "data_nascimento": "1975-10-20",
  "endereco": "Av. XYZ, 456 - São Paulo/SP",
  "dados_adicionais": {
    "especialidade": "Cardiologia",
    "registro_profissional": "CRM987654",
    "conselho": "CRM-SP",
    "disponibilidade": {
      "segunda": ["08:00-12:00", "14:00-18:00"],
      "terca": ["08:00-12:00", "14:00-18:00"],
      "quarta": ["08:00-12:00"],
      "quinta": ["08:00-12:00", "14:00-18:00"],
      "sexta": ["08:00-12:00"]
    }
  }
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "usuario": {
      "id": 1,
      "nome": "João da Silva",
      "email": "joao.silva@email.com",
      "tipo": "PACIENTE",
      "cpf": "12345678901",
      "telefone": "11987654321",
      "data_nascimento": "1990-05-15",
      "ativo": true,
      "criado_em": "2024-11-18T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 1.2. Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "joao.silva@email.com",
  "senha": "senha123"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "usuario": {
      "id": 1,
      "nome": "João da Silva",
      "email": "joao.silva@email.com",
      "tipo": "PACIENTE",
      "cpf": "12345678901",
      "telefone": "11987654321",
      "ativo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 1.3. Obter Perfil do Usuário Autenticado
```http
GET /api/auth/me
Authorization: Bearer SEU_TOKEN
```

**Resposta (200 OK) - Paciente:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João da Silva",
    "email": "joao.silva@email.com",
    "tipo": "PACIENTE",
    "cpf": "12345678901",
    "telefone": "11987654321",
    "data_nascimento": "1990-05-15",
    "endereco": "Rua ABC, 123 - São Paulo/SP",
    "numero_prontuario": "PRONT000001",
    "tipo_sanguineo": "O+",
    "alergias": "Nenhuma",
    "condicoes_preexistentes": "Hipertensão",
    "contato_emergencia": "Maria Silva",
    "telefone_emergencia": "11987654322",
    "plano_saude": "Unimed",
    "numero_carteirinha": "123456789"
  }
}
```

---

#### 1.4. Alterar Senha
```http
PUT /api/auth/change-password
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "senha_atual": "senha123",
  "senha_nova": "novaSenha456"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

---

### 2. PACIENTES

#### 2.1. Listar Todos os Pacientes
```http
GET /api/pacientes?page=1&limit=10&search=joão
Authorization: Bearer SEU_TOKEN
```

**Permissões:** ADMINISTRADOR, MEDICO, ENFERMEIRO

**Query Params:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Registros por página (padrão: 10, máx: 100)
- `search` (opcional): Busca por nome, CPF ou número de prontuário

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João da Silva",
      "email": "joao.silva@email.com",
      "cpf": "12345678901",
      "telefone": "11987654321",
      "data_nascimento": "1990-05-15",
      "numero_prontuario": "PRONT000001",
      "tipo_sanguineo": "O+",
      "alergias": "Nenhuma",
      "plano_saude": "Unimed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### 2.2. Buscar Paciente por ID
```http
GET /api/pacientes/1
Authorization: Bearer SEU_TOKEN
```

**Permissões:** Próprio paciente, ADMINISTRADOR, MEDICO, ENFERMEIRO

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João da Silva",
    "email": "joao.silva@email.com",
    "cpf": "12345678901",
    "telefone": "11987654321",
    "data_nascimento": "1990-05-15",
    "endereco": "Rua ABC, 123 - São Paulo/SP",
    "paciente_id": 1,
    "numero_prontuario": "PRONT000001",
    "tipo_sanguineo": "O+",
    "alergias": "Nenhuma",
    "condicoes_preexistentes": "Hipertensão",
    "contato_emergencia": "Maria Silva",
    "telefone_emergencia": "11987654322",
    "plano_saude": "Unimed",
    "numero_carteirinha": "123456789"
  }
}
```

---

#### 2.3. Atualizar Dados do Paciente
```http
PUT /api/pacientes/1
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

**Permissões:** Próprio paciente, ADMINISTRADOR

**Body:**
```json
{
  "telefone": "11999999999",
  "endereco": "Nova Rua, 456 - São Paulo/SP",
  "tipo_sanguineo": "O+",
  "alergias": "Penicilina",
  "condicoes_preexistentes": "Hipertensão controlada",
  "contato_emergencia": "Maria Silva",
  "telefone_emergencia": "11987654322"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Paciente atualizado com sucesso",
  "data": {
    "id": 1,
    "nome": "João da Silva",
    "telefone": "11999999999",
    "endereco": "Nova Rua, 456 - São Paulo/SP"
  }
}
```

---

#### 2.4. Buscar Histórico Clínico do Paciente
```http
GET /api/pacientes/1/historico
Authorization: Bearer SEU_TOKEN
```

**Permissões:** Próprio paciente, ADMINISTRADOR, MEDICO, ENFERMEIRO

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "consultas": [
      {
        "id": 10,
        "data_hora": "2024-11-15T14:00:00.000Z",
        "tipo": "PRESENCIAL",
        "status": "CONCLUIDA",
        "motivo": "Consulta de rotina",
        "profissional_nome": "Dr. Carlos Santos",
        "especialidade": "Cardiologia",
        "unidade_nome": "Hospital VidaPlus Central"
      }
    ],
    "prontuarios": [
      {
        "id": 5,
        "data_atendimento": "2024-11-15T14:00:00.000Z",
        "queixa_principal": "Dor no peito",
        "hipotese_diagnostica": "Angina estável",
        "conduta": "Medicação prescrita",
        "profissional_nome": "Dr. Carlos Santos",
        "especialidade": "Cardiologia"
      }
    ],
    "exames": [
      {
        "id": 3,
        "tipo": "CARDIOLOGICO",
        "nome": "Eletrocardiograma",
        "data_solicitacao": "2024-11-15T14:00:00.000Z",
        "data_realizacao": "2024-11-16T09:00:00.000Z",
        "resultado": "Normal",
        "profissional_solicitante": "Dr. Carlos Santos"
      }
    ],
    "prescricoes": [
      {
        "id": 7,
        "medicamento": "Losartana",
        "dosagem": "50mg",
        "frequencia": "1x ao dia",
        "duracao": "30 dias",
        "orientacoes": "Tomar pela manhã",
        "data_prescricao": "2024-11-15T14:00:00.000Z",
        "profissional_nome": "Dr. Carlos Santos"
      }
    ]
  }
}
```

---

#### 2.5. Desativar Paciente
```http
DELETE /api/pacientes/1
Authorization: Bearer SEU_TOKEN
```

**Permissões:** ADMINISTRADOR

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Paciente desativado com sucesso"
}
```

---

### 3. CONSULTAS

#### 3.1. Agendar Nova Consulta
```http
POST /api/consultas
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

**Permissões:** PACIENTE, MEDICO, ENFERMEIRO, ADMINISTRADOR

**Body - Consulta Presencial:**
```json
{
  "paciente_id": 1,
  "profissional_id": 1,
  "unidade_id": 1,
  "data_hora": "2024-11-25T14:00:00",
  "tipo": "PRESENCIAL",
  "motivo": "Consulta de rotina",
  "observacoes": "Paciente com histórico de hipertensão"
}
```

**Body - Telemedicina:**
```json
{
  "paciente_id": 1,
  "profissional_id": 1,
  "data_hora": "2024-11-25T10:00:00",
  "tipo": "TELEMEDICINA",
  "motivo": "Retorno cardiologia",
  "observacoes": "Revisão de exames"
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "message": "Consulta agendada com sucesso",
  "data": {
    "id": 15,
    "paciente_id": 1,
    "profissional_id": 1,
    "unidade_id": 1,
    "data_hora": "2024-11-25T14:00:00.000Z",
    "tipo": "PRESENCIAL",
    "status": "AGENDADA",
    "motivo": "Consulta de rotina",
    "observacoes": "Paciente com histórico de hipertensão",
    "link_telemedicina": null,
    "duracao_minutos": 30,
    "criado_em": "2024-11-18T10:45:00.000Z"
  }
}
```

---

#### 3.2. Listar Consultas
```http
GET /api/consultas?page=1&limit=10&status=AGENDADA&tipo=PRESENCIAL
Authorization: Bearer SEU_TOKEN
```

**Query Params:**
- `page` (opcional): Número da página
- `limit` (opcional): Registros por página
- `status` (opcional): AGENDADA, CONFIRMADA, EM_ATENDIMENTO, CONCLUIDA, CANCELADA, FALTOU
- `tipo` (opcional): PRESENCIAL, TELEMEDICINA
- `data_inicio` (opcional): Filtrar por data (formato: YYYY-MM-DD)
- `data_fim` (opcional): Filtrar por data (formato: YYYY-MM-DD)

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "data_hora": "2024-11-25T14:00:00.000Z",
      "tipo": "PRESENCIAL",
      "status": "AGENDADA",
      "motivo": "Consulta de rotina",
      "paciente_nome": "João da Silva",
      "numero_prontuario": "PRONT000001",
      "profissional_nome": "Dr. Carlos Santos",
      "especialidade": "Cardiologia",
      "unidade_nome": "Hospital VidaPlus Central"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

---

#### 3.3. Buscar Consulta por ID
```http
GET /api/consultas/15
Authorization: Bearer SEU_TOKEN
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "paciente_id": 1,
    "profissional_id": 1,
    "unidade_id": 1,
    "data_hora": "2024-11-25T14:00:00.000Z",
    "tipo": "PRESENCIAL",
    "status": "AGENDADA",
    "motivo": "Consulta de rotina",
    "observacoes": "Paciente com histórico de hipertensão",
    "link_telemedicina": null,
    "duracao_minutos": 30,
    "paciente_nome": "João da Silva",
    "paciente_cpf": "12345678901",
    "paciente_telefone": "11987654321",
    "numero_prontuario": "PRONT000001",
    "profissional_nome": "Dr. Carlos Santos",
    "especialidade": "Cardiologia",
    "registro_profissional": "CRM987654",
    "unidade_nome": "Hospital VidaPlus Central",
    "unidade_endereco": "Av. Paulista, 1000 - São Paulo/SP"
  }
}
```

---

#### 3.4. Buscar Disponibilidade do Profissional
```http
GET /api/consultas/disponibilidade/1?data=2024-11-25
Authorization: Bearer SEU_TOKEN
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "data": {
    "disponibilidade": {
      "segunda": ["08:00-12:00", "14:00-18:00"],
      "terca": ["08:00-12:00", "14:00-18:00"],
      "quarta": ["08:00-12:00"],
      "quinta": ["08:00-12:00", "14:00-18:00"],
      "sexta": ["08:00-12:00"]
    },
    "consultas_agendadas": [
      {
        "hora": "14:00",
        "duracao": 30
      },
      {
        "hora": "15:00",
        "duracao": 30
      }
    ]
  }
}
```

---

#### 3.5. Atualizar Status da Consulta
```http
PUT /api/consultas/15/status
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

**Permissões:** MEDICO, ENFERMEIRO, ADMINISTRADOR

**Body:**
```json
{
  "status": "CONFIRMADA",
  "observacoes": "Paciente confirmou presença por telefone"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "data": {
    "id": 15,
    "status": "CONFIRMADA",
    "observacoes": "Paciente confirmou presença por telefone"
  }
}
```

---

#### 3.6. Cancelar Consulta
```http
DELETE /api/consultas/15
Authorization: Bearer SEU_TOKEN
Content-Type: application/json
```

**Permissões:** PACIENTE, MEDICO, ADMINISTRADOR

**Body:**
```json
{
  "motivo_cancelamento": "Paciente solicitou reagendamento"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Consulta cancelada com sucesso",
  "data": {
    "id": 15,
    "status": "CANCELADA"
  }
}
```

---

## 🔒 Perfis de Usuário

| Perfil | Descrição | Permissões |
|--------|-----------|------------|
| **PACIENTE** | Paciente do sistema | - Ver próprios dados<br>- Agendar consultas<br>- Ver histórico clínico |
| **MEDICO** | Médico | - Ver todos pacientes<br>- Gerenciar consultas<br>- Acessar prontuários<br>- Prescrever medicamentos |
| **ENFERMEIRO** | Enfermeiro | - Ver pacientes<br>- Atualizar status de consultas<br>- Registrar atendimentos |
| **TECNICO** | Técnico de laboratório | - Registrar resultados de exames |
| **ADMINISTRADOR** | Administrador do sistema | - Acesso completo a todas funcionalidades |

---

## ❌ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (duplicação) |
| 500 | Erro interno do servidor |

---

## 🛡️ Segurança e LGPD

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação via JWT
- ✅ Logs de auditoria automáticos
- ✅ Controle de acesso por perfil
- ✅ Proteção contra ataques XSS e CSRF
- ✅ Headers de segurança com Helmet
- ✅ Validação de dados com express-validator
