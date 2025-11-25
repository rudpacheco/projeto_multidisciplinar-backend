const bcrypt = require('bcryptjs');
const db = require('../config/database');
const logger = require('../config/logger');

async function seedDatabase() {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    logger.info('🌱 Iniciando seed do banco de dados...');

    // ==========================================
    // 1. CRIAR UNIDADES HOSPITALARES
    // ==========================================
    
    const unidade1 = await client.query(`
      INSERT INTO unidades_hospitalares (nome, tipo, endereco, telefone, email, capacidade_leitos)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Hospital VidaPlus Central', 'Hospital', 'Av. Paulista, 1000 - São Paulo/SP', '11987654321', 'central@vidaplus.com.br', 200]);

    const unidade2 = await client.query(`
      INSERT INTO unidades_hospitalares (nome, tipo, endereco, telefone, email, capacidade_leitos)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['Clínica VidaPlus Jardins', 'Clínica', 'Rua Augusta, 500 - São Paulo/SP', '11987654322', 'jardins@vidaplus.com.br', 50]);

    logger.info('✅ Unidades hospitalares criadas');

    // ==========================================
    // 2. CRIAR ADMINISTRADOR
    // ==========================================
    
    const senhaAdmin = await bcrypt.hash('admin123', 10);
    const admin = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Dr. Admin Sistema', 'admin@vidaplus.com.br', senhaAdmin, 'ADMINISTRADOR', '11111111111', '11999999999', '1980-01-01', 'São Paulo, SP']);

    logger.info('✅ Administrador criado');

    // ==========================================
    // 3. CRIAR MÉDICOS
    // ==========================================
    
    const senhaMedico1 = await bcrypt.hash('medico123', 10);
    const medico1User = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Dr. João Silva', 'joao.silva@vidaplus.com.br', senhaMedico1, 'MEDICO', '22222222222', '11988888888', '1975-05-15', 'São Paulo, SP']);

    await client.query(`
      INSERT INTO profissionais_saude (usuario_id, especialidade, registro_profissional, conselho, disponibilidade)
      VALUES ($1, $2, $3, $4, $5)
    `, [medico1User.rows[0].id, 'Cardiologia', 'CRM123456', 'CRM-SP', JSON.stringify({
      segunda: ['08:00-12:00', '14:00-18:00'],
      terca: ['08:00-12:00', '14:00-18:00'],
      quarta: ['08:00-12:00'],
      quinta: ['08:00-12:00', '14:00-18:00'],
      sexta: ['08:00-12:00']
    })]);

    const senhaMedico2 = await bcrypt.hash('medico123', 10);
    const medico2User = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Dra. Maria Santos', 'maria.santos@vidaplus.com.br', senhaMedico2, 'MEDICO', '33333333333', '11977777777', '1982-08-20', 'São Paulo, SP']);

    await client.query(`
      INSERT INTO profissionais_saude (usuario_id, especialidade, registro_profissional, conselho, disponibilidade)
      VALUES ($1, $2, $3, $4, $5)
    `, [medico2User.rows[0].id, 'Pediatria', 'CRM789012', 'CRM-SP', JSON.stringify({
      segunda: ['09:00-13:00'],
      terca: ['09:00-13:00', '15:00-19:00'],
      quarta: ['09:00-13:00', '15:00-19:00'],
      quinta: ['09:00-13:00'],
      sexta: ['09:00-13:00', '15:00-19:00']
    })]);

    logger.info('✅ Médicos criados');

    // ==========================================
    // 4. CRIAR ENFERMEIROS
    // ==========================================
    
    const senhaEnf = await bcrypt.hash('enfermeiro123', 10);
    const enfUser = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Enf. Ana Costa', 'ana.costa@vidaplus.com.br', senhaEnf, 'ENFERMEIRO', '44444444444', '11966666666', '1990-03-10', 'São Paulo, SP']);

    await client.query(`
      INSERT INTO profissionais_saude (usuario_id, especialidade, registro_profissional, conselho)
      VALUES ($1, $2, $3, $4)
    `, [enfUser.rows[0].id, 'Enfermagem Geral', 'COREN123456', 'COREN-SP']);

    logger.info('✅ Enfermeiros criados');

    // ==========================================
    // 5. CRIAR PACIENTES
    // ==========================================
    
    const senhaPac1 = await bcrypt.hash('paciente123', 10);
    const pac1User = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Carlos Oliveira', 'carlos.oliveira@email.com', senhaPac1, 'PACIENTE', '55555555555', '11955555555', '1985-12-25', 'Rua das Flores, 123 - São Paulo/SP']);

    await client.query(`
      INSERT INTO pacientes (usuario_id, numero_prontuario, tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [pac1User.rows[0].id, 'PRONT001', 'O+', 'Nenhuma alergia conhecida', 'Hipertensão', 'Maria Oliveira', '11944444444', 'Unimed', 'UNI123456789']);

    const senhaPac2 = await bcrypt.hash('paciente123', 10);
    const pac2User = await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, tipo, cpf, telefone, data_nascimento, endereco)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['Paula Mendes', 'paula.mendes@email.com', senhaPac2, 'PACIENTE', '66666666666', '11933333333', '1992-07-18', 'Av. Rebouças, 456 - São Paulo/SP']);

    await client.query(`
      INSERT INTO pacientes (usuario_id, numero_prontuario, tipo_sanguineo, alergias, condicoes_preexistentes, contato_emergencia, telefone_emergencia, plano_saude, numero_carteirinha)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [pac2User.rows[0].id, 'PRONT002', 'A+', 'Penicilina', 'Asma', 'João Mendes', '11922222222', 'SulAmérica', 'SUL987654321']);

    logger.info('✅ Pacientes criados');

    // ==========================================
    // 6. CRIAR LEITOS
    // ==========================================
    
    for (let i = 1; i <= 10; i++) {
      await client.query(`
        INSERT INTO leitos (unidade_id, numero, andar, setor, tipo, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [unidade1.rows[0].id, `L${i.toString().padStart(3, '0')}`, '1º Andar', 'Clínica Médica', 'Enfermaria', i <= 7 ? 'DISPONIVEL' : 'OCUPADO']);
    }

    logger.info('✅ Leitos criados');

    await client.query('COMMIT');
    logger.info('🎉 Seed do banco de dados concluído com sucesso!');
    
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('==========================================');
    console.log('👤 ADMINISTRADOR:');
    console.log('   Email: admin@vidaplus.com.br');
    console.log('   Senha: admin123\n');
    console.log('👨‍⚕️ MÉDICO (Cardiologia):');
    console.log('   Email: joao.silva@vidaplus.com.br');
    console.log('   Senha: medico123\n');
    console.log('👩‍⚕️ MÉDICA (Pediatria):');
    console.log('   Email: maria.santos@vidaplus.com.br');
    console.log('   Senha: medico123\n');
    console.log('👨‍⚕️ ENFERMEIRA:');
    console.log('   Email: ana.costa@vidaplus.com.br');
    console.log('   Senha: enfermeiro123\n');
    console.log('🧑 PACIENTE 1:');
    console.log('   Email: carlos.oliveira@email.com');
    console.log('   Senha: paciente123\n');
    console.log('🧑 PACIENTE 2:');
    console.log('   Email: paula.mendes@email.com');
    console.log('   Senha: paciente123\n');
    console.log('==========================================');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Dados de exemplo inseridos com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
