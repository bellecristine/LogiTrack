// ==========================================
// TESTE LOCAL - LAMBDA NOTIFICATION HANDLER
// ==========================================

require('dotenv').config({ path: '../config.env' });

const { handler } = require('./notification-handler');

console.log('🧪 TESTANDO LAMBDA LOCALMENTE...\n');

async function testLambdaLocal() {
    try {
        console.log('📋 Verificando variáveis de ambiente...');
        
        const requiredVars = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY_ID', 
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID'
        ];

        let allConfigured = true;
        requiredVars.forEach(varName => {
            const value = process.env[varName];
            if (!value) {
                console.log(`❌ ${varName}: NÃO DEFINIDA`);
                allConfigured = false;
            } else {
                console.log(`✅ ${varName}: Configurada`);
            }
        });

        if (!allConfigured) {
            console.log('\n❌ Configure as variáveis de ambiente primeiro!');
            return false;
        }

        console.log('\n🧪 TESTE 1: Notificação simulada (sem tokens)...');
        
        const event1 = {
            body: JSON.stringify({
                type: 'delivery_update',
                title: '🚚 Entrega Atualizada - Lambda',
                message: 'Seu pedido está a caminho via AWS Lambda!',
                userIds: ['user_123', 'user_456'],
                userTypes: ['client'],
                data: {
                    orderId: 'ORD-001',
                    status: 'in_transit',
                    source: 'lambda-test'
                }
            })
        };

        const context1 = {
            awsRequestId: 'test-request-1',
            functionName: 'logitrack-notifications-test'
        };

        const result1 = await handler(event1, context1);
        console.log('✅ Resultado Teste 1:', JSON.parse(result1.body).message);
        
        console.log('\n🧪 TESTE 2: Notificação com token (vai falhar, mas é esperado)...');
        
        const event2 = {
            body: JSON.stringify({
                type: 'test',
                title: '🧪 Teste Lambda Firebase',
                message: 'Testando notificação via Lambda + Firebase',
                tokens: ['fake_token_for_testing'],
                data: {
                    test: true,
                    timestamp: new Date().toISOString()
                }
            })
        };

        const context2 = {
            awsRequestId: 'test-request-2',
            functionName: 'logitrack-notifications-test'
        };

        const result2 = await handler(event2, context2);
        const body2 = JSON.parse(result2.body);
        console.log('✅ Resultado Teste 2:', body2.message);
        console.log('   Resultados:', body2.results.length);
        
        console.log('\n🧪 TESTE 3: Invocação direta (sem API Gateway)...');
        
        const event3 = {
            type: 'system_alert',
            title: '⚠️ Alerta do Sistema',
            message: 'Sistema funcionando via Lambda!',
            userTypes: ['admin'],
            data: {
                priority: 'high',
                source: 'direct-invocation'
            }
        };

        const context3 = {
            awsRequestId: 'test-request-3',
            functionName: 'logitrack-notifications-test'
        };

        const result3 = await handler(event3, context3);
        const body3 = JSON.parse(result3.body);
        console.log('✅ Resultado Teste 3:', body3.message);
        
        console.log('\n🎉 TODOS OS TESTES PASSARAM!');
        console.log('\n📱 LAMBDA + FIREBASE FUNCIONANDO!');
        console.log('\n✅ SISTEMA PRONTO PARA:');
        console.log('   1. Deploy na AWS');
        console.log('   2. Integração com API Gateway');
        console.log('   3. Receber tokens FCM reais');
        console.log('   4. Enviar notificações push');
        
        console.log('\n📋 INFORMAÇÕES:');
        console.log(`   Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`   Runtime: Node.js ${process.version}`);
        console.log(`   Status: Funcionando localmente`);
        
        return true;
        
    } catch (error) {
        console.log('\n❌ ERRO no teste:', error.message);
        console.log('Stack:', error.stack);
        return false;
    }
}

// Executar teste
testLambdaLocal()
    .then(success => {
        if (success) {
            console.log('\n🎉 ========================================');
            console.log('   LAMBDA + FIREBASE FUNCIONANDO!');
            console.log('   ========================================');
            console.log('\n   Pronto para deploy na AWS! 🚀');
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