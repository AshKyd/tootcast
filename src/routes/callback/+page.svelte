<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { db } from '$lib/db';
	import { exchangeCode } from '$lib/mastodon';

	let status = $state('Authenticating...');
	let error = $state<string | null>(null);

	onMount(async () => {
		const code = page.url.searchParams.get('code');
		const instance = await db.get<string>('pending_instance');

		if (!code || !instance) {
			error = 'Invalid authentication request.';
			status = '';
			return;
		}

		try {
			const session = await exchangeCode(instance, code);
			await auth.setSession(session);
			await db.delete('pending_instance');
			goto(resolve('/app'));
		} catch (e) {
			console.error(e);
			error = 'Failed to authenticate with Mastodon.';
			status = '';
		}
	});
</script>

<div class="callback-container p-12 text-center">
	{#if status}
		<p class="text-xl animate-pulse">{status}</p>
	{/if}

	{#if error}
		<p class="text-xl text-red-500 mb-4">{error}</p>
		<button class="px-6 py-2 bg-white text-black rounded-lg font-bold" onclick={() => goto(resolve('/'))}>
			Go Back
		</button>
	{/if}
</div>

<style>
	.callback-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
	}
</style>
