# LogiTrack - Sistema de Gestão Logística

Sistema completo de rastreamento e gestão de entregas, composto por microserviços backend e aplicativo mobile Flutter.

## 🏗️ Arquitetura

O projeto é composto por:
- **Auth Service** (Node.js + SQLite) - Microserviço de autenticação
- **Tracking Service** (Node.js + PostgreSQL) - Microserviço de rastreamento
- **Mobile App** (Flutter) - Aplicativo para clientes e motoristas
-
-

## 🚀 Instalação Rápida

### Windows
Execute o script de setup:
```batch
setup.bat
```

### Manual
1. **Instalar dependências do Auth Service:**
```bash
cd auth-service
npm install
```

2. **Instalar dependências do Tracking Service:**
```bash
cd tracking-service
npm install
```

3. **Instalar dependências do Flutter:**
```bash
cd trabalho-2025-1-mobile-logitrack-sistema-de-gestao-logistica-main/mobile
flutter pub get
```

## 🏃‍♂️ Executar o Sistema

### Iniciar todos os serviços (Windows)
```batch
start-services.bat
```

### Iniciar manualmente

1. **Auth Service:**
```bash
cd auth-service
npm run dev
```

2. **Tracking Service:**
```bash
cd tracking-service
npm run dev
```

3. **App Mobile:**
```bash
cd trabalho-2025-1-mobile-logitrack-sistema-de-gestao-logistica-main/mobile
flutter run
```

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) >= 16.0.0
- [Flutter](https://flutter.dev/) >= 3.0.0
- [PostgreSQL](https://www.postgresql.org/) (para Tracking Service)
- Android Studio ou VS Code com Flutter/Dart

## 🔧 Configuração

### Banco de Dados
- **Auth Service**: SQLite (criado automaticamente)
- **Tracking Service**: PostgreSQL (configurar em `tracking-service/config.env`)

### Variáveis de Ambiente
Os arquivos `.env` estão localizados em:
- `auth-service/config.env`
- `tracking-service/config.env`

## 📱 Funcionalidades

### Para Clientes
- ✅ Cadastro e login
- ✅ Criar novas entregas
- ✅ Rastrear entregas em tempo real
- ✅ Histórico de entregas
- ✅ Notificações push

### Para Motoristas
- ✅ Login
- ✅ Visualizar entregas disponíveis
- ✅ Aceitar/recusar entregas
- ✅ Atualizar status das entregas
- ✅ Capturar fotos de entrega
- ✅ Navegação GPS

## 🌐 URLs dos Serviços

- **Auth Service**: http://localhost:3001
- **Tracking Service**: http://localhost:3002
- **Mobile App**: Emulador/Dispositivo

## 📚 Documentação

Cada serviço possui sua própria documentação:
- [Auth Service README](auth-service/README.md)
- [Tracking Service README](tracking-service/README.md)
- [Mobile App README](trabalho-2025-1-mobile-logitrack-sistema-de-gestao-logistica-main/mobile/README.md)

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de dependências Flutter:**
```bash
flutter clean
flutter pub get
```

2. **Erro de conexão PostgreSQL:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais em `tracking-service/config.env`

3. **Portas ocupadas:**
- Auth Service: porta 3001
- Tracking Service: porta 3002
- Use `netstat -ano | findstr :PORTA` para verificar


## 📄 Licença

Este projeto é licenciado sob a MIT License. 
