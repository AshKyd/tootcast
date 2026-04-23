<script lang="ts">
	import { Button, Glow } from 'svelte-akui';
	import { fade, fly } from 'svelte/transition';
	import { transcript } from '$lib/transcript.svelte';
	import { transcriber } from '$lib/transcriber.svelte';
	import { settings } from '$lib/settings.svelte';
	import type { Recorder } from '$lib/recorder.svelte';

	let { recorder } = $props<{ recorder: Recorder }>();
	let src = $derived(recorder.audioUrl);

	let isPaused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let isExpanded = $state(false);
	let isFocused = $state(false);

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
		if (isFocused) {
			isFocused = false;
			return;
		}
		isExpanded = !isExpanded;
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		// Small delay to allow clicking the "Done" button
		setTimeout(() => {
			// Only blur if we're not in the middle of a viewport transition
			if (window.visualViewport && window.visualViewport.height >= window.innerHeight * 0.8) {
				isFocused = false;
			}
		}, 100);
	}

	import { onMount } from 'svelte';
	onMount(() => {
		if (!window.visualViewport) return;

		const handleResize = () => {
			const vv = window.visualViewport;
			if (!vv) return;

			// If the viewport is nearly full height, the keyboard is likely hidden
			if (vv.height >= window.innerHeight * 0.9 && isFocused) {
				isFocused = false;
				// Also blur the element to be sure
				(document.activeElement as HTMLElement)?.blur?.();
			}
		};

		window.visualViewport.addEventListener('resize', handleResize);
		return () => window.visualViewport?.removeEventListener('resize', handleResize);
	});
</script>

<div
	class="audio-player"
	class:expanded={isExpanded}
	class:focused={isFocused}
	class:has-transcript={true}
>
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
				<div class="transcript-header">
					<span>Alt Text (Transcription)</span>
					<div class="header-actions">
						{#if isFocused}
							<button class="done-btn" onclick={() => (isFocused = false)}>Done</button>
						{/if}
					</div>
				</div>
				<textarea
					bind:value={$transcript}
					onfocus={handleFocus}
					onblur={handleBlur}
					placeholder="Add Alt Text / Transcript..."
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

			<div class="control">
				<div class="transcribe-btn-wrapper">
					<Button
						variant={isExpanded ? 'accent' : 'ghost'}
						radius="full"
						iconPosition="only"
						icon={isFocused ? 'check2' : 'chat-square-text'}
						size="large"
						onclick={toggleTranscript}
						aria-label={isFocused ? 'Done Editing' : 'Toggle Transcript'}
					/>
					{#if transcriber.status === 'transcribing' || transcriber.status === 'loading'}
						<div class="loading-ring" transition:fade={{ duration: 300 }}></div>
					{/if}
				</div>
			</div>
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
		padding: 0 2rem 0 0.5rem;
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

	.audio-player.has-transcript {
		padding-right: 1rem;
	}

	.audio-player.expanded {
		height: 280px;
		padding: 1.5rem;
	}

	.audio-player.focused {
		/* Shared focus styles could go here, but mostly we care about mobile */
	}

	@media (max-width: 640px) {
		.audio-player.focused {
			position: fixed;
			inset: 0;
			z-index: 2000;
			width: 100dvw;
			height: 100dvh;
			border-radius: 0;
			padding: 2rem;
			max-width: none;
			background: var(--color-bg);
			display: flex;
			flex-direction: column;
		}

		.audio-player.focused .content-wrapper {
			height: 100%;
			justify-content: flex-start;
		}

		.audio-player.focused .transcript-section {
			height: calc(100% - 80px);
		}

		.audio-player.focused .player-bar {
			margin-top: auto;
		}
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
		gap: 0.25rem;
	}

	.transcript-header {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
		color: var(--akui-fg-secondary);
		opacity: 0.5;
		padding-left: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 24px;
	}

	.done-btn {
		background: var(--akui-bg-accent);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 2px 10px;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		opacity: 1;
		transition: transform 0.1s ease;
	}

	.done-btn:hover {
		transform: scale(1.05);
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

	.audio-player.focused .transcript-editor {
		-webkit-mask-image: none;
		mask-image: none;
	}

	.player-bar {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		height: 66px;
		flex-shrink: 0;
	}

	.control-group {
		display: flex;
		gap: 0.5rem;
		align-items: center;
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

	.transcribe-btn-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-ring {
		position: absolute;
		inset: -1px;
		border: 3px solid transparent;
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		pointer-events: none;
		z-index: 10;
		filter: drop-shadow(0 0 5px var(--color-accent));
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
