const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const dbPromise = open({
  filename: './database/entregas.db',
  driver: sqlite3.Database
});

(async () => {
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
})();

module.exports = dbPromise;
