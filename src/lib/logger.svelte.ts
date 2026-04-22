import { browser } from '$app/environment';

class Logger {
	logs = $state<string[]>([]);

	constructor() {
		if (browser) {
			const originalLog = console.log;
			const originalError = console.error;
			const originalWarn = console.warn;

			const addLog = (prefix: string, ...args: any[]) => {
				const message = args
					.map((a) => {
						if (typeof a === 'object') {
							try {
								return JSON.stringify(a);
							} catch (e) {
								return '[Object]';
							}
						}
						return String(a);
					})
					.join(' ');
				
				// Batching updates could be necessary, but this is fine for debug
				this.logs.push(`${prefix}${message}`);
				if (this.logs.length > 200) this.logs.shift();
			};

			console.log = (...args) => {
				addLog('', ...args);
				originalLog(...args);
			};

			console.error = (...args) => {
				addLog('❌ ', ...args);
				originalError(...args);
			};

			console.warn = (...args) => {
				addLog('⚠️ ', ...args);
				originalWarn(...args);
			};
		}
	}
}

export const logger = new Logger();
