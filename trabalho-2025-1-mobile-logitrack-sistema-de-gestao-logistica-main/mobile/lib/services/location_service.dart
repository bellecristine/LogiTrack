import 'package:location/location.dart' as loc;
import 'dart:async';
import 'package:flutter/services.dart';

import '../models/location_data.dart' as model;

class LocationService {
  final loc.Location _location = loc.Location();
  
  
  Stream<model.LocationData>? _locationStream;
  
  
  Future<model.LocationData?> getCurrentLocation() async {
    bool serviceEnabled;
    loc.PermissionStatus permissionGranted;

    try {
     
      serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          return null;
        }
      }


      permissionGranted = await _location.hasPermission();
      if (permissionGranted == loc.PermissionStatus.denied) {
        permissionGranted = await _location.requestPermission();
        if (permissionGranted != loc.PermissionStatus.granted) {
          return null;
        }
      }

     
      final locationData = await _location.getLocation();
      
      if (locationData.latitude == null || locationData.longitude == null) {
        throw PlatformException(
          code: 'LOCATION_DATA_NULL',
          message: 'Dados de localização são nulos',
        );
      }
      
      return model.LocationData(
        latitude: locationData.latitude!,
        longitude: locationData.longitude!,
        address: 'Localização atual', 
      );
    } catch (e) {
      print('Erro ao obter localização: $e');
      
     
      if (e is PlatformException) {
        return model.LocationData(
          latitude: -23.550520,
          longitude: -46.633308,
          address: 'Localização simulada (São Paulo)',
        );
      }
      return null;
    }
  }

  Stream<model.LocationData> getLocationStream() {
    _locationStream ??= _location.onLocationChanged.map((loc.LocationData locationData) {
        return model.LocationData(
          latitude: locationData.latitude ?? 0.0,
          longitude: locationData.longitude ?? 0.0,
          address: 'Localização atual', 
        );
      });
    
    return _locationStream!;
  }
  
  
  model.LocationData getSimulatedLocation() {
    return model.LocationData(
      latitude: -23.550520,
      longitude: -46.633308,
      address: 'Localização simulada (São Paulo)',
    );
  }
}