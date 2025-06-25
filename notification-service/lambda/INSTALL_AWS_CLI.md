# 🔧 INSTALAÇÃO AWS CLI - Windows

## 📥 Método 1: Instalador MSI (Recomendado)

1. **Baixar AWS CLI v2**
   - Acesse: https://aws.amazon.com/cli/
   - Baixe: `AWSCLIV2.msi` (64-bit)

2. **Instalar**
   - Execute o arquivo `.msi` baixado
   - Siga o assistente de instalação
   - Reinicie o PowerShell/CMD

3. **Verificar Instalação**
   ```powershell
   aws --version
   # Deve mostrar: aws-cli/2.x.x Python/3.x.x Windows/10 exe/AMD64
   ```

## 📥 Método 2: Chocolatey

```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar AWS CLI
choco install awscli
```

## 📥 Método 3: PowerShell (Scoop)

```powershell
# Instalar Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar AWS CLI
scoop install aws
```

## ⚙️ CONFIGURAÇÃO AWS

### 1. Obter Credenciais AWS
- Acesse o Console AWS: https://console.aws.amazon.com/
- Vá em **IAM** > **Users** > Seu usuário > **Security credentials**
- Clique em **Create access key**
- Copie:
  - **Access Key ID**
  - **Secret Access Key**

### 2. Configurar AWS CLI
```powershell
aws configure
```

**Informações solicitadas:**
```
AWS Access Key ID [None]: AKIA...
AWS Secret Access Key [None]: wJalrXUtn...  
Default region name [None]: us-east-1
Default output format [None]: json
```

### 3. Testar Configuração
```powershell
aws sts get-caller-identity
```

**Resposta esperada:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012", 
    "Arn": "arn:aws:iam::123456789012:user/DevAdmin"
}
```

## 🚀 APÓS INSTALAÇÃO

### Deploy LogiTrack Lambda
```powershell
# Voltar para o diretório lambda
cd C:\Users\KABUM\Documents\Trabalho lab DAMD\LogiTrack-1\notification-service\lambda

# Executar deploy
npm run deploy
```

## 🔧 Troubleshooting

### Erro: "aws não é reconhecido"
- Reinicie o PowerShell/CMD
- Verifique se o AWS CLI foi adicionado ao PATH
- Execute: `refreshenv` (se usar Chocolatey)

### Erro: Permissões PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: Credenciais inválidas
```powershell
aws configure list
aws sts get-caller-identity
```

## 📞 Contato

Se precisar de ajuda:
1. Verifique se seguiu todos os passos
2. Teste cada comando individualmente  
3. Consulte a documentação oficial: https://docs.aws.amazon.com/cli/ 