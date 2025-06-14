const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório database existe
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPromise = open({
  filename: path.join(__dirname, 'entregas.db'),
  driver: sqlite3.Database
});

(async () => {
  try {
    const db = await dbPromise;
    await db.exec(`
      CREATE TABLE IF NOT EXISTS entregas_finalizadas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entrega_id TEXT,
        latitude REAL,
        longitude REAL,
        foto_path TEXT,
        data_hora TEXT
      );
    `);
    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  }
})();

module.exports = dbPromise;
