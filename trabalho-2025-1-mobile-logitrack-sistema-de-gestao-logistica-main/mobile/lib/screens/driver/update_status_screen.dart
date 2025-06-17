import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:uuid/uuid.dart';
import 'package:provider/provider.dart';

import '../../services/location_service.dart';
import '../../models/location_data.dart';
import '../../services/database_service.dart';
import '../../models/tracking_update.dart';
import '../../models/delivery.dart';
import '../../services/notification_service.dart';
import '../../services/delivery_service.dart';

class UpdateStatusScreen extends StatefulWidget {
  final String deliveryId;
  final String currentStatus;

  const UpdateStatusScreen({
    Key? key,
    required this.deliveryId,
    required this.currentStatus,
  }) : super(key: key);

  @override
  State<UpdateStatusScreen> createState() => _UpdateStatusScreenState();
}

class _UpdateStatusScreenState extends State<UpdateStatusScreen> {
  final LocationService _locationService = LocationService();
  final DatabaseService _databaseService = DatabaseService();
  final NotificationService _notificationService = NotificationService();
  final ImagePicker _imagePicker = ImagePicker();
  final TextEditingController _descriptionController = TextEditingController();
  final _uuid = const Uuid();
  
  String _selectedStatus = '';
  File? _imageFile;
  LocationData? _currentLocation;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isLoadingLocation = false;

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.currentStatus;
    _getCurrentLocation();
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      final location = await _locationService.getCurrentLocation();
      
