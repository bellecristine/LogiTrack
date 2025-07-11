import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:async';
import 'package:uuid/uuid.dart';

import '../models/user.dart';
import '../models/delivery.dart';
import '../models/tracking_update.dart';
import '../models/location_data.dart';
import '../models/entrega_pendente.dart';

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

    // Tabela de entregas pendentes
    await db.execute('''
      CREATE TABLE entregas_pendentes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entrega_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        foto_path TEXT NOT NULL
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

    if (delivery.client != null) {
      await saveUser(delivery.client!);
    }
    if (delivery.driver != null) {
      await saveUser(delivery.driver!);
    }
  }

  Future<List<Delivery>> getDeliveries(
      {String? status, String? userId, String? role}) async {
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

      User? client;
      if (deliveryMap['clientId'] != null) {
        client = await getUser(deliveryMap['clientId']);
      }

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

  // 🔄 Métodos para entregas pendentes
  Future<void> saveEntregaPendente(EntregaPendente entrega) async {
    final db = await database;
    await db.insert(
      'entregas_pendentes',
      entrega.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<EntregaPendente>> getEntregasPendentes() async {
    final db = await database;
    final List<Map<String, dynamic>> maps =
        await db.query('entregas_pendentes');
    return maps.map((e) => EntregaPendente.fromMap(e)).toList();
  }

  Future<void> deleteEntregaPendente(int id) async {
    final db = await database;
    await db.delete('entregas_pendentes', where: 'id = ?', whereArgs: [id]);
  }

  // Você pode manter seu método de testes ou removê-lo para produção
}
