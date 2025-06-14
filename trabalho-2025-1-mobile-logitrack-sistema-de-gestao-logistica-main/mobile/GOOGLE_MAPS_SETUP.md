# Configuração do Google Maps API

Para que o aplicativo funcione corretamente com mapas, você precisa configurar a API do Google Maps.

## Passos para configuração:

### 1. Obter API Key do Google Maps
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Maps para Android e iOS
4. Crie uma API Key

### 2. Configurar Android
No arquivo `android/app/src/main/AndroidManifest.xml`, substitua `YOUR_GOOGLE_MAPS_API_KEY_HERE` pela sua API Key:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="SUA_API_KEY_AQUI" />
```

### 3. Configurar iOS
No arquivo `ios/Runner/AppDelegate.swift`, substitua `YOUR_GOOGLE_MAPS_API_KEY_HERE` pela sua API Key:

```swift
GMSServices.provideAPIKey("SUA_API_KEY_AQUI")
```

### 4. Restrições de API Key (Recomendado)
- Para Android: Adicione a assinatura SHA-1 do seu app
- Para iOS: Adicione o Bundle ID do seu app

## Nota Importante
Sem a configuração correta da API Key, os mapas não funcionarão no aplicativo. 