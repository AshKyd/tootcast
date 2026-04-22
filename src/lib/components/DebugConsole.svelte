<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let logs = $state<string[]>([]);

	onMount(() => {
		if (!browser) return;

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
			logs.push(`${prefix}${message}`);
			if (logs.length > 50) logs.shift();
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

		return () => {
			console.log = originalLog;
			console.error = originalError;
			console.warn = originalWarn;
		};
	});
</script>

<div class="debug-console">
	{#each logs as log}
		<div class="log-entry">{log}</div>
	{/each}
</div>

<style>
	.debug-console {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 120px;
		background: rgba(0, 0, 0, 0.85);
		color: #00ff00;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 10px;
		line-height: 1.2;
		overflow-y: auto;
		z-index: 10000;
		pointer-events: none; /* Don't block clicks */
		padding: 4px;
		border-bottom: 1px solid #00ff0044;
		text-shadow: 0 0 2px #00ff00;
	}

	.log-entry {
		border-bottom: 1px solid rgba(0, 255, 0, 0.1);
		padding: 2px 0;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
