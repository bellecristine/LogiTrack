// ==========================================
// TESTE DE CONFIGURAÇÃO FIREBASE
// ==========================================

require('dotenv').config({ path: './config.env' });

console.log('🔥 TESTANDO CONFIGURAÇÃO FIREBASE...\n');

// Verificar se as variáveis estão definidas
const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
];

console.log('📋 VERIFICANDO VARIÁVEIS DE AMBIENTE:');
let missingVars = [];

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: NÃO DEFINIDA`);
        missingVars.push(varName);
    } else {
        // Mostrar apenas os primeiros caracteres para segurança
        const displayValue = varName.includes('KEY') ? 
            value.substring(0, 20) + '...' : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
});

if (missingVars.length > 0) {
    console.log('\n❌ ERRO: Variáveis faltando no config.env:');
    missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
    });
    console.log('\n📖 Consulte o arquivo FIREBASE_SETUP.md para instruções completas.');
    process.exit(1);
}

// Testar inicialização do Firebase Admin
console.log('\n🔧 TESTANDO INICIALIZAÇÃO DO FIREBASE ADMIN...');

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

    console.log('✅ Firebase Admin inicializado com sucesso!');
    
    // Testar acesso ao Messaging
    const messaging = admin.messaging();
    console.log('✅ Firebase Messaging acessível!');
    
    console.log('\n🎉 CONFIGURAÇÃO FIREBASE ESTÁ CORRETA!');
    console.log('\n📱 PRÓXIMOS PASSOS:');
    console.log('1. Execute: npm start');
    console.log('2. Teste o endpoint: POST /api/notifications/trigger');
    console.log('3. Integre com o app mobile quando necessário');
    
} catch (error) {
    console.log('❌ ERRO na configuração do Firebase:');
    console.log('   ', error.message);
    
    if (error.message.includes('private_key')) {
        console.log('\n💡 DICA: Verifique se a FIREBASE_PRIVATE_KEY está entre aspas duplas no config.env');
        console.log('   Exemplo: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    }
    
    if (error.message.includes('project_id')) {
        console.log('\n💡 DICA: Verifique se o FIREBASE_PROJECT_ID está correto');
    }
    
    console.log('\n📖 Consulte o arquivo FIREBASE_SETUP.md para instruções completas.');
    process.exit(1);
} 