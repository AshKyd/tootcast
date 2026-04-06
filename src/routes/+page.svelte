<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import InstanceSelector from '$lib/components/InstanceSelector.svelte';
	import { Badge } from 'svelte-akui';
	import { fade } from 'svelte/transition';

	onMount(async () => {
		await auth.init();
		if (auth.session) {
			goto(resolve('/app'));
		}
	});
</script>

<div class="landing-page" in:fade>
	<div class="circles" aria-hidden="true">
		<div class="circle circle-1"></div>
		<div class="circle circle-2"></div>
	</div>

	<header class="hero text-center animate-fade-up">
		<div class="badge-wrapper m-b-m">
			<Badge variant="accent">BETA</Badge>
		</div>
		<h1 class="hero-title text-glow m-b-m">
			Radio voice notes <br /> for Mastodon.
		</h1>
		<p class="hero-subtitle m-b-l">
			Record your thoughts, hum a melody, or just say hello. <br />
			Big Ears makes it dead simple to share audio with the Fediverse.
		</p>

		<div class="login-container glass p-m animate-float">
			<InstanceSelector />
		</div>
	</header>

	<section class="features grid animate-fade-up" style="animation-delay: 0.2s">
		<div class="feature-card glass p-m">
			<h3>👂 Direct to feed</h3>
			<p>Posts are sent as private mentions by default. Test without the noise.</p>
		</div>
		<div class="feature-card glass p-m">
			<h3>🪄 Tactile UI</h3>
			<p>A glassmorphism interface designed for focus and delight.</p>
		</div>
		<div class="feature-card glass p-m">
			<h3>🛡️ No tracking</h3>
			<p>No servers, no logs. Your data stays between you and your instance.</p>
		</div>
	</section>

	<footer class="footer text-center opacity-30">
		<p>Built for the Fediverse. Open Source & Privacy First.</p>
	</footer>
</div>

<style>
	.landing-page {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--spacing-l) var(--spacing-m);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		position: relative;
		z-index: 1;
	}

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: var(--spacing-l);
	}

	.hero-title {
		font-size: clamp(3rem, 10vw, 6rem);
		line-height: 0.95;
	}

	.hero-subtitle {
		font-size: clamp(1.1rem, 3vw, 1.5rem);
		color: var(--color-text-muted);
		max-width: 600px;
	}

	.login-container {
		width: 100%;
		max-width: 480px;
		margin-top: var(--spacing-m);
	}

	.features {
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--spacing-m);
	}

	.feature-card h3 {
		font-size: 1.5rem;
		margin-bottom: var(--spacing-xs);
	}

	.feature-card p {
		color: var(--color-text-muted);
	}

	.footer {
		margin-top: var(--spacing-l);
		font-size: 0.875rem;
	}

	/* Background Elements */
	.circles {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: -1;
		pointer-events: none;
	}

	.circle {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.4;
	}

	.circle-1 {
		width: 400px;
		height: 400px;
		background: var(--color-accent);
		top: -100px;
		right: -100px;
		animation: float 10s ease-in-out infinite alternate;
	}

	.circle-2 {
		width: 500px;
		height: 500px;
		background: var(--color-secondary);
		bottom: -150px;
		left: -150px;
		animation: float 15s ease-in-out infinite alternate-reverse;
	}

	@media (max-width: 768px) {
		.landing-page {
			gap: var(--spacing-l);
			padding-top: var(--spacing-m);
		}
	}
</style>
