import 'dart:convert';
import 'location_data.dart';

class TrackingUpdate {
  final String id;
  final String deliveryId;
  final String status;
  final LocationData location;
  final String? description;
  final String? photoUrl;
  final DateTime timestamp;

  TrackingUpdate({
    required this.id,
    required this.deliveryId,
    required this.status,
    required this.location,
    this.description,
    this.photoUrl,
    required this.timestamp,
  });

  factory TrackingUpdate.fromJson(Map<String, dynamic> json) {
    var locationData;
    if (json['location'] is String) {
      try {
        locationData = LocationData.fromJson(jsonDecode(json['location']));
      } catch (e) {
        print('Erro ao decodificar location: $e');
        locationData = LocationData(
          latitude: 0.0,
          longitude: 0.0,
          address: 'Erro ao decodificar localização',
        );
      }
    } else if (json['location'] is Map) {
      locationData = LocationData.fromJson(json['location'] as Map<String, dynamic>);
    } else {
      locationData = LocationData(
        latitude: 0.0,
        longitude: 0.0,
        address: 'Formato de localização desconhecido',
      );
    }

    return TrackingUpdate(
      id: json['id'],
      deliveryId: json['deliveryId'],
      status: json['status'],
      location: locationData,
      description: json['description'],
      photoUrl: json['photoUrl'],
      timestamp: json['timestamp'] is String 
          ? DateTime.parse(json['timestamp']) 
          : DateTime.fromMillisecondsSinceEpoch(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'deliveryId': deliveryId,
      'status': status,
      'location': location.toJson(),
      'description': description,
      'photoUrl': photoUrl,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'deliveryId': deliveryId,
      'status': status,
      'location': jsonEncode(location.toMap()),
      'description': description,
      'photoUrl': photoUrl,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory TrackingUpdate.fromMap(Map<String, dynamic> map) {
    return TrackingUpdate(
      id: map['id'],
      deliveryId: map['deliveryId'],
      status: map['status'],
      location: LocationData.fromJson(jsonDecode(map['location'])),
      description: map['description'],
      photoUrl: map['photoUrl'],
      timestamp: DateTime.parse(map['timestamp']),
    );
  }
}