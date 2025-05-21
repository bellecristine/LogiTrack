require('dotenv').config();
const express = require('express');
const entregaRoutes = require('./routes/entregas');
const app = express();

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/entregas', entregaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
