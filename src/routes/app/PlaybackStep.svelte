<script lang="ts">
	import { Button, LoaderOverlay, InputGroup, Panel, Select } from 'svelte-akui';
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

	const visibilityOptions: { value: StatusVisibility; label: string }[] = [
		{ value: 'public', label: 'Public' },
		{ value: 'unlisted', label: 'Unlisted' },
		{ value: 'private', label: 'Followers only' },
		{ value: 'direct', label: 'Direct Message' }
	];

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

	<Panel>
		<div class="visibility-control mb-8">
			<label for="visibility-select" class="sr-only">Post Visibility</label>
			<Select
				id="visibility-select"
				bind:value={visibility}
				options={visibilityOptions}
				placeholder="Post Visibility"
				disabled={isUploading}
			/>
		</div>

		<div class="actions">
			<InputGroup style="width: 100%;">
				<Button
					variant="regular"
					icon="arrow-counterclockwise"
					iconPosition="only"
					label="Record again"
					onclick={handleDiscard}
					disabled={isUploading}
					size="large"
					style="flex: initial;"
				/>
				{#if auth.session}
					<Button
						variant="accent"
						icon="send"
						iconPosition="right"
						label="Post it!"
						onclick={handleSend}
						disabled={isUploading}
						size="large"
						style="min-width:12em;"
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
						style="min-width:12em;"
					/>
				{/if}
			</InputGroup>
		</div>
	</Panel>
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

	.actions {
		width: 100%;
	}

	.mb-8 {
		margin-bottom: 0.5rem;
	}
</style>
