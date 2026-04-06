<script lang="ts">
	import { Panel, Padding, Button, LoaderOverlay } from 'svelte-akui';
	import { postVoiceNote } from '$lib/mastodon';
	import { settings } from '$lib/settings.svelte';

	let { recorder, onsuccess, ondiscard, onerror } = $props();

	let isUploading = $state(false);

	async function handleSend() {
		if (!recorder.audioBlob) return;

		console.group('🎤 Diagnostic: Send Voice Note');
		console.log('Blob Type:', recorder.audioBlob.type);
		console.log('Blob Size:', (recorder.audioBlob.size / 1024).toFixed(2), 'KB');

		// Trigger diagnostic download
		const downloadUrl = URL.createObjectURL(recorder.audioBlob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = `debug_voice_${Date.now()}.${recorder.audioBlob.type.includes('ogg') ? 'ogg' : 'webm'}`;
		console.log('Triggering diagnostic download:', a.download);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);

		isUploading = true;
		onerror(null);

		try {
			const statusText = settings.data.addHashtag ? '#VoiceNote' : '';
			await postVoiceNote(recorder.audioBlob, statusText);
			recorder.discard();
			onsuccess();
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

<Panel colour="regular" class="preview-card max-w-sm w-full">
	{#if isUploading}
		<LoaderOverlay message="Uploading voice note..." />
	{/if}
	<Padding size="l">
		<h2>Preview note</h2>
		<audio src={recorder.audioUrl} controls class="mb-10 w-full"></audio>

		<div class="flex gap-4">
			<Button variant="regular" class="flex-1" onclick={handleDiscard} disabled={isUploading}>
				Discard
			</Button>
			<Button variant="accent" class="flex-1" onclick={handleSend} disabled={isUploading}>
				Send to Mastodon
			</Button>
		</div>
	</Padding>
</Panel>
