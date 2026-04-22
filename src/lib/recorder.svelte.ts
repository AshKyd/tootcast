import { browser } from '$app/environment';
import { settings } from './settings.svelte';
import { db } from './db';
import { transcriber } from './transcriber.svelte';
import { Recorder as VmsgRecorder } from 'vmsg';

export type RecorderStatus = 'idle' | 'initializing' | 'ready' | 'recording' | 'stopping' | 'error';

/**
 * Native Voice Recorder Store (MediaRecorder API)
 * Using Svelte 5 Runes for global reactivity.
 * Refactored into a state machine for robustness.
 */
class Recorder {
	// --- State ($state) ---
	status = $state<RecorderStatus>('idle');
	
	// Derived for backward compatibility and UI convenience
	isRecording = $derived(this.status === 'recording');
	isInitializing = $derived(this.status === 'initializing');
	isReady = $derived(this.status === 'ready');
	isStopping = $derived(this.status === 'stopping');
	isError = $derived(this.status === 'error');

	audioBlob = $state<Blob | null>(null);
	audioUrl = $state<string | null>(null);
	error = $state<string | null>(null);
	analyser = $state<AnalyserNode | null>(null);
	recordingDuration = $state(0);

	// --- Private ---
	private mediaRecorder: MediaRecorder | null = null;
	private audioContext: AudioContext | null = null;
	private stream: MediaStream | null = null;
	private chunks: Blob[] = [];
	private isRequestingStart = false;
	private timerId: ReturnType<typeof setInterval> | null = null;

	// --- Config ---
	private readonly BITRATE = 128000; // 128kbps
	get maxDurationMs() {
		return (settings.data?.maxRecordingTime || 60) * 1000;
	}

	// Derived
	remainingSeconds = $derived(Math.max(0, Math.ceil((this.maxDurationMs - this.recordingDuration) / 1000)));
	isNearLimit = $derived(this.isRecording && this.remainingSeconds <= (settings.data?.warningThreshold || 10));

	// --- MP3 Encoding (vmsg) ---
	private vmsg: VmsgRecorder | null = null;
	private wasmURL = new URL('../../node_modules/vmsg/vmsg.wasm', import.meta.url).href;
	private processor: ScriptProcessorNode | null = null;

	/**
	 * Detects the best available audio MIME type for the current browser.
	 * Prioritizes formats that Mastodon handles well without spoof-detection issues.
	 */
	private getSupportedMimeType(): string {
		if (typeof MediaRecorder === 'undefined') return 'audio/webm';

		const types = [
			'audio/ogg;codecs=opus',
			'audio/mp4',
			'audio/webm;codecs=opus',
			'audio/webm',
			'audio/aac',
			'audio/wav',
			'audio/flac'
		];

		const supported = types.filter((t) => MediaRecorder.isTypeSupported(t));
		console.log('🎙️ Supported MIME types:', supported);

		return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
	}

	constructor() {
		if (browser) {
			console.log('🎙️ Native Recorder Store Initialized');
		}
	}

