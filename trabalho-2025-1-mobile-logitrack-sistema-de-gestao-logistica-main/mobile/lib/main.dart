import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'services/sync_service.dart';
import 'services/preferences_service.dart';
import 'services/notification_service.dart';
import 'services/database_service.dart';
import 'services/location_service.dart';
import 'services/auth_service.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializar serviços
  final notificationService = NotificationService();
  await notificationService.initialize();
  await notificationService.requestPermissions();

  final databaseService = DatabaseService();
  await databaseService.database;

  // Inicializar sincronização de entregas pendentes
  await SyncService().sincronizarPendentes(); // Sincroniza ao iniciar
  SyncService().startListeningConnectionChanges(); // Escuta mudanças de conexão

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
          create: (_) =>
              ThemeModel(theme == 'dark' ? ThemeMode.dark : ThemeMode.light),
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

  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  void setTheme(ThemeMode themeMode) {
    _themeMode = themeMode;
    notifyListeners();
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeModel>(
      builder: (context, themeModel, child) {
        return MaterialApp(
          title: 'LogiTrack',
          debugShowCheckedModeBanner: false,
          themeMode: themeModel.themeMode,
          theme: ThemeData(
            primarySwatch: Colors.blue,
            brightness: Brightness.light,
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            primarySwatch: Colors.blue,
            brightness: Brightness.dark,
            useMaterial3: true,
          ),
          home: const SplashScreen(),
        );
      },
    );
  }
}
