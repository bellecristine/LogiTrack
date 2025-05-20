import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class PreferencesService {
  // Chaves para preferências
  static const String _themeKey = 'theme';
  static const String _notificationPreferencesKey = 'notification_preferences';

  // Salvar tema
  Future<void> saveTheme(String theme) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, theme);
  }

  // Obter tema
  Future<String> getTheme() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_themeKey) ?? 'light';
  }

  // Salvar preferências de notificação
  Future<void> saveNotificationPreferences({
    required bool enablePush,
    required bool enableEmail,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    
    final preferences = {
      'enablePush': enablePush,
      'enableEmail': enableEmail,
    };
    
    await prefs.setString(_notificationPreferencesKey, jsonEncode(preferences));
  }

  // Obter preferências de notificação
  Future<Map<String, dynamic>> getNotificationPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    
    final preferencesJson = prefs.getString(_notificationPreferencesKey);
    
    if (preferencesJson == null) {
      return {
        'enablePush': true,
        'enableEmail': true,
      };
    }
    
    return Map<String, dynamic>.from(jsonDecode(preferencesJson));
  }
}