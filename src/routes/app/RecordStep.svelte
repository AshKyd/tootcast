<script lang="ts">
	import RecordButton from '$lib/components/RecordButton.svelte';
	import Waveform from '$lib/components/Waveform.svelte';
	import { InfoBox } from 'svelte-akui';
	import { fade } from 'svelte/transition';

	let { recorder, error } = $props();

	async function startRecording() {
		await recorder.start();
	}

	function stopRecording() {
		recorder.stop();
	}
</script>

{#if recorder.isRecording && recorder.analyser}
	<Waveform analyser={recorder.analyser} />
{/if}

<div class="record-step" transition:fade>
	{#if error || recorder.error}
		<div class="error-container w-full max-w-sm" transition:fade>
			<InfoBox variant="error" title="Action failed">
				{error || recorder.error}
			</InfoBox>
		</div>
	{/if}
	<p>
		{#if recorder.status == 'initializing'}
			Warming up the recorder…
		{:else if recorder.isRecording}
			Listening…
		{:else}
			Hold down to record your voice note.
		{/if}
	</p>

	<RecordButton
		isReady={recorder.isReady}
		isRecording={recorder.isRecording}
		isInitializing={recorder.isInitializing}
		isStopping={recorder.isStopping}
		onwarmup={() => recorder.init()}
		onstart={startRecording}
		onstop={stopRecording}
	/>
</div>

<style>
	.record-step {
		position: absolute;
		bottom: 10dvh;
		left: 1rem;
		width: calc(100% - 2rem);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		justify-content: flex-end;
		z-index: 600;
	}
</style>
