<script lang="ts">
	import { Mic } from 'svelte-bootstrap-icons';
	import { Loader } from 'svelte-akui';

	let {
		isReady = false,
		isRecording = false,
		isInitializing = false,
		isStopping = false,
		onwarmup = () => {},
		onstart = () => {},
		onstop = () => {}
	} = $props();

	let pressStartTime: number | null = null;
	const HOLD_THRESHOLD = 500; // ms

	function handleWarmUp() {
		onwarmup();
	}

	function handleStart(e: Event) {
		e.preventDefault();

		// If already recording, this click/tap should stop it (Toggle mode)
		if (isRecording) {
			onstop();
			return;
		}

		pressStartTime = Date.now();
		onstart();
	}

	function handleEnd(e: Event) {
		e.preventDefault();
		if (!pressStartTime) return;

		const duration = Date.now() - pressStartTime;

		// 🛡️ Grace period: if mouseleave happens immediately after start, it's likely
		// due to the button shrinking away from the cursor. Ignore it.
		if (e.type === 'mouseleave' && duration < 250) {
			return;
		}

		pressStartTime = null;

		// ⏹️ If mouseleave triggered after the grace period, or if it's a mouseup
		// that lasted longer than our toggle threshold, stop recording.
		if (e.type === 'mouseleave' || duration > HOLD_THRESHOLD) {
			onstop();
		}
	}
</script>

<button
	class="record-button"
	class:ready={isReady && !isInitializing}
	class:recording={isRecording}
	class:stopping={isStopping}
	onmouseenter={handleWarmUp}
	onmousedown={handleStart}
	onmouseup={handleEnd}
	onmouseleave={handleEnd}
	ontouchstart={handleStart}
	ontouchend={handleEnd}
	aria-label="Record voice note"
>
	<!-- Stable Hit Area (invisible but ensures mouse stays "inside" during scale) -->
	<div class="hit-area"></div>

	<!-- Scaling Visuals -->
	<div class="button-visuals">
		<div class="glass-bg"></div>
		<div class="shine"></div>
		<div class="icon-wrapper">
			{#if isInitializing || isStopping}
				<Loader size="3rem" />
			{:else}
				<Mic width="48" height="48" />
			{/if}
		</div>
	</div>
</button>

<style>
	.record-button {
		position: relative;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		outline: none;
		-webkit-tap-highlight-color: transparent;
		z-index: 1000;
		margin: 0;
		padding: 0;

		@media (prefers-color-scheme: light) {
			background: #a84cd29e;
		}
	}

	/* Stable, non-scaling hit area */
	.hit-area {
		position: absolute;
		inset: -10px;
		border-radius: 50%;
		z-index: 1;
	}

	/* Scaling Visuals Wrapper */
	.button-visuals {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		pointer-events: none;
		z-index: 2;
	}

	/* The Gradient Border (now on visuals) */
	.button-visuals::after {
		content: '';
		position: absolute;
		inset: -3px;
		background: conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #6366f1);
		border-radius: 50%;
		z-index: -1;
		opacity: 0.3;
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}

	.record-button.ready:hover .button-visuals::after {
		opacity: 1;
	}

	.record-button.recording .button-visuals::after {
		opacity: 1;
		animation: rotate-gradient 3s linear infinite;
		filter: blur(2px);
		box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
	}

	@keyframes rotate-gradient {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.glass-bg {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		box-shadow:
			0 8px 32px 0 rgba(0, 0, 0, 0.3),
			inset 0 0 0 1px rgba(255, 255, 255, 0.1);
		z-index: 0;
	}

	:global(.dark) .glass-bg {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.record-button.recording .glass-bg {
		border-color: rgba(255, 77, 77, 0.3);
		background: linear-gradient(135deg, rgba(255, 77, 77, 0.1), rgba(0, 0, 0, 0.2));
	}

	.shine {
		position: absolute;
		top: 10%;
		left: 15%;
		width: 40%;
		height: 20%;
		background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
		border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
		transform: rotate(-15deg);
		pointer-events: none;
		z-index: 2;
	}

	.icon-wrapper {
		position: relative;
		z-index: 10;
		color: white;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
		transition: transform 0.2s ease;
	}

	/* Interactions (Target visuals instead of button) */
	.record-button.ready:hover .button-visuals {
		transform: scale(1.05);
	}

	.record-button.ready:active .button-visuals,
	.record-button.recording .button-visuals,
	.record-button.stopping .button-visuals {
		transform: scale(0.95);
	}

	.record-button.recording .icon-wrapper {
		color: #ff4d4d;
		animation: pulse-icon 1s infinite alternate;
	}

	@keyframes pulse-icon {
		from {
			transform: scale(1);
			filter: drop-shadow(0 2px 4px rgba(255, 77, 77, 0.4));
		}
		to {
			transform: scale(1.1);
			filter: drop-shadow(0 2px 8px rgba(255, 77, 77, 0.8));
		}
	}
</style>
