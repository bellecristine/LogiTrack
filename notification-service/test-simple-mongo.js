// ==========================================
// TESTE SIMPLES MONGODB - NOVA CONEXÃO
// ==========================================

const mongoose = require('mongoose');

console.log('🔗 TESTE SIMPLES MONGODB...\n');

async function testSimpleMongo() {
    try {
        // Vamos testar com uma nova string de conexão
        // Você precisa criar um novo cluster no MongoDB Atlas
        console.log('💡 INSTRUÇÕES:');
        console.log('1. Acesse: https://cloud.mongodb.com/');
        console.log('2. Crie um novo cluster (se não tiver)');
        console.log('3. Vá em "Connect" → "Connect your application"');
        console.log('4. Copie a string de conexão');
        console.log('5. Substitua <password> pela senha real');
        console.log('6. Adicione o nome do database no final');
        console.log('');
        
        console.log('📋 EXEMPLO DA STRING CORRETA:');
        console.log('mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/logitrack_notifications?retryWrites=true&w=majority');
        console.log('');
        
        console.log('❌ STRING ATUAL (não funciona):');
        console.log('mongodb+srv://logitrack:VKLXhZkwOlvQjGD2@cluster0.hnxrp.mongodb.net/logitrack_notifications?retryWrites=true&w=majority&appName=Cluster0');
        console.log('');
        
        console.log('🔧 PARA CORRIGIR:');
        console.log('1. Crie um novo cluster no MongoDB Atlas');
        console.log('2. Atualize a MONGODB_URI no config.env');
        console.log('3. Execute este teste novamente');
        console.log('');
        
        return false;
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
        return false;
    }
}

// Executar teste
testSimpleMongo(); 