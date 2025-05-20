import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/delivery_service.dart';
import '../../services/tracking_service.dart';
import '../../services/database_service.dart';
import '../../services/auth_service.dart';
import '../../models/delivery.dart';
import '../../models/tracking_update.dart';
import '../../widgets/tracking_timeline.dart';


class DeliveryDetailScreen extends StatefulWidget {
  final String deliveryId;
  final bool isAvailable;

  const DeliveryDetailScreen({
    Key? key,
    required this.deliveryId,
    this.isAvailable = false,
  }) : super(key: key);

  @override
  State<DeliveryDetailScreen> createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen> {
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

  @override
  void initState() {
    super.initState();
    _loadDeliveryData();
  }

  @override
  void dispose() {
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

  void _setupMapMarkers() {
    if (_delivery == null) return;
    
    // Limpar marcadores e polilinhas existentes
    _markers = {};
    _polylines = {};
    
    // Adicionar marcador para origem
    // Simulando coordenadas para origem e destino
    final originLatLng = LatLng(-23.550520, -46.633308); // São Paulo
    final destinationLatLng = LatLng(-22.906847, -43.172897); // Rio de Janeiro
    
    _markers.add(
      Marker(
        markerId: const MarkerId('origin'),
        position: originLatLng,
        infoWindow: InfoWindow(
          title: 'Origem',
          snippet: _delivery?.origin,
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
      ),
    );
    
    // Adicionar marcador para destino
    _markers.add(
      Marker(
        markerId: const MarkerId('destination'),
        position: destinationLatLng,
        infoWindow: InfoWindow(
          title: 'Destino',
          snippet: _delivery?.destination,
        ),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      ),
    );
    
    // Adicionar marcadores para atualizações de rastreamento
    for (int i = 0; i < _trackingUpdates.length; i++) {
      final update = _trackingUpdates[i];
      final location = update.location;
      
      final latLng = LatLng(location.latitude, location.longitude);
      
      _markers.add(
        Marker(
          markerId: MarkerId('update_$i'),
          position: latLng,
          infoWindow: InfoWindow(
            title: 'Status: ${_getStatusText(update.status)}',
            snippet: DateFormat('dd/MM/yyyy HH:mm').format(update.timestamp),
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }
    
    // Adicionar polilinha simulada entre origem e destino
    _polylines.add(
      Polyline(
        polylineId: const PolylineId('route'),
        points: [originLatLng, destinationLatLng],
        color: Colors.blue,
        width: 5,
      ),
    );
    
    // Ajustar câmera para mostrar toda a rota
    _mapController?.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(
            originLatLng.latitude < destinationLatLng.latitude
                ? originLatLng.latitude
                : destinationLatLng.latitude,
            originLatLng.longitude < destinationLatLng.longitude
                ? originLatLng.longitude
                : destinationLatLng.longitude,
          ),
          northeast: LatLng(
            originLatLng.latitude > destinationLatLng.latitude
                ? originLatLng.latitude
                : destinationLatLng.latitude,
            originLatLng.longitude > destinationLatLng.longitude
                ? originLatLng.longitude
                : destinationLatLng.longitude,
          ),
        ),
        100, // padding
      ),
    );
    
    setState(() {});
  }

  Future<void> _acceptDelivery() async {
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
      await deliveryService.assignDriver(widget.deliveryId, user.id);
      
      // Recarregar dados da entrega
      await _loadDeliveryData();
      
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Entrega aceita com sucesso')),
      );
      
      // Voltar para a tela anterior
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao aceitar entrega: ${e.toString()}')),
      );
    }
  }

  Future<void> _updateDeliveryStatus() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => UpdateStatusScreen(
          deliveryId: widget.deliveryId,
          currentStatus: _delivery?.status ?? 'pending',
        ),
      ),
    );
    
    if (result == true) {
      // Recarregar dados da entrega
      await _loadDeliveryData();
    }
  }

  Future<void> _openMapsNavigation() async {
    if (_delivery == null) return;
    
    // Simulando coordenadas para destino
    const lat = -22.906847;
    const lng = -43.172897;
    
    final url = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng';
    
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível abrir o mapa')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhes da Entrega'),
        actions: [
          if (!widget.isAvailable && _delivery != null && _delivery!.status != 'delivered')
            IconButton(
              icon: const Icon(Icons.navigation),
              onPressed: _openMapsNavigation,
              tooltip: 'Navegar até o destino',
            ),
        ],
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
                          target: LatLng(-23.550520, -46.633308), // São Paulo
                          zoom: 10,
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
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Entrega #${_delivery?.id.substring(0, 8)}',
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
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
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    if (_delivery?.client != null) ...[
                                      const Text(
                                        'Cliente',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _delivery?.client?.name ?? '',
                                        style: const TextStyle(
                                          fontSize: 14,
                                        ),
                                      ),
                                      Text(
                                        _delivery?.client?.email ?? '',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey,
                                        ),
                                      ),
                                      const SizedBox(height: 16),
                                    ],
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
                                    if (_delivery?.estimatedDelivery != null) ...[
                                      const SizedBox(height: 16),
                                      const Text(
                                        'Previsão de entrega',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        DateFormat('dd/MM/yyyy').format(_delivery!.estimatedDelivery!),
                                        style: const TextStyle(
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Timeline de rastreamento
                            if (_trackingUpdates.isNotEmpty) ...[
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
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
      bottomNavigationBar: _isLoading || _errorMessage != null
          ? null
          : widget.isAvailable
              ? SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: ElevatedButton(
                      onPressed: _acceptDelivery,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Aceitar Entrega'),
                    ),
                  ),
                )
              : _delivery?.status != 'delivered'
                  ? SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: ElevatedButton(
                          onPressed: _updateDeliveryStatus,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Atualizar Status'),
                        ),
                      ),
                    )
                  : null,
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