	/**
	 * Disconnects the audio engine and releases microphone tracks.
	 * Returns the state machine to idle.
	 */
	public disconnect() {
		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
			this.analyser = null;
		}
		this.status = 'idle';
		console.log('🔌 Recorder Disconnected & Idle.');
	}

	/**
	 * Preloads the WASM encoder worker.
	 * This can be called on page load to avoid delay when starting a recording.
	 */
	async preload() {
		if (!browser || this.vmsg) return;

		try {
			console.log('🎙️ Preloading vmsg WASM...');
			this.vmsg = new VmsgRecorder({ wasmURL: this.wasmURL });
			await this.vmsg.initWorker();
			console.log('✅ vmsg: MP3 Encoder (WASM) Preloaded.');
		} catch (err) {
			console.warn('⚠️ WASM preloading failed:', err);
		}
	}

	/**
	 * Preemptively initializes the audio engine.
	 * Requests permissions and prepares the AudioContext.
	 */
	async init() {
		if (!browser || (this.status !== 'idle' && this.status !== 'error')) return;
		this.status = 'initializing';

		try {
			console.log('🎙️ Initializing MediaRecorder...');
			console.log('📱 User Agent:', navigator.userAgent);

			// 1. Request stream with user preferences
			const constraints: MediaStreamConstraints = {
				audio: {
					// Use 'ideal' rather than 'exact' to allow fallback if a device is unplugged
					deviceId: settings.data.deviceId ? { ideal: settings.data.deviceId } : undefined,
					noiseSuppression: settings.data.noiseCancellation,
					autoGainControl: true
				}
			};
			console.log('🔧 Constraints:', JSON.stringify(constraints));

			this.stream = await navigator.mediaDevices.getUserMedia(constraints);
			
			const track = this.stream.getAudioTracks()[0];
			if (track) {
				console.log('🎛️ Acquired Track:', track.label, JSON.stringify(track.getSettings()));
			}

			// Refresh device list now that we have permission (labels will be visible)
			await settings.refreshDevices();

			// 2. Initialize AudioContext for visualization
			const AudioContextClass =
				window.AudioContext ||
				(window as Window & typeof globalThis & { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext;
			this.audioContext = new AudioContextClass();
			const source = this.audioContext.createMediaStreamSource(this.stream);
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 256;
			source.connect(this.analyser);

			// --- AudioEncoder Diagnostic ---
			// --- MP3 Encoding (vmsg) ---
			if (!this.vmsg) {
				this.vmsg = new VmsgRecorder({ wasmURL: this.wasmURL });
				await this.vmsg.initWorker();
				console.log('🎙️ vmsg: MP3 Encoder (WASM) Initialized');
			}

			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}
			console.log(`🔊 AudioContext ready (State: ${this.audioContext.state}, Rate: ${this.audioContext.sampleRate}Hz)`);

			this.status = 'ready';
			console.log('✅ Recorder Ready.');
		} catch (err: unknown) {
			const error = err as Error;
			console.warn('⚠️ Audio initialization failed:', error.name, error.message);

			if (error.name === 'NotAllowedError') {
				this.error = 'Microphone permission denied. Please allow access in your browser settings.';
			} else if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
				this.error = 'The selected microphone could not be found or is unplugged.';
			} else if (
				error.name === 'SecurityError' ||
				(browser && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost')
			) {
				this.error =
					'Microphone access requires a secure connection (HTTPS). If you are testing via a local IP, use localhost instead.';
			} else {
				this.error = `Could not access microphone: ${error.message}`;
			}

			this.status = 'error';
		}
	}

	/**
	 * Starts recording.
	 */
	async start() {
		try {
			// Clean out any existing transcription and audio state when we start a new recording
			transcriber.reset();
			this.audioBlob = null;
			this.audioUrl = null;
			await this.clearStore();

			this.error = null;
			this.isRequestingStart = true;

			// If not ready, attempt initialization
			if (this.status === 'idle') {
				await this.init();
			}

			// If user cancelled or initialization failed skip starting
			if (!this.isRequestingStart || this.status !== 'ready') {
				this.disconnect();
				return;
			}

			if (!this.stream || !this.audioContext || !(this.vmsg as any)?.worker) throw new Error('No audio stream available.');

			// Initialize vmsg encoder
			(this.vmsg as any).worker.postMessage({ type: 'start', data: this.audioContext.sampleRate });

			// --- AudioWorklet Refactor (Modern API) ---
			const workletCode = `
				class RecorderProcessor extends AudioWorkletProcessor {
					process(inputs) {
						const input = inputs[0];
						if (input.length > 0) {
							const samples = input[0];
							// We must send a copy because the buffer is reused
							this.port.postMessage(new Float32Array(samples));
						}
						return true;
					}
				}
				registerProcessor('recorder-processor', RecorderProcessor);
			`;

			const blob = new Blob([workletCode], { type: 'application/javascript' });
			const workletURL = URL.createObjectURL(blob);
			
			await this.audioContext.audioWorklet.addModule(workletURL);
			const workletNode = new AudioWorkletNode(this.audioContext, 'recorder-processor');
			
			workletNode.port.onmessage = (e) => {
				if (this.status !== 'recording' && this.status !== 'stopping') return;
				// Send samples directly to vmsg worker
				(this.vmsg as any)?.worker?.postMessage({ type: 'data', data: e.data });
			};

			// Connect the chain
			const source = this.audioContext.createMediaStreamSource(this.stream);
			source.connect(workletNode);
			workletNode.connect(this.audioContext.destination);

			// Keep a reference to disconnect later
			this.processor = workletNode as any;

			this.status = 'recording';
			console.log('🎤 Recording MP3 (WASM)...');
			transcriber.start();

			// Start duration timer
			this.recordingDuration = 0;
			this.timerId = setInterval(() => {
				this.recordingDuration += 100;
				if (this.recordingDuration >= this.maxDurationMs) {
					console.log('⏰ Time limit reached, stopping...');
					this.stop();
				}
			}, 100);
		} catch (err: unknown) {
			const error = err as Error;
			console.error('Failed to start recording:', error);
			this.error = error.message || 'Unknown recording error.';
			this.status = 'error';
			this.isRequestingStart = false;
		}
	}

	/**
	 * Stops recording and encodes the final WAV.
	 */
	async stop() {
		this.isRequestingStart = false;
		transcriber.stop();

		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = null;
		}

		if (this.status === 'recording' && this.processor && this.audioContext && (this.vmsg as any)?.worker) {
			this.status = 'stopping';
			
			// ⏳ Wait a moment to ensure the final buffer chunks are processed.
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Disconnect processor
			this.processor.disconnect();
			if (this.processor instanceof AudioWorkletNode) {
				this.processor.port.onmessage = null;
			}

			try {
				console.log('🔄 Encoding MP3 (WASM)...');
				
				// Signal vmsg to stop and get the blob
				(this.vmsg as any).worker.postMessage({ type: 'stop' });

				this.audioBlob = await new Promise<Blob>((resolve, reject) => {
					if (!(this.vmsg as any)?.worker) return reject('Worker lost');
					
					// Listen for the stop message from vmsg
					const handleMessage = (e: MessageEvent) => {
						const msg = e.data;
						if (msg.type === 'stop') {
							(this.vmsg as any)?.worker?.removeEventListener('message', handleMessage);
							resolve(msg.data);
						} else if (msg.type === 'error' || msg.type === 'internal-error') {
							(this.vmsg as any)?.worker?.removeEventListener('message', handleMessage);
							reject(msg.data);
						}
					};
					(this.vmsg as any).worker.addEventListener('message', handleMessage);
				});

				console.log('✅ MP3 Ready (WASM):', this.audioBlob.size, 'bytes');
			} catch (err) {
				console.error('❌ MP3 Encoding failed:', err);
				this.error = 'Failed to process audio data.';
			}

			this.audioUrl = URL.createObjectURL(this.audioBlob!);
			this.disconnect();
		} else if (this.status === 'initializing' || this.status === 'ready') {
			this.disconnect();
		}
	}

	/**
	 * Reset the current voice note state and ensure resources are disconnected.
	 */
	async discard() {
		this.stop(); 
		this.audioBlob = null;
		this.audioUrl = null;
		this.error = null;
		this.mediaRecorder = null;
		transcriber.reset();
		// disconnect handles turning state to idle
		if (this.status !== 'idle') this.disconnect();
		await this.clearStore();
	}

	/**
	 * Persist the current audio blob to IndexedDB.
	 */
	async saveToStore() {
		if (!this.audioBlob) return;
		console.log('💾 Persisting audio to IndexedDB...');
		await db.set('pending_audio_blob', this.audioBlob);
		await db.set('pending_audio_type', this.audioBlob.type);
		await transcriber.saveToStore();
	}

	/**
	 * Load any persisted audio blob from IndexedDB.
	 */
	async loadFromStore() {
		if (!browser) return;
		
		const blob = await db.get<Blob>('pending_audio_blob');
		const type = await db.get<string>('pending_audio_type');

		if (blob && type) {
			console.log('📂 Restoring audio from IndexedDB...', blob.size, type);
			this.audioBlob = new Blob([blob], { type });
			this.audioUrl = URL.createObjectURL(this.audioBlob);
		}
		await transcriber.loadFromStore();
	}

	/**
	 * Clear the persisted audio from IndexedDB.
	 */
	async clearStore() {
		await db.delete('pending_audio_blob');
		await db.delete('pending_audio_type');
		await transcriber.clearStore();
	}
}

// Singleton instance for the app
export const recorder = new Recorder();
