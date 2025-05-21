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
      id: map['id'],
      entregaId: map['entrega_id'],
      latitude: map['latitude'],
      longitude: map['longitude'],
      fotoPath: map['foto_path'],
    );
  }
}
