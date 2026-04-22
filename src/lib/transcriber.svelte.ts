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

	private recognition: SpeechRecognition | null = null;
	private isSupported = false;

	constructor() {
		if (browser) {
			const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
			
			if (SpeechRecognition) {
				this.isSupported = true;
				this.recognition = new SpeechRecognition();
				this.recognition.continuous = true;
				this.recognition.interimResults = false;
				this.recognition.lang = 'en-US';

				this.recognition.onresult = (event) => {
					let finalTranscript = '';
					for (let i = event.resultIndex; i < event.results.length; ++i) {
						if (event.results[i].isFinal) {
							finalTranscript += event.results[i][0].transcript;
						}
					}
					if (finalTranscript) {
						this.transcript += (this.transcript ? ' ' : '') + finalTranscript.trim();
					}
				};

				this.recognition.onerror = (event) => {
					console.error('Speech recognition error', event.error);
					if (event.error === 'not-allowed') {
						this.error = 'Speech recognition permission denied.';
					} else {
						this.error = `Speech recognition error: ${event.error}`;
					}
					this.status = 'error';
				};

				this.recognition.onend = () => {
					if (this.status === 'listening') {
						// Restart if it stopped unexpectedly while we're supposed to be listening
						this.recognition?.start();
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
