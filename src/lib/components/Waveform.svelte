<script lang="ts">
	let { analyser } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let innerWidth = $state(0);
	let innerHeight = $state(0);
	let dataArray: Uint8Array;
	let animationFrame: number;

	$effect(() => {
		if (!analyser) return;

		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		ctx = canvas.getContext('2d')!;

		function draw() {
			animationFrame = requestAnimationFrame(draw);
			analyser.getByteTimeDomainData(dataArray);

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.lineWidth = 4;
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
			ctx.beginPath();

			const sliceWidth = canvas.width / bufferLength;
			let x = 0;

			// Draw top half
			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = (v * canvas.height) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			ctx.stroke();

			// Mirror it for bottom half with some offset/glow
			ctx.lineWidth = 12;
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
			ctx.beginPath();
			x = 0;
			for (let i = 0; i < bufferLength; i++) {
				const v = dataArray[i] / 128.0;
				const y = canvas.height - (v * canvas.height) / 2;

				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}

				x += sliceWidth;
			}
			ctx.stroke();
		}

		draw();

		return () => cancelAnimationFrame(animationFrame);
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div class="waveform-container">
	<canvas
		bind:this={canvas}
		width={innerWidth * (typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
		height={innerHeight * (typeof window !== 'undefined' ? window.devicePixelRatio : 1)}
		style="width: 100vw; height: 100vh;"
	></canvas>
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
		filter: blur(2px) contrast(1.2);
	}

	canvas {
		opacity: 0.8;
	}
</style>
