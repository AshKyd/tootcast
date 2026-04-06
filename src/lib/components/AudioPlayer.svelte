<script lang="ts">
	import { Button, Glow } from 'svelte-akui';
	import { fade, fly } from 'svelte/transition';

	let { src } = $props<{ src: string }>();

	let isPaused = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);

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
</script>

<div class="audio-player">
	<Glow />
	<audio
		bind:paused={isPaused}
		bind:currentTime
		bind:duration
		{src}
		onended={() => (isPaused = true)}
	></audio>

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
	</div>
</div>

<style>
	.audio-player {
		width: 100%;
		max-width: 600px;
		overflow: hidden;
		position: relative;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--akui-border-input);
		border-radius: 100px;
		padding: 0.4rem 2rem 0.4rem 0.75rem;
		box-shadow:
			0 10px 30px rgba(0, 0, 0, 0.2),
			inset 0 0 0 1px var(--akui-border-secondary);
	}

	.player-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
	}

	.track-area {
		flex: 1;
		position: relative;
		height: 56px;
		display: flex;
		align-items: center;
		overflow: hidden;
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
