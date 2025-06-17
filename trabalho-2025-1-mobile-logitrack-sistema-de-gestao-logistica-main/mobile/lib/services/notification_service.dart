import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz_data;
import 'dart:convert';
import 'package:flutter/material.dart';

class NotificationService extends ChangeNotifier {
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  int _unreadCount = 0;
  List<Map<String, dynamic>> _notifications = [];
  
  int get unreadCount => _unreadCount;

  // Inicializar o serviço de notificações
  Future<void> initialize() async {
    // Inicializar timezone
    tz_data.initializeTimeZones();
    
    // Configurar detalhes de inicialização
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    final DarwinInitializationSettings initializationSettingsIOS = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
      onDidReceiveLocalNotification: (int id, String? title, String? body, String? payload) async {
        // Manipular notificação recebida no iOS
      },
    );
    
    final InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    
    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) async {
        // Manipular resposta de notificação
        if (response.payload != null) {
          print('Notificação selecionada: ${response.payload}');
        }
      },
    );
  }

  // Solicitar permissões
  Future<void> requestPermissions() async {
    final platform = _flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (platform != null) {
      await platform.requestPermission();
    }
    
    final iOSPlatform = _flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    if (iOSPlatform != null) {
      await iOSPlatform.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
    }
  }

  // Mostrar notificação
  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'logitrack_channel',
      'LogiTrack Notifications',
      channelDescription: 'Notificações do LogiTrack',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );
    
    const DarwinNotificationDetails iOSPlatformChannelSpecifics = DarwinNotificationDetails();
    
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );
    
    await _flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecond, // ID único baseado no tempo atual
      title,
      body,
      platformChannelSpecifics,
      payload: payload,
    );
    
    // Salvar notificação no histórico
    await _saveNotificationToHistory(title, body, payload);
  }

  // Agendar notificação
  Future<void> scheduleNotification({
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'logitrack_scheduled_channel',
      'LogiTrack Scheduled Notifications',
      channelDescription: 'Notificações agendadas do LogiTrack',
      importance: Importance.max,
      priority: Priority.high,
    );
    
    const DarwinNotificationDetails iOSPlatformChannelSpecifics = DarwinNotificationDetails();
    
    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );
    
    await _flutterLocalNotificationsPlugin.zonedSchedule(
      DateTime.now().millisecond, // ID único baseado no tempo atual
      title,
      body,
      tz.TZDateTime.from(scheduledDate, tz.local),
      platformChannelSpecifics,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
      payload: payload,
    );
  }

  Future<void> _saveNotificationToHistory(String title, String body, String? payload) async {
    final prefs = await SharedPreferences.getInstance();
    
    
    final notificationsJson = prefs.getStringList('notifications_history') ?? [];
    
   
    final notification = {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'title': title,
      'body': body,
      'payload': payload,
      'timestamp': DateTime.now().toIso8601String(),
      'read': false,
    };
    
    notificationsJson.add(jsonEncode(notification));
    
    
    if (notificationsJson.length > 50) {
      notificationsJson.removeAt(0);
    }
    

    await prefs.setStringList('notifications_history', notificationsJson);
  }

  
  Future<List<Map<String, dynamic>>> getNotificationsHistory() async {
    final prefs = await SharedPreferences.getInstance();
    
    final notificationsJson = prefs.getStringList('notifications_history') ?? [];
    
    return notificationsJson
        .map((json) => Map<String, dynamic>.from(jsonDecode(json)))
        .toList()
        ..sort((a, b) => DateTime.parse(b['timestamp']).compareTo(DateTime.parse(a['timestamp'])));
  }

  
  Future<void> markNotificationAsRead(String id) async {
    final prefs = await SharedPreferences.getInstance();
    
    final notificationsJson = prefs.getStringList('notifications_history') ?? [];
    
    final updatedNotifications = notificationsJson.map((json) {
      final notification = Map<String, dynamic>.from(jsonDecode(json));
      
      if (notification['id'] == id) {
        notification['read'] = true;
      }
      
      return jsonEncode(notification);
    }).toList();
    
    await prefs.setStringList('notifications_history', updatedNotifications);
  }
  

  Future<void> clearAllNotifications() async {
    await _flutterLocalNotificationsPlugin.cancelAll();
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('notifications_history');
  }

  Future<List<Map<String, dynamic>>> getNotificationHistory() async {
    // TODO: Implementar integração com backend
    // Por enquanto, retorna dados mockados
    return [
      {
        'id': '1',
        'title': 'Nova entrega',
        'body': 'Você tem uma nova entrega disponível',
        'timestamp': DateTime.now().toIso8601String(),
        'read': false,
      },
      {
        'id': '2',
        'title': 'Entrega atualizada',
        'body': 'O status da sua entrega foi atualizado',
        'timestamp': DateTime.now().subtract(const Duration(hours: 1)).toIso8601String(),
        'read': true,
      },
    ];
  }

  Future<void> markAllNotificationsAsRead() async {
    // TODO: Implementar integração com backend
    _unreadCount = 0;
    notifyListeners();
  }

  void addNotification(String title, String body) {
    _notifications.insert(
      0,
      {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': title,
        'body': body,
        'timestamp': DateTime.now().toIso8601String(),
        'read': false,
      },
    );
    _unreadCount++;
    notifyListeners();
  }
}