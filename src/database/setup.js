const db = require('../config/database');
const logger = require('../config/logger');

async function setupDatabase() {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    logger.info('🔧 Iniciando setup do banco de dados...');

    // ==========================================
    // 1. TIPOS ENUMERADOS
    // ==========================================
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_usuario AS ENUM ('PACIENTE', 'MEDICO', 'ENFERMEIRO', 'TECNICO', 'ADMINISTRADOR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE status_consulta AS ENUM ('AGENDADA', 'CONFIRMADA', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA', 'FALTOU');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_consulta AS ENUM ('PRESENCIAL', 'TELEMEDICINA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE status_leito AS ENUM ('DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'RESERVADO');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tipo_exame AS ENUM ('SANGUE', 'URINA', 'IMAGEM', 'CARDIOLOGICO', 'OUTROS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // ==========================================
    // 2. TABELA: usuarios
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
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
    `);

    logger.info('✅ Tabela usuarios criada');

    // ==========================================
    // 3. TABELA: pacientes
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
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
    `);

    logger.info('✅ Tabela pacientes criada');

    // ==========================================
    // 4. TABELA: profissionais_saude
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS profissionais_saude (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        especialidade VARCHAR(100),
        registro_profissional VARCHAR(50) UNIQUE NOT NULL,
        conselho VARCHAR(20),
        disponibilidade JSONB,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    logger.info('✅ Tabela profissionais_saude criada');

    // ==========================================
    // 5. TABELA: unidades_hospitalares
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS unidades_hospitalares (
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
    `);

    logger.info('✅ Tabela unidades_hospitalares criada');

    // ==========================================
    // 6. TABELA: leitos
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS leitos (
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
    `);

    logger.info('✅ Tabela leitos criada');

    // ==========================================
    // 7. TABELA: consultas
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultas (
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
    `);

    logger.info('✅ Tabela consultas criada');

    // ==========================================
    // 8. TABELA: prontuarios
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS prontuarios (
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
    `);

    logger.info('✅ Tabela prontuarios criada');

    // ==========================================
    // 9. TABELA: prescricoes
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescricoes (
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
    `);

    logger.info('✅ Tabela prescricoes criada');

    // ==========================================
    // 10. TABELA: exames
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS exames (
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
    `);

    logger.info('✅ Tabela exames criada');

    // ==========================================
    // 11. TABELA: internacoes
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS internacoes (
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
    `);

    logger.info('✅ Tabela internacoes criada');

    // ==========================================
    // 12. TABELA: logs_auditoria (LGPD)
    // ==========================================
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs_auditoria (
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
    `);

    logger.info('✅ Tabela logs_auditoria criada');

    // ==========================================
    // 13. ÍNDICES PARA PERFORMANCE
    // ==========================================
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios(cpf);
      CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
      CREATE INDEX IF NOT EXISTS idx_pacientes_prontuario ON pacientes(numero_prontuario);
      CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_consultas_profissional ON consultas(profissional_id);
      CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas(data_hora);
      CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_prescricoes_paciente ON prescricoes(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_exames_paciente ON exames(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_auditoria(criado_em);
    `);

    logger.info('✅ Índices criados');

    await client.query('COMMIT');
    logger.info('🎉 Setup do banco de dados concluído com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Erro ao criar banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Banco de dados configurado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
