import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import 'package:provider/provider.dart';

import '../../services/delivery_service.dart';
import '../../services/tracking_service.dart';
import '../../services/database_service.dart';
import '../../models/delivery.dart';
import '../../models/tracking_update.dart';


class DeliveryTrackingScreen extends StatefulWidget {
  final String deliveryId;

  const DeliveryTrackingScreen({
    Key? key,
    required this.deliveryId,
  }) : super(key: key);

  @override
  State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
  bool _isLoading = true;
  Delivery? _delivery;
  List<TrackingUpdate> _trackingUpdates = [];
  String? _errorMessage;
  
  // Controlador do mapa
  GoogleMapController? _mapController;
  
  // Marcadores no mapa
  Set<Marker> _markers = {};
  
  // Polilinha para mostrar a rota
  Set<Polyline> _polylines = {};
  
  // Timer para atualização periódica
  Timer? _updateTimer;

  @override
  void initState() {
    super.initState();
    _loadDeliveryData();
    
    // Configurar timer para atualizar a cada 2 minutos (120 segundos)
    _updateTimer = Timer.periodic(const Duration(seconds: 120), (timer) {
      _loadTrackingUpdates();
    });
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _loadDeliveryData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final deliveryService = DeliveryService(databaseService);
      final trackingService = TrackingService(databaseService);
      
      // Carregar dados da entrega
      final delivery = await deliveryService.getDelivery(widget.deliveryId);
      
      if (delivery == null) {
        throw Exception('Entrega não encontrada');
      }
      
      // Carregar atualizações de rastreamento
      final trackingUpdates = await trackingService.getTrackingUpdates(widget.deliveryId);
      
      if (!mounted) return;
      
      setState(() {
        _delivery = delivery;
        _trackingUpdates = trackingUpdates;
        _isLoading = false;
      });
      
      // Configurar marcadores e polilinhas no mapa
      _setupMapMarkers();
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao carregar dados: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadTrackingUpdates() async {
    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final trackingService = TrackingService(databaseService);
      
      // Carregar apenas as atualizações de rastreamento
      final trackingUpdates = await trackingService.getTrackingUpdates(widget.deliveryId);
      
      if (!mounted) return;
      
      setState(() {
        _trackingUpdates = trackingUpdates;
      });
      
      // Atualizar marcadores e polilinhas no mapa
      _setupMapMarkers();
    } catch (e) {
      // Não mostrar erro na tela para atualizações periódicas
      print('Erro ao atualizar rastreamento: ${e.toString()}');
    }
  }

  void _setupMapMarkers() {
    if (_trackingUpdates.isEmpty) return;
    
    // Limpar marcadores e polilinhas existentes
    _markers = {};
    _polylines = {};
    
    // Lista de pontos para a polilinha
    List<LatLng> polylinePoints = [];
    
    // Adicionar marcadores para cada atualização de rastreamento
    for (int i = 0; i < _trackingUpdates.length; i++) {
      final update = _trackingUpdates[i];
      final location = update.location;
      
      // Adicionar ponto à polilinha
      final latLng = LatLng(location.latitude, location.longitude);
      polylinePoints.add(latLng);
      
      // Adicionar marcador
      _markers.add(
        Marker(
          markerId: MarkerId('update_$i'),
          position: latLng,
          infoWindow: InfoWindow(
            title: 'Status: ${_getStatusText(update.status)}',
            snippet: DateFormat('dd/MM/yyyy HH:mm').format(update.timestamp),
          ),
        ),
      );
    }
    
    // Adicionar polilinha
    if (polylinePoints.length > 1) {
      _polylines.add(
        Polyline(
          polylineId: const PolylineId('route'),
          points: polylinePoints,
          color: Colors.blue,
          width: 5,
        ),
      );
    }
    
    // Mover câmera para a posição mais recente
    final latestUpdate = _trackingUpdates.first;
    final latestLocation = latestUpdate.location;
    final latLng = LatLng(latestLocation.latitude, latestLocation.longitude);
    
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(latLng, 15),
    );
    
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rastreamento de Entrega'),
      ),
      body: _isLoading
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
                        onPressed: _loadDeliveryData,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    // Mapa
                    Expanded(
                      flex: 3,
                      child: GoogleMap(
                        initialCameraPosition: const CameraPosition(
                          target: LatLng(0, 0),
                          zoom: 2,
                        ),
                        markers: _markers,
                        polylines: _polylines,
                        onMapCreated: (controller) {
                          _mapController = controller;
                          _setupMapMarkers();
                        },
                        myLocationEnabled: true,
                        myLocationButtonEnabled: true,
                        mapToolbarEnabled: true,
                        zoomControlsEnabled: true,
                      ),
                    ),
                    // Informações da entrega
                    Expanded(
                      flex: 4,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Detalhes da entrega
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Entrega #${_delivery?.id.substring(0, 8)}',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: _getStatusColor(_delivery?.status),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            _getStatusText(_delivery?.status),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        if (_delivery?.estimatedDelivery != null)
                                          Text(
                                            'Previsão: ${DateFormat('dd/MM/yyyy').format(_delivery!.estimatedDelivery!)}',
                                            style: const TextStyle(
                                              color: Colors.grey,
                                            ),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'Endereços',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.circle_outlined,
                                          size: 16,
                                          color: Colors.grey,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _delivery?.origin ?? '',
                                            style: const TextStyle(
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.location_on,
                                          size: 16,
                                          color: Colors.red,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _delivery?.destination ?? '',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Timeline de rastreamento
                            const Text(
                              'Atualizações de rastreamento',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            TrackingTimeline(updates: _trackingUpdates),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'in_transit':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_transit':
        return 'Em trânsito';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  }
}