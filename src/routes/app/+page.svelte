<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.svelte';
	import { logout } from '$lib/mastodon';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		Button,
		Badge,
		Header,
		MenuButton,
		MenuItem,
		Panel,
		Padding,
		InputGroup
	} from 'svelte-akui';
	import { recorder } from '$lib/recorder.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import RecordStep from './RecordStep.svelte';
	import PlaybackStep from './PlaybackStep.svelte';

	// App UI State
	let isSettingsOpen = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let lastPostUrl = $state<string | null | undefined>(null);

	onMount(async () => {
		await auth.init();
		await recorder.loadFromStore();
	});

	async function handleLogout() {
		await logout();
		await auth.setSession(null);
		goto(resolve('/login'));
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (recorder.isRecording) {
				recorder.stop();
			} else if (success || recorder.audioUrl) {
				recorder.discard();
				success = false;
			} else if (isSettingsOpen) {
				isSettingsOpen = false;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-ui" in:fade>
	<Header>
		{#snippet title()}
			<Badge variant="regular" radius="m">BIG EARS</Badge>
		{/snippet}

		<MenuButton icon="list" variant="regular" size="small" origin="bottom-right">
			{#snippet menu()}
				<MenuItem label="Settings" icon="gear" onclick={() => (isSettingsOpen = true)} />
				{#if auth.session}
					<MenuItem
						label="Logout (@{auth.session?.instance})"
						icon="box-arrow-right"
						onclick={handleLogout}
					/>
				{:else}
					<MenuItem
						label="Login"
						icon="box-arrow-in-right"
						onclick={() => goto(resolve('/login'))}
					/>
				{/if}
			{/snippet}
		</MenuButton>
	</Header>

	{#if isSettingsOpen}
		<SettingsModal onClose={() => (isSettingsOpen = false)} />
	{/if}

	<div class="main-content">
		{#if success}
			<div class="success-screen" in:fly={{ y: 20 }}>
				<Panel>
					<Padding size="l">
						<div class="text-center">
							<h2 class="text-5xl font-extrabold mb-4 tracking-tight">Sent!</h2>
							<p class="text-xl opacity-60 mb-10">Your voice note is now on fedi.</p>

							<InputGroup style="width: 100%;min-width:300px;margin-top:1rem;">
								<Button
									variant="regular"
									label="View Post"
									href={lastPostUrl || undefined}
									target="_blank"
									size="large"
									disabled={!lastPostUrl}
									style="flex: 1;"
								/>
								<Button
									variant="accent"
									label="Close"
									size="large"
									onclick={() => {
										recorder.discard();
										success = false;
										lastPostUrl = null;
									}}
									style="flex: 1;"
								/>
							</InputGroup>
						</div>
					</Padding>
				</Panel>
			</div>
		{:else if recorder.audioUrl}
			<PlaybackStep
				{recorder}
				onsuccess={(url: string | null | undefined) => {
					success = true;
					lastPostUrl = url;
				}}
				ondiscard={() => (success = false)}
				onerror={(msg: string | null) => (error = msg)}
			/>
		{:else}
			<RecordStep {recorder} {error} />
		{/if}
	</div>
</div>

<style>
	.app-ui {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		width: 100%;
		position: relative;
	}

	.main-content {
		position: absolute;
		inset: 0;
		height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 10;
	}

	.main-content > :global(*) {
		pointer-events: auto;
	}

	.main-content > :global(*) {
		pointer-events: auto;
	}
</style>
