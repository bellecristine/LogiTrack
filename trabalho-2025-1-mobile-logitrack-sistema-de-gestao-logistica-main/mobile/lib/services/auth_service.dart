import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';

import '../models/user.dart';

class AuthService extends ChangeNotifier {
  User? _currentUser;
  final _prefs = SharedPreferences.getInstance();

  User? get currentUser => _currentUser;

  // Chave para armazenar o usuário atual nas preferências
  static const String _currentUserKey = 'current_user';

  Future<bool> register(String name, String email, String password, String role) async {
    try {
      // TODO: Implementar integração com backend
      // Por enquanto, apenas simula o registro
      await Future.delayed(const Duration(seconds: 1));

      final user = User(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        email: email,
        role: role,
      );

      await saveCurrentUser(user);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Salvar usuário atual nas preferências
  Future<void> saveCurrentUser(User user) async {
    _currentUser = user;
    final prefs = await _prefs;
    await prefs.setString('user', user.toJson().toString());
    notifyListeners();
  }

  // Obter usuário atual das preferências
  Future<User?> getCurrentUser() async {
    if (_currentUser != null) return _currentUser;

    final prefs = await _prefs;
    final userJson = prefs.getString('user');
    if (userJson == null) return null;

    try {
      _currentUser = User.fromJson(Map<String, dynamic>.from(
        Map<String, dynamic>.from(userJson as Map),
      ));
      return _currentUser;
    } catch (e) {
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
    _currentUser = null;
    final prefs = await _prefs;
    await prefs.remove('user');
    notifyListeners();
  }
}