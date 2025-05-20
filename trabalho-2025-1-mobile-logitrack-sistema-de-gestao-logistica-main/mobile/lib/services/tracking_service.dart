import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:uuid/uuid.dart';

import '../models/tracking_update.dart';
import '../models/location_data.dart';
import '../utils/constants.dart';
import 'database_service.dart';

class TrackingService {
  final DatabaseService _databaseService;
  final _uuid = Uuid();
  
  TrackingService(this._databaseService);
  
  // Verificar conectividade
  Future<bool> _checkConnectivity() async {
    var connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }
  
  // Obter atualizações de rastreamento
  Future<List<TrackingUpdate>> getTrackingUpdates(String deliveryId) async {
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      if (!isConnected) {
        // Se não houver conexão, usar dados locais
        return _databaseService.getTrackingUpdates(deliveryId);
      }
      
      // Fazer requisição HTTP
      final response = await http.get(
        Uri.parse('${Constants.trackingUrl}/$deliveryId'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        // Decodificar resposta
        final List<dynamic> data = jsonDecode(response.body);
        final updates = data.map((item) => TrackingUpdate.fromJson(item)).toList();
        
        // Salvar atualizações no banco de dados local
        for (var update in updates) {
          await _databaseService.saveTrackingUpdate(update);
        }
        
        return updates;
      } else {
        throw Exception('Falha ao carregar atualizações: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao buscar atualizações: $e');
      
      // Em caso de erro, usar dados locais
      return _databaseService.getTrackingUpdates(deliveryId);
    }
  }
  
  // Adicionar atualização de rastreamento
  Future<TrackingUpdate> addTrackingUpdate({
    required String deliveryId,
    required String status,
    required LocationData location,
    String? description,
    String? photoUrl,
  }) async {
    // Criar nova atualização
    final update = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: deliveryId,
      status: status,
      location: location,
      description: description,
      photoUrl: photoUrl,
      timestamp: DateTime.now(),
    );
    
    // Salvar atualização localmente
    await _databaseService.saveTrackingUpdate(update);
    
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      if (!isConnected) {
        // Se não houver conexão, retornar atualização local
        return update;
      }
      
      // Fazer requisição HTTP
      final response = await http.post(
        Uri.parse(Constants.trackingUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(update.toJson()),
      );
      
      if (response.statusCode == 201) {
        // Decodificar resposta
        final data = jsonDecode(response.body);
        final serverUpdate = TrackingUpdate.fromJson(data);
        
        // Salvar atualização do servidor no banco de dados local
        await _databaseService.saveTrackingUpdate(serverUpdate);
        
        return serverUpdate;
      } else {
        throw Exception('Falha ao adicionar atualização: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao adicionar atualização: $e');
      
      // Em caso de erro, retornar atualização local
      return update;
    }
  }
}