import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'services/preferences_service.dart';
import 'services/notification_service.dart';
import 'services/database_service.dart';
import 'services/location_service.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar serviços
  final notificationService = NotificationService();
  await notificationService.initialize();
  await notificationService.requestPermissions();
  
  // Inicializar banco de dados
  final databaseService = DatabaseService();
  await databaseService.database;
  
  // Configurar orientação do dispositivo
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Carregar tema
  final preferencesService = PreferencesService();
  final theme = await preferencesService.getTheme();
  
  runApp(
    MultiProvider(
      providers: [
        Provider<NotificationService>.value(value: notificationService),
        Provider<DatabaseService>.value(value: databaseService),
        Provider<LocationService>.value(value: LocationService()),
        Provider<PreferencesService>.value(value: preferencesService),
        Provider<AuthService>.value(value: AuthService()),
        ChangeNotifierProvider(
          create: (_) => ThemeModel(theme == 'dark' ? ThemeMode.dark : ThemeMode.light),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class ThemeModel extends ChangeNotifier {
  ThemeMode _themeMode;
  
  ThemeModel(this._themeMode);
  
  ThemeMode get themeMode => _themeMode;
  
  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeModel = Provider.of<ThemeModel>(context);
    
    return MaterialApp(
      title: 'LogiTrack',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      
    );
  }
}