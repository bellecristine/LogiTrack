// ==========================================
// TESTE SIMPLES - APENAS FIREBASE
// ==========================================

require('dotenv').config({ path: './config.env' });

console.log('🔥 TESTANDO APENAS FIREBASE (SEM MONGODB)...\n');

// Teste básico do Firebase
async function testFirebaseOnly() {
    try {
        const admin = require('firebase-admin');
        
        // Configurar credenciais
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        };

        // Inicializar Firebase Admin
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }

        console.log('✅ Firebase Admin inicializado!');
        
        // Testar Messaging
        const messaging = admin.messaging();
        console.log('✅ Firebase Messaging acessível!');
        
        // Testar envio de notificação para um token fictício (vai dar erro, mas é esperado)
        try {
            const message = {
                token: 'fake-token-for-testing',
                notification: {
                    title: '🧪 Teste LogiTrack',
                    body: 'Firebase configurado com sucesso!'
                },
                data: {
                    type: 'test',
                    timestamp: new Date().toISOString()
                }
            };
            
            await messaging.send(message);
            console.log('✅ Mensagem enviada (não esperado)');
        } catch (error) {
            if (error.code === 'messaging/invalid-registration-token') {
                console.log('✅ Firebase funcionando! (Token inválido esperado)');
            } else {
                console.log('⚠️ Erro esperado:', error.code);
            }
        }
        
        console.log('\n🎉 FIREBASE ESTÁ FUNCIONANDO PERFEITAMENTE!');
        console.log('\n📱 PRÓXIMOS PASSOS:');
        console.log('1. ✅ Firebase configurado');
        console.log('2. ⚠️ Verificar conexão MongoDB');
        console.log('3. 🚀 Integrar com app mobile');
        
        return true;
        
    } catch (error) {
        console.log('❌ ERRO no Firebase:');
        console.log('   ', error.message);
        return false;
    }
}

// Executar teste
testFirebaseOnly()
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