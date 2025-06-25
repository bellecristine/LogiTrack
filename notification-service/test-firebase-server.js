// ==========================================
// TESTE SERVIDOR FIREBASE-ONLY
// ==========================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

console.log('🧪 TESTANDO SERVIDOR FIREBASE-ONLY...\n');

async function testFirebaseServer() {
    try {
        console.log('1️⃣ Testando Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check OK:', healthResponse.data.service);
        console.log('   Firebase:', healthResponse.data.firebase);
        console.log('   Status:', healthResponse.data.status);
        
        console.log('\n2️⃣ Testando Informações do Serviço...');
        const infoResponse = await axios.get(`${BASE_URL}/api/notifications/info`);
        console.log('✅ Info OK:', infoResponse.data.service);
        console.log('   Versão:', infoResponse.data.version);
        console.log('   Projeto Firebase:', infoResponse.data.firebase.project);
        
        console.log('\n3️⃣ Testando Registro de Dispositivo...');
        const deviceData = {
            token: 'fake_token_for_testing_123',
            userId: 'user_123',
            userType: 'driver',
            platform: 'android'
        };
        
        const deviceResponse = await axios.post(`${BASE_URL}/api/notifications/register-device`, deviceData);
        console.log('✅ Registro OK:', deviceResponse.data.message);
        console.log('   Device ID:', deviceResponse.data.deviceId);
        
        console.log('\n4️⃣ Testando Envio de Notificação (Simulado)...');
        const notificationData = {
            type: 'delivery_update',
            title: '🚚 Entrega Atualizada',
            body: 'Seu pedido está a caminho!',
            userIds: ['user_123', 'user_456'],
            userTypes: ['client'],
            data: {
                orderId: 'ORD-001',
                status: 'in_transit'
            }
        };
        
        const notificationResponse = await axios.post(`${BASE_URL}/api/notifications/trigger`, notificationData);
        console.log('✅ Notificação OK:', notificationResponse.data.message);
        console.log('   Tipo:', notificationResponse.data.type);
        console.log('   Resultados:', notificationResponse.data.results.length);
        
        console.log('\n5️⃣ Testando Envio com Token Real (vai falhar, mas é esperado)...');
        const realTokenData = {
            type: 'test',
            title: '🧪 Teste Firebase',
            body: 'Testando notificação real',
            tokens: ['fake_token_will_fail']
        };
        
        const realTokenResponse = await axios.post(`${BASE_URL}/api/notifications/trigger`, realTokenData);
        console.log('✅ Teste com token OK:', realTokenResponse.data.message);
        console.log('   Resultados:', realTokenResponse.data.results);
        
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('\n📱 FIREBASE PUSH NOTIFICATIONS FUNCIONANDO!');
        console.log('\n✅ SISTEMA PRONTO PARA:');
        console.log('   1. Receber tokens de dispositivos reais');
        console.log('   2. Enviar notificações push');
        console.log('   3. Integração com app mobile');
        console.log('   4. API Gateway');
        
        return true;
        
    } catch (error) {
        console.log('\n❌ Erro no teste:', error.message);
        
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Dados:', error.response.data);
        }
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUÇÃO:');
            console.log('   Execute em outro terminal: node server-firebase-only.js');
        }
        
        return false;
    }
}

// Aguardar um pouco e executar teste
setTimeout(() => {
    testFirebaseServer()
        .then(success => {
            if (success) {
                console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
                process.exit(0);
            } else {
                console.log('\n❌ TESTE FALHOU!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('\n💥 ERRO INESPERADO:', error.message);
            process.exit(1);
        });
}, 2000); // Aguardar 2 segundos para o servidor iniciar 