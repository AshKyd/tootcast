import { db } from './db';
import type { UserSession } from './mastodon';

/**
 * A reactive auth store using Svelte 5 Runes ($state).
 */
class AuthStore {
	#session = $state<UserSession | null>(null);
	#initialized = $state(false);

	get session() {
		return this.#session;
	}

	get initialized() {
		return this.#initialized;
	}

	async init() {
		if (this.#initialized) return;
		this.#session = await db.get<UserSession>('session');
		this.#initialized = true;
	}

	async setSession(session: UserSession | null) {
		this.#session = session;
		if (session) {
			await db.set('session', session);
		} else {
			await db.delete('session');
		}
	}
}

export const auth = new AuthStore();
