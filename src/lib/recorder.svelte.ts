import { browser } from '$app/environment';
import { settings } from './settings.svelte';
import { db } from './db';

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
	readonly MAX_DURATION = 60000; // 1 minute in ms

	// Derived
	remainingSeconds = $derived(Math.max(0, Math.ceil((this.MAX_DURATION - this.recordingDuration) / 1000)));
	isNearLimit = $derived(this.isRecording && this.remainingSeconds <= 10);

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
	 * Preemptively initializes the audio engine.
	 * Requests permissions and prepares the AudioContext.
	 */
	async init() {
		if (!browser || this.status !== 'idle') return;
		this.status = 'initializing';

		try {
			console.log('🎙️ Initializing MediaRecorder...');

			// 1. Request stream with user preferences
			const constraints: MediaStreamConstraints = {
				audio: {
					// Use 'ideal' rather than 'exact' to allow fallback if a device is unplugged
					deviceId: settings.data.deviceId ? { ideal: settings.data.deviceId } : undefined,
					noiseSuppression: settings.data.noiseCancellation,
					autoGainControl: true
				}
			};

			this.stream = await navigator.mediaDevices.getUserMedia(constraints);

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

			if (this.audioContext.state === 'suspended') {
				await this.audioContext.resume();
			}

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
			this.error = null;
			this.isRequestingStart = true;

			// If not ready, attempt initialization
			if (this.status === 'idle') {
				await this.init();
			}

			// If user cancelled or initialization failed skip starting
			if (!this.isRequestingStart || this.status !== 'ready') {
				console.log('🛑 Recording start aborted.');
				this.disconnect();
				return;
			}

			if (!this.stream) throw new Error('No audio stream available.');

			this.chunks = [];
			this.mediaRecorder = new MediaRecorder(this.stream, {
				audioBitsPerSecond: this.BITRATE
			});

			this.mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					this.chunks.push(e.data);
				}
			};

			this.mediaRecorder.onstop = () => {
				this.audioBlob = new Blob(this.chunks, {
					type: this.mediaRecorder?.mimeType || 'audio/webm'
				});
				this.audioUrl = URL.createObjectURL(this.audioBlob);
				
				// 🔌 Fully hang up and disconnect everything
				this.disconnect();

				console.log('💾 Recording saved. Format:', this.audioBlob.type);
			};

			this.mediaRecorder.start();
			this.status = 'recording';
			console.log('🎤 Recording...');

			// Start duration timer
			this.recordingDuration = 0;
			this.timerId = setInterval(() => {
				this.recordingDuration += 100;
				if (this.recordingDuration >= this.MAX_DURATION) {
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
	 * Stops recording.
	 * Includes a small 300ms buffer to ensure final audio snippets are captured.
	 */
	async stop() {
		this.isRequestingStart = false;

		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = null;
		}

		if (this.status === 'recording' && this.mediaRecorder) {
			this.status = 'stopping';
			// ⏳ Wait 300ms to ensure the entire audio buffer is encoded.
			await new Promise((resolve) => setTimeout(resolve, 300));
			this.mediaRecorder.stop();
		} else if (this.status === 'initializing' || this.status === 'ready') {
			// Cancelling before recording actually started
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
	}

	/**
	 * Clear the persisted audio from IndexedDB.
	 */
	async clearStore() {
		await db.delete('pending_audio_blob');
		await db.delete('pending_audio_type');
	}
}

// Singleton instance for the app
export const recorder = new Recorder();
