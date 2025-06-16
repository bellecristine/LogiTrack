import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'auth/login_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Configurações'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Seção do perfil
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Perfil',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FutureBuilder(
                    future: authService.getCurrentUser(),
                    builder: (context, snapshot) {
                      if (snapshot.hasData) {
                        final user = snapshot.data!;
                        return Column(
                          children: [
                            ListTile(
                              leading: const Icon(Icons.person),
                              title: const Text('Nome'),
                              subtitle: Text(user.name),
                              contentPadding: EdgeInsets.zero,
                            ),
                            ListTile(
                              leading: const Icon(Icons.email),
                              title: const Text('Email'),
                              subtitle: Text(user.email),
                              contentPadding: EdgeInsets.zero,
                            ),
                            ListTile(
                              leading: const Icon(Icons.badge),
                              title: const Text('Tipo de usuário'),
                              subtitle: Text(_getUserTypeText(user.userType)),
                              contentPadding: EdgeInsets.zero,
                            ),
                          ],
                        );
                      }
                      return const CircularProgressIndicator();
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Seção de configurações
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Configurações',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.notifications),
                    title: const Text('Notificações'),
                    subtitle: const Text('Gerenciar notificações'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    contentPadding: EdgeInsets.zero,
                    onTap: () {
                      // TODO: Implementar tela de configurações de notificação
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Funcionalidade em desenvolvimento'),
                        ),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.language),
                    title: const Text('Idioma'),
                    subtitle: const Text('Português (Brasil)'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    contentPadding: EdgeInsets.zero,
                    onTap: () {
                      // TODO: Implementar seleção de idioma
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Funcionalidade em desenvolvimento'),
                        ),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.privacy_tip),
                    title: const Text('Privacidade'),
                    subtitle: const Text('Política de privacidade'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    contentPadding: EdgeInsets.zero,
                    onTap: () {
                      // TODO: Mostrar política de privacidade
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Funcionalidade em desenvolvimento'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Seção sobre o app
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sobre',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.info),
                    title: const Text('Versão do aplicativo'),
                    subtitle: const Text('1.0.0'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  ListTile(
                    leading: const Icon(Icons.help),
                    title: const Text('Ajuda'),
                    subtitle: const Text('Suporte e FAQ'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    contentPadding: EdgeInsets.zero,
                    onTap: () {
                      // TODO: Implementar tela de ajuda
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Funcionalidade em desenvolvimento'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          
          // Botão sair
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showLogoutDialog(context),
              icon: const Icon(Icons.logout),
              label: const Text('Sair'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getUserTypeText(String userType) {
    switch (userType.toLowerCase()) {
      case 'client':
        return 'Cliente';
      case 'driver':
        return 'Motorista';
      case 'admin':
        return 'Administrador';
      default:
        return userType;
    }
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Sair'),
          content: const Text('Tem certeza que deseja sair?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: () async {
                final authService = Provider.of<AuthService>(context, listen: false);
                await authService.logout();
                
                if (!context.mounted) return;
                
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              child: const Text('Sair'),
            ),
          ],
        );
      },
    );
  }
} 