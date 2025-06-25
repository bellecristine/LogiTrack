// ==========================================
// AWS LAMBDA - NOTIFICATION HANDLER
// LogiTrack Push Notifications via Firebase
// ==========================================

const admin = require('firebase-admin');

// Inicializar Firebase Admin (uma vez por container Lambda)
let firebaseApp = null;

const initializeFirebase = () => {
    if (!firebaseApp) {
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

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });
        
        console.log('✅ Firebase Admin inicializado no Lambda');
    }
    return firebaseApp;
};

// Handler principal da Lambda
exports.handler = async (event, context) => {
    console.log('📱 Lambda Notification Handler iniciado');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Inicializar Firebase
        initializeFirebase();
        const messaging = admin.messaging();
        
        // Parse do body se vier do API Gateway
        let body;
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            body = event; // Invocação direta
        }
        
        const { 
            type, 
            title, 
            message: bodyText, 
            body: bodyMessage,
            data = {}, 
            userIds = [], 
            userTypes = [],
            tokens = []
        } = body;
        
        // Usar 'message' ou 'body' para o texto
        const notificationBody = bodyText || bodyMessage;
        
        console.log('📨 Processando notificação:', { type, title, tokens: tokens.length });
        
        // Validação
        if (!title || !notificationBody) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Title e body/message são obrigatórios',
                    timestamp: new Date().toISOString()
                })
            };
        }
        
        const results = [];
        
        if (tokens && tokens.length > 0) {
            // Enviar para tokens específicos
            console.log(`📤 Enviando para ${tokens.length} tokens`);
            
            for (const token of tokens) {
                try {
                    const message = {
                        token: token,
                        notification: {
                            title: title,
                            body: notificationBody
                        },
                        data: {
                            type: type || 'general',
                            timestamp: new Date().toISOString(),
                            source: 'lambda',
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
                        error: error.message,
                        code: error.code
                    });
                    console.log('❌ Erro ao enviar para token:', token, error.message);
                }
            }
        } else {
            // Simular envio para userIds/userTypes (sem tokens reais)
            console.log('📝 Simulando envio para:', { userIds, userTypes });
            results.push({
                simulation: true,
                message: 'Envio simulado - tokens reais necessários para envio efetivo',
                userIds,
                userTypes,
                note: 'Integre com banco de dados para obter tokens dos usuários'
            });
        }
        
        // Resposta de sucesso
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'Notificação processada via Lambda',
                type: type,
                title: title,
                body: notificationBody,
                results: results,
                lambda: {
                    requestId: context.awsRequestId,
                    functionName: context.functionName,
                    region: process.env.AWS_REGION
                },
                firebase: {
                    project: process.env.FIREBASE_PROJECT_ID
                },
                timestamp: new Date().toISOString()
            })
        };
        
        console.log('✅ Resposta Lambda:', response.statusCode);
        return response;
        
    } catch (error) {
        console.error('❌ Erro na Lambda:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                lambda: {
                    requestId: context.awsRequestId,
                    functionName: context.functionName
                },
                timestamp: new Date().toISOString()
            })
        };
    }
}; 