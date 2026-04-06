/**
 * A minimalist IndexedDB wrapper to treat a single object store as a key/value store.
 * Reused from friendkit.
 */
class MiniDB {
	private dbName: string;
	private storeName: string;
	private version: number;
	private db: IDBDatabase | null = null;

	constructor(dbName = 'bigears_db', storeName = 'kv', version = 1) {
		this.dbName = dbName;
		this.storeName = storeName;
		this.version = version;
	}

	private async getDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;

		return new Promise((resolve, reject) => {
			if (typeof indexedDB === 'undefined') {
				reject(new Error('IndexedDB is not supported in this environment.'));
				return;
			}
			const request = indexedDB.open(this.dbName, this.version);

			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName);
				}
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve(this.db);
			};

			request.onerror = () => reject(request.error);
		});
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(this.storeName, 'readonly');
				const store = transaction.objectStore(this.storeName);
				const request = store.get(key);

				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(request.error);
			});
		} catch (e) {
			console.error('MiniDB get error:', e);
			return null;
		}
	}

	async set<T>(key: string, value: T): Promise<void> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(this.storeName, 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const request = store.put(value, key);

				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (e) {
			console.error('MiniDB set error:', e);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			const db = await this.getDB();
			return new Promise((resolve, reject) => {
				const transaction = db.transaction(this.storeName, 'readwrite');
				const store = transaction.objectStore(this.storeName);
				const request = store.delete(key);

				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		} catch (e) {
			console.error('MiniDB delete error:', e);
		}
	}
}

export const db = new MiniDB();
