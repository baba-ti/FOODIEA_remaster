import * as SQLite from 'expo-sqlite';

let databasePromise;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('foodia.db').then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS restaurant_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          restaurant_name TEXT NOT NULL,
          menu_name TEXT NOT NULL,
          rating REAL NOT NULL,
          note TEXT NOT NULL DEFAULT '',
          tags TEXT NOT NULL DEFAULT '',
          image_uri TEXT,
          visited_at TEXT NOT NULL,
          address TEXT NOT NULL DEFAULT '',
          latitude REAL,
          longitude REAL,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
      `);
      const columns = await database.getAllAsync('PRAGMA table_info(restaurant_records)');
      const columnNames = new Set(columns.map((column) => column.name));
      if (!columnNames.has('latitude')) {
        await database.execAsync('ALTER TABLE restaurant_records ADD COLUMN latitude REAL;');
      }
      if (!columnNames.has('longitude')) {
        await database.execAsync('ALTER TABLE restaurant_records ADD COLUMN longitude REAL;');
      }
      return database;
    });
  }
  return databasePromise;
}

function mapRecord(row) {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    menuName: row.menu_name,
    rating: row.rating,
    note: row.note,
    tags: row.tags ? row.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
    imageUri: row.image_uri,
    visitedAt: row.visited_at,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
  };
}

export async function listRestaurantRecords() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    'SELECT * FROM restaurant_records ORDER BY visited_at DESC, id DESC',
  );
  return rows.map(mapRecord);
}

export async function listFavoriteRestaurantRecords(limit = 5) {
  const database = await getDatabase();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
  const rows = await database.getAllAsync(
    'SELECT * FROM restaurant_records WHERE is_favorite = 1 ORDER BY rating DESC, visited_at DESC, id DESC LIMIT ?',
    safeLimit,
  );
  return rows.map(mapRecord);
}

export async function listRecentRestaurantRecords(days = 3, limit = 10) {
  const database = await getDatabase();
  const safeDays = Math.max(1, Math.min(Number(days) || 3, 30));
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 20));
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - safeDays + 1);
  const cutoffDate = [
    cutoff.getFullYear(),
    String(cutoff.getMonth() + 1).padStart(2, '0'),
    String(cutoff.getDate()).padStart(2, '0'),
  ].join('-');
  const rows = await database.getAllAsync(
    'SELECT * FROM restaurant_records WHERE visited_at >= ? ORDER BY visited_at DESC, id DESC LIMIT ?',
    cutoffDate,
    safeLimit,
  );
  return rows.map(mapRecord);
}

export async function addRestaurantRecord(record) {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO restaurant_records
      (restaurant_name, menu_name, rating, note, tags, image_uri, visited_at, address, latitude, longitude, is_favorite, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.restaurantName,
    record.menuName,
    record.rating,
    record.note || '',
    (record.tags || []).join(','),
    record.imageUri || null,
    record.visitedAt,
    record.address || '',
    record.latitude ?? null,
    record.longitude ?? null,
    record.isFavorite ? 1 : 0,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function deleteRestaurantRecord(id) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM restaurant_records WHERE id = ?', id);
}

export async function setRestaurantFavorite(id, isFavorite) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE restaurant_records SET is_favorite = ? WHERE id = ?',
    isFavorite ? 1 : 0,
    id,
  );
}

export async function updateRestaurantCoordinates(id, latitude, longitude) {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE restaurant_records SET latitude = ?, longitude = ? WHERE id = ?',
    latitude,
    longitude,
    id,
  );
}
