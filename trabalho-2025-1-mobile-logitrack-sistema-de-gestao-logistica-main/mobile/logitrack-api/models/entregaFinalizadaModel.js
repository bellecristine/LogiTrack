const db = require('../database/db');

/**
 * Salva uma nova entrega finalizada no banco
 */
async function salvarEntregaFinalizada({ entregaId, latitude, longitude, fotoPath }) {
  await db.run(
    `INSERT INTO entregas_finalizadas (entrega_id, latitude, longitude, foto_path, data_hora)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [entregaId, latitude, longitude, fotoPath]
  );
}

module.exports = {
  salvarEntregaFinalizada,
};
