import { browser } from '$app/environment';
import { db } from './db';

export type TranscriberStatus = 'idle' | 'listening' | 'error' | 'unsupported';

/**
 * Speech Recognition Transcriber Store
 * Uses Web Speech API to provide real-time transcription.
 */
class Transcriber {
	status = $state<TranscriberStatus>('idle');
	transcript = $state<string>('');
	error = $state<string | null>(null);

	private recognition: any = null;
	private isSupported = false;
	private restartCount = 0;
	private lastRestartTime = 0;

	private lastStartTime = 0;

	constructor() {
		if (browser) {
			const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			
			if (SpeechRecognition) {
				this.isSupported = true;
				this.recognition = new SpeechRecognition();
				this.recognition.continuous = true;
				this.recognition.interimResults = true; // Show interim results for better feedback
				this.recognition.lang = 'en-US';

				this.recognition.onstart = () => {
					console.log('🎙️ Speech recognition started');
					this.lastStartTime = Date.now();
					this.status = 'listening';
					this.error = null;
				};

				this.recognition.onresult = (event: any) => {
					let interimTranscript = '';
					let finalTranscript = '';

					for (let i = event.resultIndex; i < event.results.length; ++i) {
						if (event.results[i].isFinal) {
							finalTranscript += event.results[i][0].transcript;
						} else {
							interimTranscript += event.results[i][0].transcript;
						}
					}

					if (finalTranscript) {
						this.transcript += (this.transcript ? ' ' : '') + finalTranscript.trim();
					}
					
					// We could expose interimTranscript if we wanted real-time preview
					console.log('📝 Result:', finalTranscript || `[${interimTranscript}]`);
				};

				this.recognition.onerror = (event: any) => {
					console.error('⚠️ Speech recognition error:', event.error);
					this.status = 'error';
					
					if (event.error === 'not-allowed') {
						this.error = 'Microphone permission denied for speech recognition.';
					} else if (event.error === 'audio-capture') {
						this.error = 'Could not capture audio for transcription. Microphone may be in use by another process.';
					} else if (event.error === 'no-speech') {
						// This is common, we don't necessarily want to show an error UI for it
						this.status = 'idle';
					} else {
						this.error = `Transcription error: ${event.error}`;
					}
				};

				this.recognition.onend = () => {
					console.log('🏁 Speech recognition ended');
					
					// If it ended almost immediately, it's a microphone conflict (common on mobile Chrome)
					const duration = Date.now() - this.lastStartTime;
					if (duration < 1000 && this.status === 'listening') {
						console.warn('🛑 Speech recognition ended immediately (mic conflict). Stopping to prevent beeps.');
						this.status = 'error';
						this.error = 'Live transcription unavailable on this device while recording.';
						return;
					}
					
					// Only attempt restart if we are still supposed to be listening
					if (this.status === 'listening' || (this.status === 'idle' && this.transcript)) {
						const now = Date.now();
						// Prevent rapid restart loops (beeping)
						if (now - this.lastRestartTime < 2000) {
							this.restartCount++;
						} else {
							this.restartCount = 0;
						}
						
						this.lastRestartTime = now;

						if (this.restartCount > 3) {
							console.warn('🛑 Too many rapid restarts. Stopping transcription to prevent beeping.');
							this.status = 'error';
							this.error = 'Transcription stopped: connectivity issues or microphone conflict.';
							return;
						}

						console.log('🔄 Restarting speech recognition...');
						try {
							this.recognition?.start();
						} catch (e) {
							console.error('Failed to restart:', e);
						}
					}
				};
			} else {
				this.status = 'unsupported';
				console.log('🔇 Speech recognition not supported in this browser.');
			}
		}
	}

	start() {
		if (!this.isSupported || !this.recognition) return;
		
		this.transcript = '';
		this.error = null;
		this.status = 'listening';
		
		try {
			this.recognition.start();
		} catch (err) {
			console.error('Failed to start recognition:', err);
		}
	}

	stop() {
		if (!this.isSupported || !this.recognition) return;
		
		this.status = 'idle';
		this.recognition.stop();
	}

	reset() {
		this.transcript = '';
		this.error = null;
		this.status = 'idle';
	}

	async saveToStore() {
		if (!this.transcript) return;
		console.log('💾 Persisting transcript to IndexedDB...');
		await db.set('pending_transcript', this.transcript);
	}

	async loadFromStore() {
		if (!browser) return;
		const transcript = await db.get<string>('pending_transcript');
		if (transcript) {
			console.log('📂 Restoring transcript from IndexedDB...');
			this.transcript = transcript;
		}
	}

	async clearStore() {
		await db.delete('pending_transcript');
	}
}

export const transcriber = new Transcriber();
