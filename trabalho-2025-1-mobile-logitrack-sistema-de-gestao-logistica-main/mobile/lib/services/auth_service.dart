import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';

class AuthService {
  // Chave para armazenar o usuário atual nas preferências
  static const String _currentUserKey = 'current_user';

  // Salvar usuário atual nas preferências
  Future<void> saveCurrentUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currentUserKey, jsonEncode(user.toJson()));
  }

  // Obter usuário atual das preferências
  Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    
    final userJson = prefs.getString(_currentUserKey);
    
    if (userJson == null) {
      return null;
    }
    
    try {
      return User.fromJson(jsonDecode(userJson));
    } catch (e) {
      print('Erro ao decodificar usuário: $e');
      return null;
    }
  }

  // Verificar se o usuário está autenticado
  Future<bool> isAuthenticated() async {
    final user = await getCurrentUser();
    return user != null;
  }

  // Logout (remover usuário atual das preferências)
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_currentUserKey);
  }
}