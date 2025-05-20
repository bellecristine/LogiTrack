import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:badges/badges.dart' as badges;

import '../../services/auth_service.dart';
import '../../services/notification_service.dart';
import '../../services/delivery_service.dart';
import '../../services/database_service.dart';
import '../../models/delivery.dart';
import '../../widgets/delivery_card.dart';
import '../auth/login_screen.dart';
import 'delivery_detail_screen.dart';
import 'delivery_history_screen.dart';
import '../client/notification_screen.dart';


class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({Key? key}) : super(key: key);

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isLoading = true;
  List<Delivery> _assignedDeliveries = [];
  List<Delivery> _availableDeliveries = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDeliveries();
  }

  Future<void> _loadDeliveries() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final user = await authService.getCurrentUser();

      if (user == null) {
        setState(() {
          _errorMessage = 'Usuário não autenticado';
          _isLoading = false;
        });
        return;
      }

      final deliveryService = DeliveryService(databaseService);
      
      // Carregar entregas atribuídas ao motorista
      final assignedDeliveries = await deliveryService.fetchDeliveries(
        userId: user.id,
        role: 'driver',
        status: 'active', // Entregas ativas (pendentes ou em trânsito)
      );

      // Carregar entregas disponíveis para aceitação
      final availableDeliveries = await databaseService.getDeliveries(
        status: 'pending',
      );
      
      // Filtrar entregas disponíveis (sem motorista atribuído)
      final filteredAvailableDeliveries = availableDeliveries
          .where((delivery) => delivery.driverId == null)
          .toList();

      setState(() {
        _assignedDeliveries = assignedDeliveries;
        _availableDeliveries = filteredAvailableDeliveries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar entregas: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _acceptDelivery(String deliveryId) async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final user = await authService.getCurrentUser();

      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Usuário não autenticado')),
        );
        return;
      }

      final deliveryService = DeliveryService(databaseService);
      await deliveryService.assignDriver(deliveryId, user.id);
      
      // Recarregar entregas
      await _loadDeliveries();
      
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entrega aceita com sucesso')),
      );
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao aceitar entrega: ${e.toString()}')),
      );
    }
  }

  Future<void> _logout() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    await authService.logout();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final notificationService = Provider.of<NotificationService>(context);
    final authService = Provider.of<AuthService>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('LogiTrack - Motorista'),
        actions: [
          // Ícone de notificações com badge
          badges.Badge(
            position: badges.BadgePosition.topEnd(top: 5, end: 5),
            showBadge: notificationService.unreadCount > 0,
            badgeContent: Text(
              notificationService.unreadCount.toString(),
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
            child: IconButton(
              icon: const Icon(Icons.notifications),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const NotificationScreen()),
                );
              },
            ),
          ),
          // Menu de opções
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings),
                    SizedBox(width: 8),
                    Text('Configurações'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Sair'),
                  ],
                ),
              ),
            ],
            onSelected: (value) {
              if (value == 'settings') {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              } else if (value == 'logout') {
                _logout();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDeliveries,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadDeliveries,
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Saudação ao usuário
                      FutureBuilder<User?>(
                        future: authService.getCurrentUser(),
                        builder: (context, snapshot) {
                          final userName = snapshot.data?.name ?? 'Motorista';
                          return Text(
                            'Olá, $userName!',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Gerencie suas entregas e rotas',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 24),
                      
                      // Entregas atribuídas
                      if (_assignedDeliveries.isNotEmpty) ...[
                        const Text(
                          'Suas entregas',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._assignedDeliveries.map((delivery) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: DeliveryCard(
                                delivery: delivery,
                                isDriver: true,
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => DeliveryDetailScreen(
                                        deliveryId: delivery.id,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            )),
                        const SizedBox(height: 24),
                      ],
                      
                      // Entregas disponíveis
                      if (_availableDeliveries.isNotEmpty) ...[
                        const Text(
                          'Entregas disponíveis',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._availableDeliveries.map((delivery) => Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: DeliveryCard(
                                delivery: delivery,
                                isDriver: true,
                                showAcceptButton: true,
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => DeliveryDetailScreen(
                                        deliveryId: delivery.id,
                                        isAvailable: true,
                                      ),
                                    ),
                                  );
                                },
                                onAccept: () => _acceptDelivery(delivery.id),
                              ),
                            )),
                      ],
                      
                      // Mensagem quando não há entregas
                      if (_assignedDeliveries.isEmpty && _availableDeliveries.isEmpty)
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.local_shipping_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Nenhuma entrega disponível no momento',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Novas entregas aparecerão aqui quando estiverem disponíveis',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history),
            label: 'Histórico',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Configurações',
          ),
        ],
        onTap: (index) {
          if (index == 1) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DeliveryHistoryScreen()),
            );
          } else if (index == 2) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            );
          }
        },
      ),
    );
  }
}