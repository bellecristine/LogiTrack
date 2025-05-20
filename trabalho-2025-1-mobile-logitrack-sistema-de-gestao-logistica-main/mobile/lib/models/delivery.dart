import 'user.dart';

class Delivery {
  final String id;
  final String packageId;
  final String clientId;
  final String? driverId;
  final String origin;
  final String destination;
  final String status; // 'pending', 'in_transit', 'delivered', 'cancelled'
  final DateTime? estimatedDelivery;
  final DateTime createdAt;
  final DateTime updatedAt;
  final User? client;
  final User? driver;

  Delivery({
    required this.id,
    required this.packageId,
    required this.clientId,
    this.driverId,
    required this.origin,
    required this.destination,
    required this.status,
    this.estimatedDelivery,
    required this.createdAt,
    required this.updatedAt,
    this.client,
    this.driver,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'],
      packageId: json['packageId'],
      clientId: json['clientId'],
      driverId: json['driverId'],
      origin: json['origin'],
      destination: json['destination'],
      status: json['status'],
      estimatedDelivery: json['estimatedDelivery'] != null
          ? DateTime.parse(json['estimatedDelivery'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      client: json['client'] != null ? User.fromJson(json['client']) : null,
      driver: json['driver'] != null ? User.fromJson(json['driver']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'packageId': packageId,
      'clientId': clientId,
      'driverId': driverId,
      'origin': origin,
      'destination': destination,
      'status': status,
      'estimatedDelivery': estimatedDelivery?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  Map<String, dynamic> toMap() {
    return toJson();
  }

  factory Delivery.fromMap(Map<String, dynamic> map) {
    return Delivery(
      id: map['id'],
      packageId: map['packageId'],
      clientId: map['clientId'],
      driverId: map['driverId'],
      origin: map['origin'],
      destination: map['destination'],
      status: map['status'],
      estimatedDelivery: map['estimatedDelivery'] != null
          ? DateTime.parse(map['estimatedDelivery'])
          : null,
      createdAt: DateTime.parse(map['createdAt']),
      updatedAt: DateTime.parse(map['updatedAt']),
      client: null, // Será carregado separadamente
      driver: null, // Será carregado separadamente
    );
  }

  Delivery copyWith({
    String? id,
    String? packageId,
    String? clientId,
    String? driverId,
    String? origin,
    String? destination,
    String? status,
    DateTime? estimatedDelivery,
    DateTime? createdAt,
    DateTime? updatedAt,
    User? client,
    User? driver,
  }) {
    return Delivery(
      id: id ?? this.id,
      packageId: packageId ?? this.packageId,
      clientId: clientId ?? this.clientId,
      driverId: driverId ?? this.driverId,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      status: status ?? this.status,
      estimatedDelivery: estimatedDelivery ?? this.estimatedDelivery,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      client: client ?? this.client,
      driver: driver ?? this.driver,
    );
  }
}