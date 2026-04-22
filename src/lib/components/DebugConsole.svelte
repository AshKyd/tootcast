<script lang="ts">
	import { Modal } from 'svelte-akui';
	import { logger } from '$lib/logger.svelte';

	let { onClose }: { onClose: () => void } = $props();
</script>

<Modal title="Debug Logs" icon="terminal" {onClose} fullscreenOnMobile={true}>
	<div class="log-container">
		{#each logger.logs as log}
			<div class="log-entry">{log}</div>
		{/each}
	</div>
</Modal>

<style>
	.log-container {
		background: var(--akui-bg-base, #111);
		color: #0f0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 11px;
		line-height: 1.3;
		padding: 1rem;
		border-radius: 8px;
		max-height: 60vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.log-entry {
		border-bottom: 1px solid rgba(0, 255, 0, 0.1);
		padding-bottom: 4px;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
