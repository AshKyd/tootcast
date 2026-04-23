<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.svelte';
	import { logout, postVoiceNote, type StatusVisibility } from '$lib/mastodon';
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
		InputGroup,
		Loader
	} from 'svelte-akui';
	import { recorder } from '$lib/recorder.svelte';
	import { settings } from '$lib/settings.svelte'; // Added settings
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import DebugConsole from '$lib/components/DebugConsole.svelte';
	import RecordStep from './RecordStep.svelte';
	import PlaybackStep from './PlaybackStep.svelte';
	import TranscriberSetupStep from './TranscriberSetupStep.svelte';

	// App UI State
	let isSettingsOpen = $state(false);
	let isDebugOpen = $state(false);
	let error = $state<string | null>(null);
	let isUploading = $state(false);
	let uploadStatus = $state<'uploading' | 'tooting'>('uploading');
	let success = $state(false);
	let lastPostUrl = $state<string | null | undefined>(null);

	onMount(async () => {
		await auth.init();
		await recorder.loadFromStore();
		recorder.preload(); // Load WASM early without waiting for interaction
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
	async function handleSend(data: {
		blob: Blob;
		visibility: StatusVisibility;
		description: string;
	}) {
		isUploading = true;
		uploadStatus = 'uploading';
		error = null;

		try {
			const statusText = settings.data.addHashtag ? '#VoiceNote' : '';
			const status = await postVoiceNote({
				...data,
				text: statusText,
				onStatus: (s) => (uploadStatus = s)
			});
			await recorder.clearStore();
			recorder.discard();
			success = true;
			lastPostUrl = status.url;
			console.log('✅ Send successful');
		} catch (err: unknown) {
			const errObject = err as Error;
			console.error('❌ Send failed:', errObject);
			error = `Upload failed: ${errObject.message || 'Generic error'}`;
		} finally {
			isUploading = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-ui" in:fade>
	<Header>
		{#snippet title()}
			<Badge variant="regular" radius="m">TOOTCAST</Badge>
		{/snippet}

		<MenuButton icon="list" variant="regular" size="small" origin="bottom-right">
			{#snippet menu()}
				<MenuItem label="Settings" icon="gear" onclick={() => (isSettingsOpen = true)} />
				<MenuItem
					label="Toggle Debug Console"
					icon="terminal"
					onclick={() => (isDebugOpen = !isDebugOpen)}
				/>
				{#if recorder.audioUrl}
					<MenuItem
						label="Download"
						icon="download"
						onclick={() => {
							const a = document.createElement('a');
							a.href = recorder.audioUrl!;
							a.download = `voicenote_${Date.now()}.mp3`;
							a.click();
						}}
					/>
				{/if}
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

	{#if isDebugOpen}
		<DebugConsole onClose={() => (isDebugOpen = false)} />
	{/if}

	<div class="main-content">
		{#if success || isUploading}
			<div class="success-screen responsive-panel" transition:fly={{ y: 20 }}>
				<Panel>
					<Padding size="l">
						<div class="text-center success-panel-content">
							{#if isUploading}
								<div class="loading-state" in:fade>
									<Loader size="3rem" />
									<div class="status-container m-t-m">
										{#key uploadStatus}
											<p
												class="upload-status"
												in:fly={{ x: 20, opacity: 0, duration: 400, delay: 200 }}
												out:fly={{ x: -20, opacity: 0, duration: 400 }}
											>
												{uploadStatus}…
											</p>
										{/key}
									</div>
								</div>
							{:else}
								<div class="sent-state" in:fade>
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
							{/if}
						</div>
					</Padding>
				</Panel>
			</div>
		{:else if recorder.audioUrl}
			{#if settings.data.whisperModel === 'unset'}
				<TranscriberSetupStep />
			{:else}
				<PlaybackStep {recorder} onsend={handleSend} ondiscard={() => (success = false)} {error} />
			{/if}
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

	.success-panel-content {
		min-height: 280px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.status-container {
		position: relative;
		height: 2rem;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.upload-status {
		position: absolute;
		font-size: 1.25rem;
		font-weight: 600;
		text-transform: capitalize;
		opacity: 0.8;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.m-t-m {
		margin-top: var(--spacing-m);
	}
</style>
