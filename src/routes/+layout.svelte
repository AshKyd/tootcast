<script lang="ts">
	import { UIRoot } from 'svelte-akui';
	import '$lib/style.css';

	let { children } = $props();

	// Update system-level attributes when theme changes
	let currentTheme = $state('dark');
	
	$effect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		const updateTheme = () => {
			currentTheme = mql.matches ? 'dark' : 'light';
			document.documentElement.dataset.theme = currentTheme;
			document.documentElement.style.colorScheme = currentTheme;
		};
		
		updateTheme();
		mql.addEventListener('change', updateTheme);
		return () => mql.removeEventListener('change', updateTheme);
	});
</script>

<svelte:head>
	<title>Big Ears - Radio Voice Notes for Mastodon</title>
	<meta name="description" content="Dead simple voice notes for Mastodon." />
</svelte:head>

<UIRoot>
	<main class="app-container">
		{@render children()}
	</main>
</UIRoot>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100dvh;
		width: 100%;
		background-color: var(--color-bg);
		color: var(--color-text);
		font-family: var(--akui-font-family);
		overflow: hidden;
		overscroll-behavior: none;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100dvh;
		width: 100%;
		overflow: hidden;
	}
</style>
