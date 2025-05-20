class User {
  final String id;
  final String name;
  final String email;
  final String role; // 'client', 'driver', 'operator'

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
    };
  }

  Map<String, dynamic> toMap() {
    return toJson();
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User.fromJson(map);
  }

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, role: $role)';
  }
}