require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const entregaRoutes = require('./routes/entregas');
const app = express();

// Criar diretório uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/entregas', entregaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
