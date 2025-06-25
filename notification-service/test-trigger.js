require('dotenv').config({ path: './config.env' });
const axios = require('axios');

async function testNotificationTrigger() {
  console.log('🧪 Testando Trigger de Notificação via API Gateway...\n');

  const baseURL = 'http://localhost:3003';

  try {
    // 1. Testar Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('📊 Serviços:', healthResponse.data.features);
    console.log('');

    // 2. Testar Trigger de Notificação Push
    console.log('2️⃣ Testando Trigger de Notificação Push...');
    const pushNotificationPayload = {
      type: 'delivery_update',
      recipients: {
        userTypes: ['driver', 'client'],
        topics: ['general_notifications', 'driver_notifications']
      },
      content: {
        title: '📦 Atualização de Entrega - LogiTrack',
        body: 'Sua entrega #12345 está a caminho! Previsão de chegada: 15 minutos.',
        imageUrl: 'https://via.placeholder.com/300x200/2196F3/ffffff?text=LogiTrack',
        actionUrl: 'https://app.logitrack.com/delivery/12345',
        actionText: 'Acompanhar Entrega'
      },
      channels: {
        push: true,
        email: false,
        websocket: false
      },
      priority: 'high',
      metadata: {
        deliveryId: '12345',
        driverId: 'driver_001',
        clientId: 'client_001',
        estimatedArrival: '2025-01-25T20:30:00Z'
      }
    };

    const pushResponse = await axios.post(`${baseURL}/api/notifications/trigger`, pushNotificationPayload);
    console.log('✅ Push Notification enviada!');
    console.log('📊 Resultado:', pushResponse.data.data.summary);
    console.log('🆔 Notification ID:', pushResponse.data.data.notificationId);
    console.log('');

    // 3. Testar Trigger de Notificação Email + Push
    console.log('3️⃣ Testando Trigger de Notificação Email + Push...');
    const multiChannelPayload = {
      type: 'promotion',
      recipients: {
        emails: ['hppeixoto15@gmail.com'], // Seu email para teste
        topics: ['general_notifications']
      },
      content: {
        title: '🎉 Promoção Especial LogiTrack!',
        body: 'Aproveite 50% de desconto na primeira entrega! Válido até amanhã.',
        imageUrl: 'https://via.placeholder.com/400x200/4CAF50/ffffff?text=Promocao+50%25',
        actionUrl: 'https://app.logitrack.com/promo/50off',
        actionText: 'Aproveitar Oferta'
      },
      channels: {
        push: true,
        email: true,
        websocket: false
      },
      priority: 'normal',
      metadata: {
        campaignId: 'promo_001',
        discount: 50,
        validUntil: '2025-01-26T23:59:59Z'
      }
    };

    const multiResponse = await axios.post(`${baseURL}/api/notifications/trigger`, multiChannelPayload);
    console.log('✅ Notificação Multi-canal enviada!');
    console.log('📊 Resultado:', multiResponse.data.data.summary);
    console.log('📧 Email:', multiResponse.data.data.results.email);
    console.log('📱 Push:', multiResponse.data.data.results.push);
    console.log('');

    // 4. Testar Registro de Dispositivo (simulado)
    console.log('4️⃣ Testando Registro de Dispositivo...');
    const devicePayload = {
      token: 'fake_fcm_token_' + Math.random().toString(36).substr(2, 20),
      userId: 'user_test_001',
      userType: 'driver',
      platform: 'android',
      deviceInfo: {
        model: 'Samsung Galaxy S21',
        brand: 'Samsung',
        version: '12.0',
        appVersion: '1.0.0'
      }
    };

    const deviceResponse = await axios.post(`${baseURL}/api/notifications/register-device`, devicePayload);
    console.log('✅ Dispositivo registrado!');
    console.log('🆔 Device ID:', deviceResponse.data.data.deviceId);
    console.log('📋 Tópicos:', deviceResponse.data.data.subscribedTopics);
    console.log('');

    // 5. Testar Estatísticas
    console.log('5️⃣ Testando Estatísticas...');
    const statsResponse = await axios.get(`${baseURL}/api/notifications/stats`);
    console.log('✅ Estatísticas obtidas!');
    console.log('📊 Notificações:', statsResponse.data.data.notifications);
    console.log('📱 Dispositivos:', statsResponse.data.data.devices);
    console.log('');

    // 6. Testar Histórico
    console.log('6️⃣ Testando Histórico...');
    const historyResponse = await axios.get(`${baseURL}/api/notifications/history?limit=5`);
    console.log('✅ Histórico obtido!');
    console.log('📋 Total de notificações:', historyResponse.data.data.pagination.total);
    console.log('📄 Últimas 5:', historyResponse.data.data.notifications.length);
    console.log('');

    // 7. Testar Endpoint de Teste
    console.log('7️⃣ Testando Endpoint de Teste...');
    const testResponse = await axios.post(`${baseURL}/api/notifications/test`, {
      message: 'Teste automatizado do trigger de notificação! 🚀'
    });
    console.log('✅ Teste executado!');
    console.log('📊 Resultado:', testResponse.data.data?.summary || 'Teste concluído');
    console.log('');

    console.log('🎉 Todos os testes foram executados com sucesso!');
    console.log('');
    console.log('📋 Resumo dos Endpoints Testados:');
    console.log('   ✅ GET  /health');
    console.log('   ✅ POST /api/notifications/trigger');
    console.log('   ✅ POST /api/notifications/register-device');
    console.log('   ✅ GET  /api/notifications/stats');
    console.log('   ✅ GET  /api/notifications/history');
    console.log('   ✅ POST /api/notifications/test');
    console.log('');
    console.log('🔗 Para usar via API Gateway, configure o proxy para:');
    console.log('   http://localhost:3003/api/notifications/*');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Dados:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('');
    console.log('🔍 Verifique se:');
    console.log('   1. O notification-service está rodando na porta 3003');
    console.log('   2. O MongoDB Atlas está conectado');
    console.log('   3. As configurações estão corretas no config.env');
    console.log('');
    console.log('💡 Para iniciar o serviço:');
    console.log('   cd notification-service && npm start');
  }
}

// Executar teste
if (require.main === module) {
  testNotificationTrigger();
}

module.exports = testNotificationTrigger; 