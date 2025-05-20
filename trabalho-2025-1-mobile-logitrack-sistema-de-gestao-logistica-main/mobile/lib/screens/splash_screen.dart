import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';

import '../services/preferences_service.dart';
import '../services/database_service.dart';
import 'auth/login_screen.dart';
import 'client/client_home_screen.dart';
import 'driver/driver_home_screen.dart';
import '../models/user.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;
  
  @override
  void initState() {
    super.initState();
    
    // Configurar animação
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    );
    
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    
    _animationController.forward();
    
    // Verificar autenticação após um delay
    Timer(const Duration(seconds: 3), _checkAuth);
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _checkAuth() async {
    if (!mounted) return;
    
    final preferencesService = Provider.of<PreferencesService>(context, listen: false);
    final databaseService = Provider.of<DatabaseService>(context, listen: false);
    
    try {
      // Verificar se há um usuário salvo
      final userData = await preferencesService.getCurrentUser();
      
      if (userData != null) {
        final userId = userData['id'] as String;
        
        // Verificar se o usuário existe no banco de dados local
        final user = await databaseService.getUser(userId);
        
        if (user != null) {
          // Navegar para a tela apropriada com base no papel do usuário
          _navigateToHome(user);
          return;
        }
      }
      
      // Se não houver usuário autenticado, navegar para a tela de login
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    } catch (e) {
      print('Erro ao verificar autenticação: $e');
      
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }
  
  void _navigateToHome(User user) {
    if (!mounted) return;
    
    switch (user.role) {
      case 'client':
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const ClientHomeScreen()),
        );
        break;
      case 'driver':
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DriverHomeScreen()),
        );
        break;
      default:
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.blue.shade700,
              Colors.blue.shade900,
            ],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo animado
              FadeTransition(
                opacity: _animation,
                child: ScaleTransition(
                  scale: _animation,
                  child: Container(
                    width: 150,
                    height: 150,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(75),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 10,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_shipping,
                      size: 80,
                      color: Colors.blue,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              FadeTransition(
                opacity: _animation,
                child: const Text(
                  'LogiTrack',
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              FadeTransition(
                opacity: _animation,
                child: const Text(
                  'Rastreamento inteligente de entregas',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
              ),
              const SizedBox(height: 64),
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}