      setState(() {
        _currentLocation = location;
        _isLoadingLocation = false;
      });
    } catch (e) {
      print('Erro ao obter localização: $e');
      
      // Usar localização simulada em caso de erro
      setState(() {
        _currentLocation = _locationService.getSimulatedLocation();
        _isLoadingLocation = false;
      });
    }
  }

  Future<void> _takePicture() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      
      if (image != null) {
        setState(() {
          _imageFile = File(image.path);
        });
      }
    } catch (e) {
      print('Erro ao capturar imagem: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao capturar imagem: $e')),
      );
    }
  }

  Future<void> _pickPicture() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      
      if (image != null) {
        setState(() {
          _imageFile = File(image.path);
        });
      }
    } catch (e) {
      print('Erro ao selecionar imagem: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao selecionar imagem: $e')),
      );
    }
  }

  Future<void> _updateStatus() async {
    if (_selectedStatus == widget.currentStatus) {
      Navigator.of(context).pop(false);
      return;
    }

    if (_currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aguarde a obtenção da localização')),
      );
      return;
    }

    // Validar foto para entregas
    if (_selectedStatus == 'delivered' && _imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('É necessário tirar uma foto para confirmar a entrega')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final deliveryService = DeliveryService(databaseService);
      
      await deliveryService.updateDeliveryStatus(
        widget.deliveryId,
        _selectedStatus,
      );

      // Em um app real, faríamos upload da foto para um servidor
      // e obteríamos a URL. Aqui, apenas salvamos o caminho local.
      String? photoUrl;
      if (_imageFile != null) {
        photoUrl = _imageFile!.path;
      }
      
      // Criar atualização de rastreamento
      final trackingUpdate = TrackingUpdate(
        id: _uuid.v4(),
        deliveryId: widget.deliveryId,
        status: _selectedStatus,
        location: _currentLocation!,
        description: _descriptionController.text.isNotEmpty
            ? _descriptionController.text
            : 'Status atualizado para ${_getStatusText(_selectedStatus)}',
        photoUrl: photoUrl,
        timestamp: DateTime.now(),
      );
      
      // Salvar no banco de dados local
      await _databaseService.saveTrackingUpdate(trackingUpdate);
      
      // Atualizar status da entrega
      final delivery = await _databaseService.getDelivery(widget.deliveryId);
      if (delivery != null) {
        final updatedDelivery = Delivery(
          id: delivery.id,
          packageId: delivery.packageId,
          clientId: delivery.clientId,
          driverId: delivery.driverId,
          origin: delivery.origin,
          destination: delivery.destination,
          status: _selectedStatus,
          estimatedDelivery: delivery.estimatedDelivery,
          createdAt: delivery.createdAt,
          updatedAt: DateTime.now(),
          client: delivery.client,
          driver: delivery.driver,
        );
        
        await _databaseService.saveDelivery(updatedDelivery);
        
        // Enviar notificação
        String notificationTitle;
        String notificationBody;
        
        switch (_selectedStatus) {
          case 'in_transit':
            notificationTitle = 'Entrega em trânsito';
            notificationBody = 'Sua entrega #${delivery.packageId} está a caminho!';
            break;
          case 'delivered':
            notificationTitle = 'Entrega concluída';
            notificationBody = 'Sua entrega #${delivery.packageId} foi entregue com sucesso!';
            break;
          case 'cancelled':
            notificationTitle = 'Entrega cancelada';
            notificationBody = 'Sua entrega #${delivery.packageId} foi cancelada.';
            break;
          default:
            notificationTitle = 'Atualização de entrega';
            notificationBody = 'O status da sua entrega #${delivery.packageId} foi atualizado.';
        }
        
        await _notificationService.showNotification(
          title: notificationTitle,
          body: notificationBody,
          payload: 'delivery_${delivery.id}',
        );
      }
      
      if (!mounted) return;
      
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao atualizar status: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Atualizar Status'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status atual
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline,
                      color: Colors.blue,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Status atual',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _getStatusText(widget.currentStatus),
                            style: TextStyle(
                              color: _getStatusColor(widget.currentStatus),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Seleção de novo status
            const Text(
              'Novo status',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            RadioListTile<String>(
              title: const Text('Pendente'),
              value: 'pending',
              groupValue: _selectedStatus,
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value!;
                });
              },
            ),
            RadioListTile<String>(
              title: const Text('Em trânsito'),
              value: 'in_transit',
              groupValue: _selectedStatus,
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value!;
                });
              },
            ),
            RadioListTile<String>(
              title: const Text('Entregue'),
              value: 'delivered',
              groupValue: _selectedStatus,
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value!;
                });
              },
            ),
            RadioListTile<String>(
              title: const Text('Cancelado'),
              value: 'cancelled',
              groupValue: _selectedStatus,
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value!;
                });
              },
            ),
            const SizedBox(height: 24),
            
            // Localização atual
            const Text(
              'Localização atual',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            _isLoadingLocation
                ? const Center(
                    child: Column(
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 8),
                        Text('Obtendo localização...'),
                      ],
                    ),
                  )
                : _currentLocation == null
                    ? Center(
                        child: Column(
                          children: [
                            const Text(
                              'Não foi possível obter a localização',
                              style: TextStyle(color: Colors.red),
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: _getCurrentLocation,
                              child: const Text('Tentar novamente'),
                            ),
                          ],
                        ),
                      )
                    : Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on,
                                    color: Colors.red,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      _currentLocation!.address,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Latitude: ${_currentLocation!.latitude.toStringAsFixed(6)}',
                                style: const TextStyle(
                                  color: Colors.grey,
                                ),
                              ),
                              Text(
                                'Longitude: ${_currentLocation!.longitude.toStringAsFixed(6)}',
                                style: const TextStyle(
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
            const SizedBox(height: 24),
            
            // Foto da entrega
            if (_selectedStatus == 'delivered') ...[
              const Text(
                'Foto da entrega',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              _imageFile == null
                  ? Column(
                      children: [
                        const Text(
                          'Tire uma foto da entrega para confirmar',
                          style: TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              onPressed: _takePicture,
                              icon: const Icon(Icons.camera_alt),
                              label: const Text('Tirar foto'),
                            ),
                            const SizedBox(width: 16),
                            OutlinedButton.icon(
                              onPressed: _pickPicture,
                              icon: const Icon(Icons.photo_library),
                              label: const Text('Galeria'),
                            ),
                          ],
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            _imageFile!,
                            width: double.infinity,
                            height: 200,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton.icon(
                          onPressed: _takePicture,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Trocar foto'),
                        ),
                      ],
                    ),
              const SizedBox(height: 24),
            ],
            
            // Descrição
            const Text(
              'Descrição (opcional)',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                hintText: 'Adicione informações sobre a entrega...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
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
            
            // Botão de atualização
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _updateStatus,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Atualizar Status'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
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

  String _getStatusText(String status) {
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