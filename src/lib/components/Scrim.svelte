<script lang="ts">
	import { fade } from 'svelte/transition';

	let { isVisible = false } = $props();
</script>

{#if isVisible}
	<div class="scrim" transition:fade={{ duration: 300 }}></div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 400;
	}
</style>
