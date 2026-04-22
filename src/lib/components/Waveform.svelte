<script lang="ts">
	let { analyser, urgent = false } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let dataArray: Uint8Array;
	let animationFrame: number;

	$effect(() => {
		if (!analyser || !canvas) return;

		// Track innerWidth/innerHeight for reactivity
		const w = innerWidth;
		const h = innerHeight;
		if (w === 0 || h === 0) return;

		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		ctx = canvas.getContext('2d')!;
		const dpr = window.devicePixelRatio || 1;

		// Set physical resolution
		canvas.width = w * dpr;
		canvas.height = h * dpr;

		// Scale for high-DPI displays
		ctx.resetTransform();
		ctx.scale(dpr, dpr);

		// Get the accent color from Akui theme
		const style = getComputedStyle(canvas);
		const accentColor = urgent 
			? 'oklch(65% 0.25 25)' // Red alert color
			: (style.getPropertyValue('--akui-bg-accent') || '#7c3aed');

		const history: Uint8Array[] = [];
		const HISTORY_LIMIT = 6;

		function draw() {
			animationFrame = requestAnimationFrame(draw);
			analyser.getByteTimeDomainData(dataArray);

			ctx.clearRect(0, 0, w, h);

			// Add current snapshot to history
			history.push(new Uint8Array(dataArray));
			if (history.length > HISTORY_LIMIT) history.shift();

			// Draw history (ghosts)
			ctx.shadowBlur = 0;
			history.forEach((data, index) => {
				const alpha = ((index + 1) / (history.length + 2)) * 0.01;
				ctx.globalAlpha = alpha;
				ctx.lineWidth = 2;
				ctx.strokeStyle = accentColor;
				ctx.beginPath();
				const sliceWidth = w / bufferLength;
				let x = 0;
				for (let i = 0; i < bufferLength; i++) {
					const v = data[i] / 128.0;
					const y = (v * h) / 2;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					x += sliceWidth;
				}
				ctx.stroke();

				// Mirror ghost
				ctx.beginPath();
				x = 0;
				for (let i = 0; i < bufferLength; i++) {
					const v = data[i] / 128.0;
					const y = h - (v * h) / 2;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					x += sliceWidth;
				}
				ctx.stroke();
			});

			// Main waveform line with GLOW
			ctx.lineWidth = 4;
			ctx.strokeStyle = accentColor;
			ctx.shadowBlur = 15;
			ctx.shadowColor = accentColor;
			ctx.globalAlpha = 0.8;
			ctx.beginPath();

			const sliceWidth = w / bufferLength;
			let x = 0;

			// Draw top half
			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * h) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			ctx.stroke();

			// Mirror it for bottom half (no glow)
			ctx.shadowBlur = 0;
			ctx.lineWidth = 12;
			ctx.globalAlpha = 0.15;
			ctx.beginPath();
			x = 0;
			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = h - (v * h) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			ctx.stroke();
			ctx.globalAlpha = 1.0;
		}

		draw();

		return () => cancelAnimationFrame(animationFrame);
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="waveform-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.waveform-container {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 500;
	}

	canvas {
		width: 100dvw;
		height: 100dvh;
		opacity: 0.8;
	}
</style>
