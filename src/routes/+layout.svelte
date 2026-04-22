<script lang="ts">
	import { UIRoot } from 'svelte-akui';
	import '$lib/style.css';
	import { recorder } from '$lib/recorder.svelte';

	let { children } = $props();

	// Update system-level attributes when theme changes
	let currentTheme = $state<'dark' | 'light'>('dark');
	
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

	$effect(() => {
		document.body.classList.toggle('recording', recorder.isRecording);
		document.body.classList.toggle('urgent', recorder.isNearLimit);
	});

	$effect(() => {
		const isPreview = (!!recorder.audioUrl || recorder.status === 'stopping') && !recorder.isRecording;
		if (isPreview) {
			document.body.classList.add('preview');
		} else {
			document.body.classList.remove('preview');
		}
	});
</script>

<svelte:head>
	<title>TootCast - Radio Voice Notes for Mastodon</title>
	<meta name="description" content="Dead simple voice notes for Mastodon." />
</svelte:head>

<UIRoot mode={currentTheme}>
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
