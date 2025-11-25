-- ==========================================
-- SGHSS VIDAPLUS - SCHEMA DO BANCO DE DADOS
-- Sistema de Gestão Hospitalar
-- ==========================================

-- Conectar ao banco
\c sghss_vidaplus;

-- ==========================================
-- 1. TIPOS ENUMERADOS
-- ==========================================

-- Tipo de usuário no sistema
CREATE TYPE tipo_usuario AS ENUM (
    'PACIENTE',
    'MEDICO',
    'ENFERMEIRO',
    'TECNICO',
    'ADMINISTRADOR'
);

-- Status da consulta
CREATE TYPE status_consulta AS ENUM (
    'AGENDADA',
    'CONFIRMADA',
    'EM_ATENDIMENTO',
    'CONCLUIDA',
    'CANCELADA',
    'FALTOU'
);

-- Tipo de consulta
CREATE TYPE tipo_consulta AS ENUM (
    'PRESENCIAL',
    'TELEMEDICINA'
);

-- Status do leito
CREATE TYPE status_leito AS ENUM (
    'DISPONIVEL',
    'OCUPADO',
    'MANUTENCAO',
    'RESERVADO'
);

-- Tipo de exame
CREATE TYPE tipo_exame AS ENUM (
    'SANGUE',
    'URINA',
    'IMAGEM',
    'CARDIOLOGICO',
    'OUTROS'
);

-- ==========================================
-- 2. TABELA: usuarios
-- Tabela base para todos os tipos de usuários
-- ==========================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo tipo_usuario NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    telefone VARCHAR(15),
    data_nascimento DATE,
    endereco TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuarios IS 'Tabela base para todos os usuários do sistema';
COMMENT ON COLUMN usuarios.senha_hash IS 'Senha criptografada com bcrypt';
COMMENT ON COLUMN usuarios.tipo IS 'Define o perfil e permissões do usuário';
COMMENT ON COLUMN usuarios.ativo IS 'Soft delete - usuário pode ser desativado';

-- ==========================================
-- 3. TABELA: pacientes
-- Informações específicas de pacientes
-- ==========================================

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_prontuario VARCHAR(50) UNIQUE NOT NULL,
    tipo_sanguineo VARCHAR(3),
    alergias TEXT,
    condicoes_preexistentes TEXT,
    contato_emergencia VARCHAR(255),
    telefone_emergencia VARCHAR(15),
    plano_saude VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pacientes IS 'Dados específicos de pacientes';
COMMENT ON COLUMN pacientes.numero_prontuario IS 'Identificador único do prontuário';

-- ==========================================
-- 4. TABELA: profissionais_saude
-- Informações de médicos, enfermeiros, técnicos
-- ==========================================

