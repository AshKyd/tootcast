<script lang="ts">
	import { Button, LoaderOverlay, MenuButton, MenuItem, Tooltip, createTooltip, Padding } from 'svelte-akui';
	import { onMount } from 'svelte';
	import { postVoiceNote, type StatusVisibility } from '$lib/mastodon';
	import { settings } from '$lib/settings.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fade } from 'svelte/transition';

	let { recorder, onsuccess, ondiscard, onerror } = $props();

	let isUploading = $state(false);
	let visibility = $state<StatusVisibility>(settings.data.defaultVisibility);

	$effect(() => {
		if (settings.isLoaded && visibility !== settings.data.defaultVisibility) {
			settings.data.defaultVisibility = visibility;
			settings.save();
		}
	});

	const visibilityOptions = [
		{ value: 'public' as StatusVisibility, label: 'Public', icon: 'globe' },
		{ value: 'unlisted' as StatusVisibility, label: 'Unlisted', icon: 'moon' },
		{ value: 'private' as StatusVisibility, label: 'Followers only', icon: 'lock' },
		{ value: 'direct' as StatusVisibility, label: 'Direct Message', icon: 'at' }
	];

	const currentVisibilityIcon = $derived.by(() => {
		return visibilityOptions.find((v) => v.value === visibility)?.icon || 'globe';
	});

	const currentVisibilityLabel = $derived.by(() => {
		return visibilityOptions.find((v) => v.value === visibility)?.label || 'Public';
	});

	const deleteT = createTooltip({ position: 'top' });
	const privacyT = createTooltip({ position: 'top' });

	let isMouse = $state(false);

	onMount(() => {
		isMouse = window.matchMedia('(hover: hover)').matches;
	});

	async function handleSend() {
		if (!recorder.audioBlob) return;

		console.group('🎤 Diagnostic: Send Voice Note');
		console.log('Blob Type:', recorder.audioBlob.type);
		console.log('Blob Size:', (recorder.audioBlob.size / 1024).toFixed(2), 'KB');
		isUploading = true;
		onerror(null);

		try {
			const statusText = settings.data.addHashtag ? '#VoiceNote' : '';
			const status = await postVoiceNote(recorder.audioBlob, statusText, visibility);
			await recorder.clearStore();
			recorder.discard();
			onsuccess(status.url);
			console.log('✅ Send successful');
		} catch (err: unknown) {
			const errObject = err as Error;
			console.error('❌ Send failed:', errObject);
			onerror(`Upload failed: ${errObject.message || 'Generic error'}`);
		} finally {
			isUploading = false;
			console.groupEnd();
		}
	}

	function handleDiscard() {
		recorder.discard();
		ondiscard();
	}
</script>

{#if isUploading}
	<LoaderOverlay message="Uploading voice note..." />
{/if}

<div class="playback-step" transition:fade>
	<div class="player-wrapper">
		<AudioPlayer src={recorder.audioUrl} />
	</div>

	<div class="actions-row">
		<Tooltip
			visible={deleteT.visible && isMouse}
			x={deleteT.x}
			y={deleteT.y}
			position={deleteT.position}
		>
			<Padding size="s">Delete and start over</Padding>
		</Tooltip>
		<Button
			variant="regular"
			icon="trash"
			iconPosition="only"
			label="Discard"
			onclick={handleDiscard}
			disabled={isUploading}
			size="large"
			{...(isMouse ? deleteT.handlers : {})}
		/>

		<div class="spacer"></div>

		<Tooltip
			visible={privacyT.visible && isMouse}
			x={privacyT.x}
			y={privacyT.y}
			position={privacyT.position}
		>
			<Padding size="s">Post privacy: {currentVisibilityLabel}</Padding>
		</Tooltip>
		<MenuButton
			icon={currentVisibilityIcon}
			variant="regular"
			size="large"
			disabled={isUploading}
			origin="bottom-right"
			{...(isMouse ? privacyT.handlers : {})}
		>
			{#snippet menu()}
				{#each visibilityOptions as option}
					<MenuItem
						label={option.label}
						icon={option.icon}
						onclick={() => (visibility = option.value)}
					/>
				{/each}
			{/snippet}
		</MenuButton>

		{#if auth.session}
			<Button
				variant="accent"
				icon="send"
				iconPosition="right"
				label="Post it!"
				onclick={handleSend}
				disabled={isUploading}
				size="large"
				style="min-width: 10em;"
			/>
		{:else}
			<Button
				variant="accent"
				icon="box-arrow-in-right"
				iconPosition="right"
				label="Login to Post"
				onclick={async () => {
					await recorder.saveToStore();
					goto(resolve('/login'));
				}}
				disabled={isUploading}
				size="large"
				style="min-width: 10em;"
			/>
		{/if}
	</div>
</div>

<style>
	.playback-step {
		position: absolute;
		bottom: 10dvh;
		left: 1rem;
		width: calc(100% - 2rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.player-wrapper {
		width: 100%;
		max-width: 600px;
		margin-bottom: 2.5rem;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 600px;
	}

	.spacer {
		flex: 1;
	}
</style>
