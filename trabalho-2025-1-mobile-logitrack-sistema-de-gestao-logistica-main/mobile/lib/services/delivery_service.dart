import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';

import '../models/delivery.dart';
import '../utils/constants.dart';
import 'database_service.dart';

class DeliveryService {
  final DatabaseService _databaseService;
  
  DeliveryService(this._databaseService);
  
  // Verificar conectividade
  Future<bool> _checkConnectivity() async {
    var connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }
  
  // Obter entregas do servidor
  Future<List<Delivery>> fetchDeliveries({String? status, String? userId, String? role}) async {
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      if (!isConnected) {
        // Se não houver conexão, usar dados locais
        return _databaseService.getDeliveries(
          status: status,
          userId: userId,
          role: role,
        );
      }
      
      // Construir URL com parâmetros de consulta
      var queryParams = <String, String>{};
      if (status != null) queryParams['status'] = status;
      if (userId != null) queryParams['userId'] = userId;
      if (role != null) queryParams['role'] = role;
      
      var uri = Uri.parse(Constants.deliveriesUrl).replace(queryParameters: queryParams);
      
      // Fazer requisição HTTP
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        // Decodificar resposta
        final List<dynamic> data = jsonDecode(response.body);
        final deliveries = data.map((item) => Delivery.fromJson(item)).toList();
        
        // Salvar entregas no banco de dados local
        for (var delivery in deliveries) {
          await _databaseService.saveDelivery(delivery);
        }
        
        return deliveries;
      } else {
        throw Exception('Falha ao carregar entregas: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao buscar entregas: $e');
      
      // Em caso de erro, usar dados locais
      return _databaseService.getDeliveries(
        status: status,
        userId: userId,
        role: role,
      );
    }
  }
  
  // Obter uma entrega específica
  Future<Delivery?> getDelivery(String id) async {
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      if (!isConnected) {
        // Se não houver conexão, usar dados locais
        return _databaseService.getDelivery(id);
      }
      
      // Fazer requisição HTTP
      final response = await http.get(
        Uri.parse('${Constants.deliveriesUrl}/$id'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        // Decodificar resposta
        final data = jsonDecode(response.body);
        final delivery = Delivery.fromJson(data);
        
        // Salvar entrega no banco de dados local
        await _databaseService.saveDelivery(delivery);
        
        return delivery;
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Falha ao carregar entrega: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao buscar entrega: $e');
      
      // Em caso de erro, usar dados locais
      return _databaseService.getDelivery(id);
    }
  }
  
  // Atualizar status de uma entrega
  Future<Delivery?> updateDeliveryStatus(String id, String status) async {
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      // Obter entrega atual
      final currentDelivery = await _databaseService.getDelivery(id);
      
      if (currentDelivery == null) {
        throw Exception('Entrega não encontrada');
      }
      
      // Atualizar entrega localmente
      final updatedDelivery = currentDelivery.copyWith(
        status: status,
        updatedAt: DateTime.now(),
      );
      
      await _databaseService.saveDelivery(updatedDelivery);
      
      if (!isConnected) {
        // Se não houver conexão, retornar entrega atualizada localmente
        return updatedDelivery;
      }
      
      // Fazer requisição HTTP
      final response = await http.patch(
        Uri.parse('${Constants.deliveriesUrl}/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'status': status}),
      );
      
      if (response.statusCode == 200) {
        // Decodificar resposta
        final data = jsonDecode(response.body);
        final delivery = Delivery.fromJson(data);
        
        // Salvar entrega atualizada no banco de dados local
        await _databaseService.saveDelivery(delivery);
        
        return delivery;
      } else {
        throw Exception('Falha ao atualizar entrega: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao atualizar entrega: $e');
      
      // Em caso de erro, retornar entrega atualizada localmente
      return _databaseService.getDelivery(id);
    }
  }
  
  // Atribuir motorista a uma entrega
  Future<Delivery?> assignDriver(String deliveryId, String driverId) async {
    try {
      // Verificar conectividade
      bool isConnected = await _checkConnectivity();
      
      // Obter entrega atual
      final currentDelivery = await _databaseService.getDelivery(deliveryId);
      
      if (currentDelivery == null) {
        throw Exception('Entrega não encontrada');
      }
      
      // Obter motorista
      final driver = await _databaseService.getUser(driverId);
      
      if (driver == null) {
        throw Exception('Motorista não encontrado');
      }
      
      // Atualizar entrega localmente
      final updatedDelivery = currentDelivery.copyWith(
        driverId: driverId,
        driver: driver,
        status: 'in_transit',
        updatedAt: DateTime.now(),
      );
      
      await _databaseService.saveDelivery(updatedDelivery);
      
      if (!isConnected) {
        // Se não houver conexão, retornar entrega atualizada localmente
        return updatedDelivery;
      }
      
      // Fazer requisição HTTP
      final response = await http.patch(
        Uri.parse('${Constants.deliveriesUrl}/$deliveryId/assign'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'driverId': driverId}),
      );
      
      if (response.statusCode == 200) {
        // Decodificar resposta
        final data = jsonDecode(response.body);
        final delivery = Delivery.fromJson(data);
        
        // Salvar entrega atualizada no banco de dados local
        await _databaseService.saveDelivery(delivery);
        
        return delivery;
      } else {
        throw Exception('Falha ao atribuir motorista: ${response.statusCode}');
      }
    } catch (e) {
      print('Erro ao atribuir motorista: $e');
      
      // Em caso de erro, retornar entrega atualizada localmente
      return _databaseService.getDelivery(deliveryId);
    }
  }
}