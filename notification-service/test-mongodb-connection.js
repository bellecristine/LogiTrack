// ==========================================
// TESTE DE CONEXÃO MONGODB
// ==========================================

require('dotenv').config({ path: './config.env' });

console.log('🔗 TESTANDO CONEXÃO MONGODB...\n');

async function testMongoConnection() {
    try {
        console.log('📋 Configurações:');
        console.log('   MONGODB_URI:', process.env.MONGODB_URI ? 'Definida' : 'NÃO DEFINIDA');
        
        if (!process.env.MONGODB_URI) {
            console.log('❌ MONGODB_URI não está definida no config.env');
            return false;
        }
        
        // Mostrar parte da URI (sem senha)
        const uriParts = process.env.MONGODB_URI.split('@');
        if (uriParts.length > 1) {
            console.log('   Host:', uriParts[1]);
        }
        
        console.log('\n🔧 Tentando conectar...');
        
        const mongoose = require('mongoose');
        
        // Configurações de conexão mais permissivas
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // 10 segundos
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        };
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        
        console.log('✅ Conectado ao MongoDB!');
        console.log('   Host:', conn.connection.host);
        console.log('   Database:', conn.connection.name);
        console.log('   Estado:', conn.connection.readyState);
        
        // Testar operação básica
        console.log('\n🧪 Testando operação básica...');
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('✅ Operação bem-sucedida!');
        console.log('   Collections:', collections.length);
        
        // Fechar conexão
        await mongoose.connection.close();
        console.log('✅ Conexão fechada');
        
        console.log('\n🎉 MONGODB ESTÁ FUNCIONANDO!');
        return true;
        
    } catch (error) {
        console.log('\n❌ ERRO na conexão MongoDB:');
        console.log('   Código:', error.code || 'N/A');
        console.log('   Mensagem:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
            console.log('   1. Verificar se o IP está na whitelist do MongoDB Atlas');
            console.log('   2. Verificar conectividade com a internet');
            console.log('   3. Verificar se as credenciais estão corretas');
        }
        
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 PROBLEMA DE AUTENTICAÇÃO:');
            console.log('   1. Verificar usuário e senha');
            console.log('   2. Verificar se o usuário tem permissões no database');
        }
        
        return false;
    }
}

// Executar teste
testMongoConnection()
    .then(success => {
        if (success) {
            console.log('\n✅ TESTE MONGODB CONCLUÍDO COM SUCESSO!');
            process.exit(0);
        } else {
            console.log('\n❌ TESTE MONGODB FALHOU!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.log('\n💥 ERRO INESPERADO:', error.message);
        process.exit(1);
    }); 