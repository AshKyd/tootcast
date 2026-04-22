<script lang="ts">
	import { fade } from 'svelte/transition';

	let { seconds = 60, urgent = false } = $props<{
		seconds: number;
		urgent?: boolean;
	}>();
</script>

{#key seconds}
	<div class="countdown-timer" class:urgent>
		{seconds}
	</div>
{/key}

<style>
	.countdown-timer {
		font-size: 2.5rem;
		font-weight: 300;
		color: var(--color-text);
		opacity: 0.5;
		margin-bottom: 1rem;
		font-family: var(--akui-font-family);
		transform-origin: center;
		will-change: transform;
	}

	.countdown-timer.urgent {
		color: oklch(60% 0.2 20); /* Intense Red */
		opacity: 1;
		font-weight: 800;
		filter: drop-shadow(0 0 20px oklch(60% 0.2 20 / 40%));
		animation: timer-pulse 1s ease-out forwards;
	}

	@keyframes timer-pulse {
		0% {
			transform: scale(1.6);
			opacity: 0.5;
		}
		10% {
			opacity: 1;
		}
		100% {
			transform: scale(1.2);
			opacity: 1;
		}
	}
</style>
