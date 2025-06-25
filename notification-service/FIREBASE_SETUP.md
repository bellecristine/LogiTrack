# 🔥 **GUIA COMPLETO - CONFIGURAÇÃO FIREBASE PARA LOGITRACK**

## 📋 **PASSO A PASSO COMPLETO**

### **🎯 Passo 1: Criar Projeto Firebase**

1. **Acesse:** https://console.firebase.google.com/
2. **Faça login** com sua conta Google
3. **Clique em "Add project"** (Adicionar projeto)
4. **Nome do projeto:** `LogiTrack` (ou o nome que preferir)
5. **Clique em "Continue"** e siga as instruções
6. **Clique em "Create project"**

### **🎯 Passo 2: Habilitar Cloud Messaging**

7. **No painel do projeto, clique em:**
   - Ícone de engrenagem (⚙️) → `Project Settings`
   - Aba `Cloud Messaging`
   - **Anote o SERVER KEY** (será usado mais tarde se necessário)

### **🎯 Passo 3: Gerar Service Account (MAIS IMPORTANTE)**

8. **Ainda em Project Settings:**
   - Vá na aba `Service accounts`
   - Clique em `Generate new private key`
   - **BAIXE O ARQUIVO JSON** (exemplo: `logitrack-firebase-adminsdk-xxxxx.json`)

### **🎯 Passo 4: Extrair Informações do JSON**

Quando você baixar o arquivo JSON, ele terá esta estrutura:

```json
{
  "type": "service_account",
  "project_id": "logitrack-12345",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@logitrack-12345.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40logitrack-12345.iam.gserviceaccount.com"
}
```

### **🎯 Passo 5: Configurar no LogiTrack**

Copie o arquivo `config.env.example` para `config.env`:

```bash
cp config.env.example config.env
```

Edite o arquivo `config.env` e substitua estas variáveis:

```env
# ==========================================
# CONFIGURAÇÕES DO FIREBASE - ⚠️ OBRIGATÓRIO PARA PUSH
# ==========================================

# Do arquivo JSON baixado:
FIREBASE_PROJECT_ID=logitrack-12345
FIREBASE_PRIVATE_KEY_ID=abc123def456...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@logitrack-12345.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
```

**⚠️ ATENÇÃO:**
- Use aspas duplas na `FIREBASE_PRIVATE_KEY`
- Mantenha os `\n` na private key
- Não remova as aspas duplas

### **🎯 Passo 6: Registrar Apps Mobile (Opcional agora)**

**Para Android:**
- Clique no ícone Android no dashboard
- Package name: `com.example.logitrack`
- Baixar `google-services.json` (para o app Flutter)

**Para iOS:**
- Clique no ícone iOS no dashboard
- Bundle ID: `com.example.logitrack`
- Baixar `GoogleService-Info.plist` (para o app Flutter)

### **🎯 Passo 7: Testar a Configuração**

Execute o teste para verificar se está funcionando:

```bash
cd notification-service
npm install
node test-trigger.js
```

Se aparecer `✅ Firebase configurado corretamente!`, está tudo certo!

## 🔧 **EXEMPLO DE CONFIGURAÇÃO COMPLETA**

Seu arquivo `config.env` deve ficar assim:

```env
# Configurações do Servidor
PORT=3003
NODE_ENV=development

# MongoDB (já configurado)
MONGODB_URI=mongodb+srv://logitrack:VKLXhZkwOlvQjGD2@cluster0.hnxrp.mongodb.net/logitrack_notifications?retryWrites=true&w=majority&appName=Cluster0

# Redis (já configurado)
REDIS_URL=redis://default:AYJwAAIjcDFjMzJiZGE4ZGU2ZTY0NzM5YTJlNjU2NDcwZGJjNzJjMnAxMA@mutual-stallion-42264.upstash.io:6379

# E-mail (já configurado)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app

# JWT (já configurado)
JWT_SECRET=sua_chave_jwt_super_secreta

# FIREBASE - ADICIONE AQUI ⬇️
FIREBASE_PROJECT_ID=seu-projeto-firebase
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_PRIVATE_KEY_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu-client-id
```

## 🚀 **PRÓXIMOS PASSOS**

1. **Criar o projeto Firebase** (passos 1-3)
2. **Baixar o arquivo JSON** (passo 3)
3. **Configurar o config.env** (passos 4-5)
4. **Testar** (passo 7)
5. **Integrar no app mobile** (quando necessário)

## ❓ **DÚVIDAS FREQUENTES**

**Q: Preciso criar apps Android/iOS agora?**
A: Não! Por enquanto só precisamos do Service Account para o backend funcionar.

**Q: Onde fico o arquivo JSON baixado?**
A: Guarde em local seguro! Não commite no Git. Use as informações dele no config.env.

**Q: Como sei se está funcionando?**
A: Execute `node test-trigger.js` e veja se aparece "Firebase configurado corretamente!".

**Q: É grátis?**
A: Sim! O Firebase tem um plano gratuito generoso para push notifications. 