class LocationData {
  final double latitude;
  final double longitude;
  final String address;

  LocationData({
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  factory LocationData.fromJson(Map<String, dynamic> json) {
    return LocationData(
      latitude: (json['latitude'] is int) 
          ? (json['latitude'] as int).toDouble() 
          : json['latitude'] as double,
      longitude: (json['longitude'] is int) 
          ? (json['longitude'] as int).toDouble() 
          : json['longitude'] as double,
      address: json['address'] ?? 'Endereço desconhecido',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
    };
  }

  Map<String, dynamic> toMap() {
    return toJson();
  }

  factory LocationData.fromMap(Map<String, dynamic> map) {
    return LocationData.fromJson(map);
  }

  @override
  String toString() {
    return 'LocationData(latitude: $latitude, longitude: $longitude, address: $address)';
  }
}