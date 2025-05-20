class Constants {
  // URLs da API
  static const String baseUrl = 'http://localhost:3000/api';
  static const String authUrl = '$baseUrl/auth';
  static const String deliveriesUrl = '$baseUrl/deliveries';
  static const String trackingUrl = '$baseUrl/tracking';
  static const String uploadUrl = '$baseUrl/upload';
  
  // Status de entrega
  static const String statusPending = 'pending';
  static const String statusInTransit = 'in_transit';
  static const String statusDelivered = 'delivered';
  static const String statusCancelled = 'cancelled';
  
  // Funções de usuário
  static const String roleClient = 'client';
  static const String roleDriver = 'driver';
  static const String roleOperator = 'operator';
  
  // Temas
  static const String themeLight = 'light';
  static const String themeDark = 'dark';
  
  // Canais de notificação
  static const String notificationChannel = 'logitrack_notifications';
  static const String scheduledNotificationChannel = 'logitrack_scheduled_notifications';
  
  // Mensagens
  static const String msgConnectionError = 'Erro de conexão. Verifique sua internet.';
  static const String msgAuthError = 'Erro de autenticação. Faça login novamente.';
  static const String msgLoadError = 'Erro ao carregar dados. Tente novamente.';
  static const String msgSuccess = 'Operação realizada com sucesso!';
  
  // Configurações
  static const int locationUpdateInterval = 120; // segundos
  static const int maxReconnectionAttempts = 3;
}