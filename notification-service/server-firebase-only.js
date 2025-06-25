// ==========================================
// SERVIDOR FIREBASE-ONLY - LOGITRACK
// ==========================================

require('dotenv').config({ path: './config.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Inicializar Firebase Admin
const admin = require('firebase-admin');

console.log('🔥 Inicializando LogiTrack Notification Service (Firebase Only)...\n');

// Configurar Firebase
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

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

const messaging = admin.messaging();
console.log('✅ Firebase Admin inicializado!');

// Configurar Express
const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'LogiTrack Notification Service (Firebase Only)',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        firebase: 'connected',
        uptime: process.uptime()
    });
});

// Rota principal de notificações
app.post('/api/notifications/trigger', async (req, res) => {
    try {
        const { 
            type, 
            title, 
            body, 
            data = {}, 
            userIds = [], 
            userTypes = [],
            tokens = []
        } = req.body;

        console.log('📱 Recebida solicitação de notificação:', { type, title, userIds, userTypes, tokens });

        // Validação básica
        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Title e body são obrigatórios'
            });
        }

        // Para teste, vamos simular o envio
        const results = [];
        
        if (tokens && tokens.length > 0) {
            // Enviar para tokens específicos
            for (const token of tokens) {
                try {
                    const message = {
                        token: token,
                        notification: {
                            title: title,
                            body: body
                        },
                        data: {
                            type: type || 'general',
                            timestamp: new Date().toISOString(),
                            ...data
                        },
                        android: {
                            notification: {
                                icon: 'ic_notification',
                                color: '#FF6B35',
                                sound: 'default',
                                channelId: 'logitrack_notifications'
                            }
                        },
                        apns: {
                            payload: {
                                aps: {
                                    badge: 1,
                                    sound: 'default'
                                }
                            }
                        }
                    };

                    const response = await messaging.send(message);
                    results.push({
                        token: token,
                        success: true,
                        messageId: response
                    });
                    console.log('✅ Notificação enviada:', response);
                } catch (error) {
                    results.push({
                        token: token,
                        success: false,
                        error: error.message
                    });
                    console.log('❌ Erro ao enviar para token:', token, error.message);
                }
            }
        } else {
            // Simular envio para userIds/userTypes
            console.log('📝 Simulando envio para:', { userIds, userTypes });
            results.push({
                simulation: true,
                message: 'Envio simulado - tokens reais necessários para envio efetivo',
                userIds,
                userTypes
            });
        }

        res.json({
            success: true,
            message: 'Notificação processada',
            type: type,
            title: title,
            body: body,
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao processar notificação:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Rota para registrar dispositivos (simulada)
app.post('/api/notifications/register-device', async (req, res) => {
    try {
        const { token, userId, userType, platform } = req.body;

        console.log('📱 Registrando dispositivo:', { userId, userType, platform, token: token ? 'presente' : 'ausente' });

        // Validação
        if (!token || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Token e userId são obrigatórios'
            });
        }

        // Simular registro (sem MongoDB)
        res.json({
            success: true,
            message: 'Dispositivo registrado com sucesso (simulado)',
            deviceId: `device_${Date.now()}`,
            userId: userId,
            userType: userType,
            platform: platform,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao registrar dispositivo:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota de informações
app.get('/api/notifications/info', (req, res) => {
    res.json({
        service: 'LogiTrack Notification Service',
        version: '1.0.0 (Firebase Only)',
        features: [
            'Push Notifications via Firebase',
            'Device Registration',
            'Multi-platform Support',
            'Real-time Delivery'
        ],
        endpoints: [
            'POST /api/notifications/trigger',
            'POST /api/notifications/register-device',
            'GET /health',
            'GET /api/notifications/info'
        ],
        firebase: {
            project: process.env.FIREBASE_PROJECT_ID,
            status: 'connected'
        },
        timestamp: new Date().toISOString()
    });
});

// Middleware de erro
app.use((error, req, res, next) => {
    console.error('❌ Erro no servidor:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 LogiTrack Notification Service rodando!`);
    console.log(`   🌐 URL: http://localhost:${PORT}`);
    console.log(`   🔥 Firebase: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   📱 Push Notifications: Ativo`);
    console.log(`   ⏰ Iniciado em: ${new Date().toISOString()}\n`);
    
    console.log('📋 ENDPOINTS DISPONÍVEIS:');
    console.log(`   GET  ${PORT}/health`);
    console.log(`   POST ${PORT}/api/notifications/trigger`);
    console.log(`   POST ${PORT}/api/notifications/register-device`);
    console.log(`   GET  ${PORT}/api/notifications/info\n`);
});

module.exports = app; 