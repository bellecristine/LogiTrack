const { salvarEntregaFinalizada } = require('../models/entregaFinalizadaModel');

exports.finalizarEntrega = async (req, res) => {
  const entregaId = req.params.id;
  const { latitude, longitude } = req.body;
  const fotoPath = req.file?.path;

  if (!latitude || !longitude || !fotoPath) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    await salvarEntregaFinalizada({
      entregaId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      fotoPath,
    });

    res.status(201).json({ message: 'Entrega registrada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar entrega' });
  }
};
