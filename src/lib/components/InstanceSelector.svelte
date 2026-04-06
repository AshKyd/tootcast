<script lang="ts">
	import { getAuthUrl } from '$lib/mastodon';
	import { db } from '$lib/db';
	import { onMount } from 'svelte';
	import { Field, TextInput, Button, InputGroup, Padding } from 'svelte-akui';

	let instance = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin() {
		if (!instance) return;
		loading = true;
		error = null;

		try {
			await db.set('pending_instance', instance);
			const authUrl = await getAuthUrl(instance);
			window.location.href = authUrl;
		} catch (e) {
			console.error(e);
			error = 'Failed to connect to instance. Check the URL and try again.';
			loading = false;
		}
	}

	onMount(async () => {
		const session = await db.get<import('$lib/mastodon').UserSession>('session');
		if (session?.instance) {
			instance = session.instance;
		}
	});
</script>

<div class="instance-selector">
	<p class="selector-title">Sign in with your Mastodon instance to start recording.</p>

	<Field label="Instance URL" for="instance-domain">
		<InputGroup joined size="large">
			<TextInput
				id="instance-domain"
				type="url"
				bind:value={instance}
				placeholder="mastodon.social"
				disabled={loading}
				onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleLogin()}
			/>
			<Button variant="accent" onclick={handleLogin} disabled={loading || !instance} {loading}>
				Login
			</Button>
		</InputGroup>
	</Field>

	{#if error}
		<p class="error-text">{error}</p>
	{/if}
</div>

<style>
	.instance-selector {
		max-width: 440px;
		width: 100%;
		text-align: center;
	}

	.selector-title {
		margin-bottom: var(--spacing-m);
		opacity: 0.6;
		font-size: 1.1rem;
	}

	.error-text {
		margin-top: var(--spacing-s);
		color: #ef4444;
		font-size: 0.875rem;
	}
</style>
