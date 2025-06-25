const axios = require('axios');

async function testEmailNotification() {
  try {
    console.log('🚀 Testando envio de e-mail de notificação...');
    
    // Dados do e-mail de teste
    const emailData = {
      to: 'hppeixoto15@gmail.com', // Seu e-mail para teste
      subject: '🎉 Teste de Notificação - LogiTrack',
      template: 'notification',
      templateData: {
        title: 'Teste de Notificação',
        message: 'Este é um e-mail de teste do sistema de notificações LogiTrack! Se você está recebendo este e-mail, significa que o serviço está funcionando perfeitamente! 🚀',
        actionUrl: 'https://github.com',
        actionText: 'Ver no GitHub'
      },
      priority: 'normal'
    };

    // Enviar requisição para o serviço
    const response = await axios.post('http://localhost:3003/api/notifications/email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ E-mail enviado com sucesso!');
    console.log('📊 Resposta:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Erro: Serviço não está rodando na porta 3003');
      console.log('💡 Execute: npm start (no diretório notification-service)');
    } else if (error.response) {
      console.log('❌ Erro na resposta:', error.response.status);
      console.log('📝 Dados:', error.response.data);
    } else {
      console.log('❌ Erro:', error.message);
    }
  }
}

// Teste de e-mail de entrega
async function testDeliveryEmail() {
  try {
    console.log('🚚 Testando e-mail de atualização de entrega...');
    
    const emailData = {
      to: 'hppeixoto15@gmail.com',
      subject: '📦 Atualização de Entrega - Pedido #12345',
      template: 'delivery-update',
      templateData: {
        customerName: 'João Silva',
        status: 'Em Trânsito',
        trackingCode: 'LT123456789BR',
        currentLocation: 'São Paulo - SP',
        estimatedDelivery: '25/06/2025 às 14:00',
        trackingUrl: 'http://localhost:3000/tracking/LT123456789BR'
      },
      priority: 'high'
    };

    const response = await axios.post('http://localhost:3003/api/notifications/email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ E-mail de entrega enviado com sucesso!');
    console.log('📊 Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ Erro ao enviar e-mail de entrega:', error.message);
  }
}

// Teste de e-mail de boas-vindas
async function testWelcomeEmail() {
  try {
    console.log('👋 Testando e-mail de boas-vindas...');
    
    const emailData = {
      to: 'hppeixoto15@gmail.com',
      subject: '🎉 Bem-vindo ao LogiTrack!',
      template: 'welcome',
      templateData: {
        userName: 'João Silva',
        dashboardUrl: 'http://localhost:3000/dashboard'
      },
      priority: 'normal'
    };

    const response = await axios.post('http://localhost:3003/api/notifications/email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ E-mail de boas-vindas enviado com sucesso!');
    console.log('📊 Resposta:', response.data);
    
  } catch (error) {
    console.log('❌ Erro ao enviar e-mail de boas-vindas:', error.message);
  }
}

// Função principal
async function runTests() {
  console.log('🧪 Iniciando testes de e-mail do LogiTrack...\n');
  
  // Teste 1: Notificação simples
  await testEmailNotification();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Aguardar um pouco entre os testes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: E-mail de entrega
  await testDeliveryEmail();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Aguardar um pouco entre os testes
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 3: E-mail de boas-vindas
  await testWelcomeEmail();
  
  console.log('\n🎯 Testes concluídos! Verifique sua caixa de entrada.');
}

// Executar testes
runTests().catch(console.error); 