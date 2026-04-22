<script lang="ts">
	import { Button, Glow } from 'svelte-akui';
	import { fade, fly } from 'svelte/transition';
	import { transcriber } from '$lib/transcriber.svelte';

	let { src } = $props<{ src: string }>();

	let isPaused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let isExpanded = $state(false);

	function formatTime(seconds: number) {
		if (isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function togglePlay() {
		isPaused = !isPaused;
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		currentTime = Number(target.value);
	}

	function toggleTranscript() {
		isExpanded = !isExpanded;
	}
</script>

<div class="audio-player" class:expanded={isExpanded}>
	<Glow />
	<audio
		bind:paused={isPaused}
		bind:currentTime
		bind:duration
		{src}
		onended={() => (isPaused = true)}
	></audio>

	<div class="content-wrapper">
		{#if isExpanded}
			<div class="transcript-section" transition:fade={{ duration: 200 }}>
				<textarea
					bind:value={transcriber.transcript}
					placeholder={transcriber.status === 'unsupported'
						? 'Speech recognition not supported'
						: 'No transcript generated...'}
					class="transcript-editor"
					spellcheck="true"
				></textarea>
			</div>
		{/if}

		<div class="player-bar">
			<div class="control">
				<Button
					variant="regular"
					radius="full"
					iconPosition="only"
					icon={isPaused ? 'play' : 'pause'}
					size="large"
					onclick={togglePlay}
					aria-label={isPaused ? 'Play' : 'Pause'}
				></Button>
			</div>

			<div class="track-area">
				<div
					class="scrubber-container"
					in:fly={{ x: -20, duration: 300 }}
					out:fly={{ x: -20, duration: 200 }}
				>
					<input
						type="range"
						min="0"
						max={duration || 0}
						step="0.1"
						value={currentTime}
						oninput={handleInput}
						class="scrubber"
					/>
					<div class="time-display">
						{formatTime(currentTime)} / {formatTime(duration)}
					</div>
				</div>
			</div>

			{#if transcriber.status !== 'unsupported' || transcriber.transcript}
				<div class="control">
					<Button
						variant={isExpanded ? 'accent' : 'ghost'}
						radius="full"
						iconPosition="only"
						icon="chat-square-text"
						size="large"
						onclick={toggleTranscript}
						aria-label="Toggle Transcript"
					></Button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	:root {
		--transition-smooth: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.audio-player {
		width: 100%;
		max-width: 600px;
		height: 66px;
		overflow: hidden;
		position: relative;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--akui-border-input);
		border-radius: 33px; /* Perfect capsule for 66px height */
		/* Horizontal padding is mirrored in PlaybackStep.svelte .actions-row for alignment */
		padding: 0 1rem;
		display: flex;
		flex-direction: column;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.2),
			inset 0 0 0 1px var(--akui-border-secondary);
		background: #ffffff08;
		transition:
			height var(--transition-smooth),
			background-color var(--transition-smooth),
			padding var(--transition-smooth);
	}

	.audio-player.expanded {
		height: 280px;
		padding: 1.5rem;
	}

	:global([data-theme='light']) .audio-player {
		background: white;
	}

	.content-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		justify-content: center;
	}

	.audio-player.expanded .content-wrapper {
		justify-content: flex-end;
		gap: 1rem;
	}

	.transcript-section {
		flex: 1;
		width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.transcript-editor {
		width: 100%;
		height: 100%;
		background: transparent;
		border: none;
		color: var(--color-text);
		font-family: var(--akui-font-family);
		font-size: 1.1rem;
		line-height: 1.6;
		resize: none;
		outline: none;
		padding: 0.5rem;
		-webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
	}

	.player-bar {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		height: 66px;
		flex-shrink: 0;
	}

	.track-area {
		flex: 1;
		position: relative;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.scrubber-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 4px;
	}

	.scrubber {
		width: 100%;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
		background: var(--akui-bg-input);
		border-radius: 10px;
		outline: none;
		cursor: pointer;
	}

	.scrubber::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--akui-fg-primary);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 0 15px var(--akui-bg-accent);
		transition: transform 0.1s ease;
	}

	.scrubber::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.time-display {
		font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
		font-size: 0.8rem;
		color: var(--akui-fg-secondary);
		opacity: 0.6;
		text-align: right;
		font-variant-numeric: tabular-nums;
		height: 0;
	}
</style>
