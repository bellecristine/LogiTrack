import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';

import 'database_service.dart';
import '../models/entrega_pendente.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final DatabaseService _dbService = DatabaseService();
  final Connectivity _connectivity = Connectivity();

  /// Inicia escuta para quando a conexão mudar (útil para app rodando)
  void startListeningConnectionChanges() {
    _connectivity.onConnectivityChanged.listen((ConnectivityResult result) {
      if (result != ConnectivityResult.none) {
        sincronizarPendentes();
      }
    });
  }

  /// Chamada no início do app (ex: no initState ou Splash)
  Future<void> sincronizarPendentes() async {
    final entregas = await _dbService.getEntregasPendentes();

    for (final entrega in entregas) {
      try {
        final uri = Uri.parse(
            'http://10.0.2.2:3000/entregas/${entrega.entregaId}/finalizar');

        final request = http.MultipartRequest('POST', uri)
          ..fields['latitude'] = entrega.latitude.toString()
          ..fields['longitude'] = entrega.longitude.toString()
          ..files
              .add(await http.MultipartFile.fromPath('foto', entrega.fotoPath));

        final response = await request.send();

        if (response.statusCode == 200 || response.statusCode == 201) {
          await _dbService.deleteEntregaPendente(entrega.id!);
          print('✅ Entrega sincronizada com sucesso: ${entrega.entregaId}');
        } else {
          print('⚠️ Falha ao sincronizar entrega ${entrega.entregaId}');
        }
      } catch (e) {
        print('❌ Erro ao enviar entrega ${entrega.entregaId}: $e');
      }
    }
  }
}
