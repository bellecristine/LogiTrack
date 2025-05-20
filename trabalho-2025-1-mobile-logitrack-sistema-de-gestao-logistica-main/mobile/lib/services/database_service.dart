import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:async';
import 'package:uuid/uuid.dart';

import '../models/user.dart';
import '../models/delivery.dart';
import '../models/tracking_update.dart';
import '../models/location_data.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  static Database? _database;
  final _uuid = Uuid();

  factory DatabaseService() {
    return _instance;
  }

  DatabaseService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'logitrack.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDatabase,
    );
  }

  Future<void> _createDatabase(Database db, int version) async {
    // Tabela de usuários
    await db.execute('''
      CREATE TABLE users(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL
      )
    ''');

    // Tabela de entregas
    await db.execute('''
      CREATE TABLE deliveries(
        id TEXT PRIMARY KEY,
        packageId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        driverId TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        status TEXT NOT NULL,
        estimatedDelivery TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    ''');

    // Tabela de atualizações de rastreamento
    await db.execute('''
      CREATE TABLE tracking_updates(
        id TEXT PRIMARY KEY,
        deliveryId TEXT NOT NULL,
        status TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        photoUrl TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (deliveryId) REFERENCES deliveries (id)
      )
    ''');
  }

  // Métodos para usuários
  Future<void> saveUser(User user) async {
    final db = await database;
    await db.insert(
      'users',
      user.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<User?> getUser(String id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'users',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      return User.fromMap(maps.first);
    }
    return null;
  }

  Future<List<User>> getUsers({String? email, String? role}) async {
    final db = await database;
    
    String whereClause = '';
    List<dynamic> whereArgs = [];
    
    if (email != null) {
      whereClause += 'email = ?';
      whereArgs.add(email);
    }
    
    if (role != null) {
      if (whereClause.isNotEmpty) {
        whereClause += ' AND ';
      }
      whereClause += 'role = ?';
      whereArgs.add(role);
    }
    
    final List<Map<String, dynamic>> maps = await db.query(
      'users',
      where: whereClause.isNotEmpty ? whereClause : null,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
    );

    return List.generate(maps.length, (i) {
      return User.fromMap(maps[i]);
    });
  }

  // Métodos para entregas
  Future<void> saveDelivery(Delivery delivery) async {
    final db = await database;
    await db.insert(
      'deliveries',
      delivery.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // Salvar cliente e motorista, se disponíveis
    if (delivery.client != null) {
      await saveUser(delivery.client!);
    }
    if (delivery.driver != null) {
      await saveUser(delivery.driver!);
    }
  }

  Future<List<Delivery>> getDeliveries({String? status, String? userId, String? role}) async {
    final db = await database;
    
    String whereClause = '';
    List<dynamic> whereArgs = [];
    
    if (status != null) {
      if (status == 'active') {
        whereClause += "(status = 'pending' OR status = 'in_transit')";
      } else {
        whereClause += 'status = ?';
        whereArgs.add(status);
      }
    }
    
    if (userId != null && role != null) {
      if (whereClause.isNotEmpty) {
        whereClause += ' AND ';
      }
      
      if (role == 'client') {
        whereClause += 'clientId = ?';
      } else if (role == 'driver') {
        whereClause += 'driverId = ?';
      }
      
      whereArgs.add(userId);
    }
    
    final List<Map<String, dynamic>> maps = await db.query(
      'deliveries',
      where: whereClause.isNotEmpty ? whereClause : null,
      whereArgs: whereArgs.isNotEmpty ? whereArgs : null,
      orderBy: 'updatedAt DESC',
    );

    List<Delivery> deliveries = [];
    for (var map in maps) {
      Delivery delivery = Delivery.fromMap(map);
      
      // Carregar cliente e motorista
      if (delivery.clientId.isNotEmpty) {
        final client = await getUser(delivery.clientId);
        if (client != null) {
          delivery = delivery.copyWith(client: client);
        }
      }
      
      if (delivery.driverId != null && delivery.driverId!.isNotEmpty) {
        final driver = await getUser(delivery.driverId!);
        if (driver != null) {
          delivery = delivery.copyWith(driver: driver);
        }
      }
      
      deliveries.add(delivery);
    }
    
    return deliveries;
  }

  Future<Delivery?> getDelivery(String id) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'deliveries',
      where: 'id = ?',
      whereArgs: [id],
    );

    if (maps.isNotEmpty) {
      final deliveryMap = maps.first;
      
      // Carregar cliente
      User? client;
      if (deliveryMap['clientId'] != null) {
        client = await getUser(deliveryMap['clientId']);
      }
      
      // Carregar motorista
      User? driver;
      if (deliveryMap['driverId'] != null) {
        driver = await getUser(deliveryMap['driverId']);
      }
      
      return Delivery(
        id: deliveryMap['id'],
        packageId: deliveryMap['packageId'],
        clientId: deliveryMap['clientId'],
        driverId: deliveryMap['driverId'],
        origin: deliveryMap['origin'],
        destination: deliveryMap['destination'],
        status: deliveryMap['status'],
        estimatedDelivery: deliveryMap['estimatedDelivery'] != null
            ? DateTime.parse(deliveryMap['estimatedDelivery'])
            : null,
        createdAt: DateTime.parse(deliveryMap['createdAt']),
        updatedAt: DateTime.parse(deliveryMap['updatedAt']),
        client: client,
        driver: driver,
      );
    }
    return null;
  }

  // Métodos para atualizações de rastreamento
  Future<void> saveTrackingUpdate(TrackingUpdate update) async {
    final db = await database;
    await db.insert(
      'tracking_updates',
      update.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<TrackingUpdate>> getTrackingUpdates(String deliveryId) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'tracking_updates',
      where: 'deliveryId = ?',
      whereArgs: [deliveryId],
      orderBy: 'timestamp DESC',
    );

    return List.generate(maps.length, (i) {
      return TrackingUpdate.fromMap(maps[i]);
    });
  }

  // Método para criar dados de teste
  Future<void> createTestData() async {
    // Limpar banco de dados existente
    final db = await database;
    await db.delete('tracking_updates');
    await db.delete('deliveries');
    await db.delete('users');
    
    // Criar usuários de teste
    final client = User(
      id: '1',
      name: 'Cliente Teste',
      email: 'cliente@teste.com',
      role: 'client',
    );
    
    final driver = User(
      id: '2',
      name: 'Motorista Teste',
      email: 'motorista@teste.com',
      role: 'driver',
    );
    
    await saveUser(client);
    await saveUser(driver);
    
    // Criar entregas de teste
    final delivery1 = Delivery(
      id: '1',
      packageId: 'PKG001',
      clientId: client.id,
      driverId: driver.id,
      origin: 'Rua A, 123 - São Paulo, SP',
      destination: 'Rua B, 456 - Rio de Janeiro, RJ',
      status: 'in_transit',
      estimatedDelivery: DateTime.now().add(const Duration(days: 2)),
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      updatedAt: DateTime.now(),
      client: client,
      driver: driver,
    );
    
    final delivery2 = Delivery(
      id: '2',
      packageId: 'PKG002',
      clientId: client.id,
      driverId: null,
      origin: 'Rua C, 789 - Belo Horizonte, MG',
      destination: 'Rua D, 012 - Brasília, DF',
      status: 'pending',
      estimatedDelivery: DateTime.now().add(const Duration(days: 5)),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      client: client,
      driver: null,
    );
    
    final delivery3 = Delivery(
      id: '3',
      packageId: 'PKG003',
      clientId: client.id,
      driverId: driver.id,
      origin: 'Rua E, 345 - Curitiba, PR',
      destination: 'Rua F, 678 - Florianópolis, SC',
      status: 'delivered',
      estimatedDelivery: DateTime.now().subtract(const Duration(days: 1)),
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      client: client,
      driver: driver,
    );
    
    await saveDelivery(delivery1);
    await saveDelivery(delivery2);
    await saveDelivery(delivery3);
    
    // Criar atualizações de rastreamento
    final update1 = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: delivery1.id,
      status: 'pending',
      location: LocationData(
        latitude: -23.550520,
        longitude: -46.633308,
        address: 'São Paulo, SP',
      ),
      description: 'Entrega registrada no sistema',
      photoUrl: null,
      timestamp: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
    );
    
    final update2 = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: delivery1.id,
      status: 'in_transit',
      location: LocationData(
        latitude: -22.906847,
        longitude: -43.172897,
        address: 'Rio de Janeiro, RJ',
      ),
      description: 'Entrega em trânsito',
      photoUrl: null,
      timestamp: DateTime.now().subtract(const Duration(hours: 6)),
    );
    
    final update3 = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: delivery3.id,
      status: 'pending',
      location: LocationData(
        latitude: -25.428954,
        longitude: -49.267137,
        address: 'Curitiba, PR',
      ),
      description: 'Entrega registrada no sistema',
      photoUrl: null,
      timestamp: DateTime.now().subtract(const Duration(days: 3, hours: 2)),
    );
    
    final update4 = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: delivery3.id,
      status: 'in_transit',
      location: LocationData(
        latitude: -25.428954,
        longitude: -49.267137,
        address: 'Curitiba, PR',
      ),
      description: 'Entrega em trânsito',
      photoUrl: null,
      timestamp: DateTime.now().subtract(const Duration(days: 2, hours: 6)),
    );
    
    final update5 = TrackingUpdate(
      id: _uuid.v4(),
      deliveryId: delivery3.id,
      status: 'delivered',
      location: LocationData(
        latitude: -27.596910,
        longitude: -48.549778,
        address: 'Florianópolis, SC',
      ),
      description: 'Entrega concluída com sucesso',
      photoUrl: null,
      timestamp: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
    );
    
    await saveTrackingUpdate(update1);
    await saveTrackingUpdate(update2);
    await saveTrackingUpdate(update3);
    await saveTrackingUpdate(update4);
    await saveTrackingUpdate(update5);
  }
}