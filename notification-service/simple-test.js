require('dotenv').config({ path: './config.env' });
const emailService = require('./src/services/EmailService');

async function testEmailDirectly() {
  console.log('🚀 Testando envio de e-mail diretamente...');
  
  try {
    // Inicializar o serviço de e-mail
    await emailService.initialize();
    
    console.log('✅ EmailService inicializado com sucesso!');
    
    // Teste 1: E-mail de notificação simples
    console.log('\n📧 Enviando e-mail de teste...');
    
    const result1 = await emailService.sendEmail({
      to: 'hppeixoto15@gmail.com',
      subject: '🎉 Teste LogiTrack - E-mail Funcionando!',
      template: 'notification',
      templateData: {
        title: 'Teste de E-mail LogiTrack',
        message: 'Parabéns! 🎉 O sistema de e-mail do LogiTrack está funcionando perfeitamente! Este é um teste do serviço de notificações.',
        actionUrl: 'https://github.com',
        actionText: 'Ver Projeto'
      }
    });
    
    if (result1.success) {
      console.log('✅ E-mail 1 enviado com sucesso!');
      console.log('📧 Message ID:', result1.messageId);
    } else {
      console.log('❌ Erro no e-mail 1:', result1.error);
    }
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 2: E-mail de entrega
    console.log('\n📦 Enviando e-mail de atualização de entrega...');
    
    const result2 = await emailService.sendEmail({
      to: 'hppeixoto15@gmail.com',
      subject: '📦 LogiTrack - Sua entrega está a caminho!',
      template: 'delivery-update',
      templateData: {
        customerName: 'Usuário Teste',
        status: 'Em Trânsito',
        trackingCode: 'LT123456789BR',
        currentLocation: 'São Paulo - SP',
        estimatedDelivery: 'Hoje às 18:00',
        trackingUrl: 'http://localhost:3000/tracking/LT123456789BR'
      }
    });
    
    if (result2.success) {
      console.log('✅ E-mail 2 enviado com sucesso!');
      console.log('📧 Message ID:', result2.messageId);
    } else {
      console.log('❌ Erro no e-mail 2:', result2.error);
    }
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 3: E-mail de boas-vindas
    console.log('\n👋 Enviando e-mail de boas-vindas...');
    
    const result3 = await emailService.sendEmail({
      to: 'hppeixoto15@gmail.com',
      subject: '🎉 Bem-vindo ao LogiTrack!',
      template: 'welcome',
      templateData: {
        userName: 'Novo Usuário',
        dashboardUrl: 'http://localhost:3000/dashboard'
      }
    });
    
    if (result3.success) {
      console.log('✅ E-mail 3 enviado com sucesso!');
      console.log('📧 Message ID:', result3.messageId);
    } else {
      console.log('❌ Erro no e-mail 3:', result3.error);
    }
    
    // Estatísticas
    console.log('\n📊 Estatísticas do EmailService:');
    const stats = await emailService.getEmailStats();
    console.log(stats);
    
    console.log('\n🎯 Teste concluído! Verifique sua caixa de entrada (hppeixoto15@gmail.com)');
    console.log('📧 Você deve ter recebido 3 e-mails de teste diferentes!');
    
    // Fechar serviço
    await emailService.shutdown();
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
    console.log('🔍 Stack:', error.stack);
  }
}

// Executar teste
testEmailDirectly().catch(console.error); 