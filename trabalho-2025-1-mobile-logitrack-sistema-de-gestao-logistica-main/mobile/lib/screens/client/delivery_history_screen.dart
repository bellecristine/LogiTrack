import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/auth_service.dart';
import '../../services/database_service.dart';
import '../../services/delivery_service.dart';
import '../../models/delivery.dart';
import '../../widgets/delivery_card.dart';
import 'delivery_tracking_screen.dart';

class DeliveryHistoryScreen extends StatefulWidget {
  const DeliveryHistoryScreen({Key? key}) : super(key: key);

  @override
  State<DeliveryHistoryScreen> createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends State<DeliveryHistoryScreen> {
  bool _isLoading = true;
  List<Delivery> _deliveryHistory = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDeliveryHistory();
  }

  Future<void> _loadDeliveryHistory() async {
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
      
      // Carregar histórico de entregas (entregas concluídas)
      final deliveries = await deliveryService.fetchDeliveries(
        userId: user.id,
        role: user.userType,
        status: 'completed', // Entregas concluídas
      );

      setState(() {
        _deliveryHistory = deliveries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar histórico: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Histórico de Entregas'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _loadDeliveryHistory,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadDeliveryHistory,
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  )
                : _deliveryHistory.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.history,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'Nenhuma entrega no histórico',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Entregas concluídas aparecerão aqui',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _deliveryHistory.length,
                        itemBuilder: (context, index) {
                          final delivery = _deliveryHistory[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: DeliveryCard(
                              delivery: delivery,
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => DeliveryTrackingScreen(
                                      deliveryId: delivery.id,
                                    ),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
