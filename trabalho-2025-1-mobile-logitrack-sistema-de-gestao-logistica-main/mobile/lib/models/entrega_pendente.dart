class EntregaPendente {
  final int? id;
  final String entregaId;
  final double latitude;
  final double longitude;
  final String fotoPath;

  EntregaPendente({
    this.id,
    required this.entregaId,
    required this.latitude,
    required this.longitude,
    required this.fotoPath,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'entrega_id': entregaId,
      'latitude': latitude,
      'longitude': longitude,
      'foto_path': fotoPath,
    };
  }

  factory EntregaPendente.fromMap(Map<String, dynamic> map) {
    return EntregaPendente(
      id: map['id']?.toInt(),
      entregaId: map['entrega_id'] ?? '',
      latitude: map['latitude']?.toDouble() ?? 0.0,
      longitude: map['longitude']?.toDouble() ?? 0.0,
      fotoPath: map['foto_path'] ?? '',
    );
  }

  @override
  String toString() {
    return 'EntregaPendente{id: $id, entregaId: $entregaId, latitude: $latitude, longitude: $longitude, fotoPath: $fotoPath}';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is EntregaPendente &&
        other.id == id &&
        other.entregaId == entregaId &&
        other.latitude == latitude &&
        other.longitude == longitude &&
        other.fotoPath == fotoPath;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        entregaId.hashCode ^
        latitude.hashCode ^
        longitude.hashCode ^
        fotoPath.hashCode;
  }
} 