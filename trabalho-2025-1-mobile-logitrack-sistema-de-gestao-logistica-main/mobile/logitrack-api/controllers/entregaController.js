const db = require('../database/db');

exports.finalizarEntrega = async (req, res) => {
  const entregaId = req.params.id;
  const { latitude, longitude } = req.body;
  const fotoPath = req.file?.path;

  if (!latitude || !longitude || !fotoPath) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    await db.run(
      `INSERT INTO entregas_finalizadas (entrega_id, latitude, longitude, foto_path, data_hora)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [entregaId, latitude, longitude, fotoPath]
    );

    res.status(201).json({ message: 'Entrega registrada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar entrega' });
  }
};