CREATE TABLE profissionais_saude (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    especialidade VARCHAR(100),
    registro_profissional VARCHAR(50) UNIQUE NOT NULL,
    conselho VARCHAR(20),
    disponibilidade JSONB,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE profissionais_saude IS 'Dados de profissionais de saúde';
COMMENT ON COLUMN profissionais_saude.disponibilidade IS 'JSON com horários disponíveis';

-- ==========================================
-- 5. TABELA: unidades_hospitalares
-- Hospitais, clínicas, laboratórios
-- ==========================================

CREATE TABLE unidades_hospitalares (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    endereco TEXT NOT NULL,
    telefone VARCHAR(15),
    email VARCHAR(255),
    capacidade_leitos INTEGER,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE unidades_hospitalares IS 'Unidades de saúde da instituição';

-- ==========================================
-- 6. TABELA: leitos
-- Gestão de leitos hospitalares
-- ==========================================

CREATE TABLE leitos (
    id SERIAL PRIMARY KEY,
    unidade_id INTEGER REFERENCES unidades_hospitalares(id),
    numero VARCHAR(20) NOT NULL,
    andar VARCHAR(10),
    setor VARCHAR(50),
    status status_leito DEFAULT 'DISPONIVEL',
    tipo VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unidade_id, numero)
);

COMMENT ON TABLE leitos IS 'Controle de leitos por unidade';

-- ==========================================
-- 7. TABELA: consultas
-- Agendamentos e atendimentos
-- ==========================================

CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    profissional_id INTEGER REFERENCES profissionais_saude(id),
    unidade_id INTEGER REFERENCES unidades_hospitalares(id),
    data_hora TIMESTAMP NOT NULL,
    tipo tipo_consulta DEFAULT 'PRESENCIAL',
    status status_consulta DEFAULT 'AGENDADA',
    motivo TEXT,
    observacoes TEXT,
    link_telemedicina TEXT,
    duracao_minutos INTEGER DEFAULT 30,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE consultas IS 'Agendamentos de consultas presenciais e telemedicina';
COMMENT ON COLUMN consultas.link_telemedicina IS 'Link gerado automaticamente para teleconsultas';

-- ==========================================
-- 8. TABELA: prontuarios
-- Registros clínicos dos atendimentos
-- ==========================================

CREATE TABLE prontuarios (
    id SERIAL PRIMARY KEY,
    consulta_id INTEGER REFERENCES consultas(id),
    paciente_id INTEGER REFERENCES pacientes(id),
    profissional_id INTEGER REFERENCES profissionais_saude(id),
    data_atendimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    queixa_principal TEXT,
    historia_doenca TEXT,
    exame_fisico TEXT,
    hipotese_diagnostica TEXT,
    conduta TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE prontuarios IS 'Prontuários médicos dos atendimentos';

-- ==========================================
-- 9. TABELA: prescricoes
-- Receitas médicas
-- ==========================================

CREATE TABLE prescricoes (
    id SERIAL PRIMARY KEY,
    prontuario_id INTEGER REFERENCES prontuarios(id),
    paciente_id INTEGER REFERENCES pacientes(id),
    profissional_id INTEGER REFERENCES profissionais_saude(id),
    medicamento VARCHAR(255) NOT NULL,
    dosagem VARCHAR(100),
    frequencia VARCHAR(100),
    duracao VARCHAR(100),
    orientacoes TEXT,
    data_prescricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validade DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE prescricoes IS 'Prescrições médicas digitais';

-- ==========================================
-- 10. TABELA: exames
-- Solicitações e resultados de exames
-- ==========================================

CREATE TABLE exames (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    profissional_solicitante_id INTEGER REFERENCES profissionais_saude(id),
    tipo tipo_exame NOT NULL,
    nome VARCHAR(255) NOT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_realizacao TIMESTAMP,
    resultado TEXT,
    arquivo_resultado TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE exames IS 'Solicitações e resultados de exames laboratoriais e de imagem';

-- ==========================================
-- 11. TABELA: internacoes
-- Controle de internações
-- ==========================================

CREATE TABLE internacoes (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES pacientes(id),
    leito_id INTEGER REFERENCES leitos(id),
    medico_responsavel_id INTEGER REFERENCES profissionais_saude(id),
    data_entrada TIMESTAMP NOT NULL,
    data_saida TIMESTAMP,
    motivo_internacao TEXT,
    diagnostico TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE internacoes IS 'Registro de internações hospitalares';

-- ==========================================
-- 12. TABELA: logs_auditoria
-- Rastreamento de ações (LGPD)
-- ==========================================

CREATE TABLE logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id INTEGER,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_origem VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE logs_auditoria IS 'Logs de auditoria para conformidade com LGPD';
COMMENT ON COLUMN logs_auditoria.dados_anteriores IS 'Estado anterior do registro (para updates)';
COMMENT ON COLUMN logs_auditoria.dados_novos IS 'Estado novo do registro';

-- ==========================================
-- 13. ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices na tabela usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);

-- Índices na tabela pacientes
CREATE INDEX idx_pacientes_prontuario ON pacientes(numero_prontuario);

-- Índices na tabela consultas
CREATE INDEX idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX idx_consultas_profissional ON consultas(profissional_id);
CREATE INDEX idx_consultas_data ON consultas(data_hora);

-- Índices na tabela prontuarios
CREATE INDEX idx_prontuarios_paciente ON prontuarios(paciente_id);

-- Índices na tabela prescricoes
CREATE INDEX idx_prescricoes_paciente ON prescricoes(paciente_id);

-- Índices na tabela exames
CREATE INDEX idx_exames_paciente ON exames(paciente_id);

-- Índices na tabela logs_auditoria
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_data ON logs_auditoria(criado_em);

-- ==========================================
-- 14. CONSULTAS ÚTEIS
-- ==========================================

-- Listar todos os pacientes com suas consultas
-- SELECT 
--     u.nome,
--     p.numero_prontuario,
--     COUNT(c.id) as total_consultas
-- FROM usuarios u
-- INNER JOIN pacientes p ON p.usuario_id = u.id
-- LEFT JOIN consultas c ON c.paciente_id = p.id
-- GROUP BY u.nome, p.numero_prontuario;

-- Listar consultas agendadas para hoje
-- SELECT 
--     c.data_hora,
--     pac.nome as paciente,
--     prof.nome as medico,
--     c.tipo,
--     c.status
-- FROM consultas c
-- INNER JOIN pacientes p ON p.id = c.paciente_id
-- INNER JOIN usuarios pac ON pac.id = p.usuario_id
-- INNER JOIN profissionais_saude ps ON ps.id = c.profissional_id
-- INNER JOIN usuarios prof ON prof.id = ps.usuario_id
-- WHERE DATE(c.data_hora) = CURRENT_DATE
-- ORDER BY c.data_hora;

-- Verificar logs de auditoria de um paciente
-- SELECT 
--     la.acao,
--     la.tabela_afetada,
--     la.criado_em,
--     u.nome as usuario
-- FROM logs_auditoria la
-- INNER JOIN usuarios u ON u.id = la.usuario_id
-- WHERE la.tabela_afetada = 'pacientes'
-- ORDER BY la.criado_em DESC
-- LIMIT 50;

-- ==========================================
-- FIM DO SCHEMA
-- ==========================================
