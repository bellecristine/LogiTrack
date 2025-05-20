import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../services/auth_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import 'register_screen.dart';
import '../client/client_home_screen.dart';
import '../driver/driver_home_screen.dart';


class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      
      // Simulação de login para desenvolvimento
      await Future.delayed(const Duration(seconds: 2));
      
      // Criar usuário de teste com base no email
      final email = _emailController.text.trim().toLowerCase();
      String role;
      
      if (email.contains('client')) {
        role = 'client';
      } else if (email.contains('driver')) {
        role = 'driver';
      } else if (email.contains('operator')) {
        role = 'operator';
      } else {
        role = 'client'; // Padrão
      }
      
      final user = User(
        id: '1',
        name: 'Usuário Teste',
        email: email,
        role: role,
      );
      
      await authService.saveCurrentUser(user);

      if (!mounted) return;

      // Navegar para a tela apropriada com base no papel do usuário
      switch (role) {
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
        case 'operator':
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const OperatorHomeScreen()),
          );
          break;
        default:
          setState(() {
            _errorMessage = 'Função de usuário desconhecida';
            _isLoading = false;
          });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao fazer login: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                // Logo
                Center(
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.local_shipping_rounded,
                      size: 64,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                // Título
                const Text(
                  'Bem-vindo ao LogiTrack',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Faça login para continuar',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                // Formulário de login
                CustomTextField(
                  controller: _emailController,
                  labelText: 'Email',
                  hintText: 'Digite seu email',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Por favor, digite seu email';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                      return 'Por favor, digite um email válido';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                CustomTextField(
                  controller: _passwordController,
                  labelText: 'Senha',
                  hintText: 'Digite sua senha',
                  prefixIcon: Icons.lock_outline,
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Por favor, digite sua senha';
                    }
                    if (value.length < 6) {
                      return 'A senha deve ter pelo menos 6 caracteres';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),
                // Link "Esqueceu a senha"
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      // Navegar para a tela de recuperação de senha
                    },
                    child: const Text('Esqueceu a senha?'),
                  ),
                ),
                const SizedBox(height: 24),
                // Mensagem de erro
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.red.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(
                        color: Colors.red.shade800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                const SizedBox(height: 24),
                // Botão de login
                CustomButton(
                  text: 'Entrar',
                  isLoading: _isLoading,
                  onPressed: _login,
                ),
                const SizedBox(height: 24),
                // Link para registro
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Não tem uma conta?'),
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const RegisterScreen()),
                        );
                      },
                      child: const Text('Registre-se'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}