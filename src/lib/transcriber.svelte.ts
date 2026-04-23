import { pipeline, env } from '@xenova/transformers';
import { transcript } from './transcript.svelte';
import { settings } from './settings.svelte';
import { browser } from '$app/environment';

// Configure environment for local hosting (sovereignty)
if (browser) {
	env.allowLocalModels = true;
	env.allowRemoteModels = false;
	env.localModelPath = '/ai/models/';

	// Configure local WASM paths
	env.backends.onnx.wasm.wasmPaths = '/ai/wasm/';

	// Disable caching to see actual transfer sizes in dev tools
	env.useBrowserCache = false;
	env.useCustomCache = false;
}

/**
 * Transcriber Service
 * Uses Transformers.js to run Whisper locally in the browser.
 */
class Transcriber {
	status = $state<'idle' | 'loading' | 'transcribing' | 'error'>('idle');
	progress = $state(0);
	private instance: any = null;
	private currentModel: string | null = null;

	/**
	 * Initializes the transcription pipeline.
	 * Downloads the model on first call.
	 */
	async init() {
		const modelName =
			settings.data.whisperModel === 'multilingual'
				? 'whisper-tiny'
				: 'whisper-tiny.en';

		if (this.instance && this.currentModel === modelName) return;

		if (this.instance) {
			console.log(`🔄 Transcriber: Switching model from ${this.currentModel} to ${modelName}`);
			this.instance = null;
		}

		this.status = 'loading';
		this.currentModel = modelName;
		console.log(`🤖 Transcriber: Initializing Whisper model (${modelName} quantized)...`);

		try {
			this.instance = await pipeline('automatic-speech-recognition', modelName, {
				progress_callback: (p: any) => {
					if (p.status === 'progress') {
						this.progress = p.progress;
						// Copious logging as requested
						console.log(`🤖 Model download: ${Math.round(p.progress)}% (${p.file})`);
					} else if (p.status === 'done') {
						console.log(`✅ Model file loaded: ${p.file}`);
					}
				}
			});
			console.log(`✅ Transcriber: Whisper model (${modelName}) ready.`);
		} catch (err) {
			console.error(`❌ Transcriber: Failed to load Whisper model (${modelName}):`, err);
			this.status = 'error';
			this.currentModel = null;
			throw err;
		}
	}

	/**
	 * Transcribes an audio blob.
	 * @param blob The audio blob (mp3, wav, etc.)
	 */
	async transcribe(blob: Blob) {
		if (!browser) return;

		try {
			this.status = 'loading';
			await this.init();
			
			this.status = 'transcribing';
			console.log('🎙️ Transcriber: Starting transcription...');

			// 1. Prepare Audio Context for resampling
			// Whisper expects 16,000Hz mono audio
			const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
				sampleRate: 16000 
			});
			
			console.log('🎙️ Transcriber: Decoding audio data...');
			const arrayBuffer = await blob.arrayBuffer();
			const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
			
			// Use the first channel (mono)
			const samples = audioBuffer.getChannelData(0);
			console.log(`🎙️ Transcriber: Audio resampled to 16kHz, length: ${samples.length} samples`);

			// 2. Run Inference
			console.log('🤖 Transcriber: Running Whisper inference...');
			const result = await this.instance(samples, {
				chunk_length_s: 30,
				stride_length_s: 5,
				return_timestamps: false
			});

			const text = result.text.trim();
			console.log('✅ Transcriber: Transcription complete!');
			console.log('📝 Result:', text);

			// 3. Update Global Store
			transcript.set(text);
			
			this.status = 'idle';
			this.progress = 0;
			
			// Close context to free memory
			await audioCtx.close();
		} catch (err) {
			console.error('❌ Transcriber: Transcription failed:', err);
			this.status = 'error';
		}
	}
}

export const transcriber = new Transcriber();
