import { browser } from '$app/environment';
import { db } from './db';

export interface UserSettings {
	deviceId: string;
	noiseCancellation: boolean;
	addHashtag: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
	deviceId: '',
	noiseCancellation: false,
	addHashtag: true
};

class Settings {
	// --- State ---
	data = $state<UserSettings>({ ...DEFAULT_SETTINGS });
	devices = $state<MediaDeviceInfo[]>([]);
	isLoaded = $state(false);

	/**
	 * Derived state to check if we are seeing generic names instead of real device labels.
	 */
	hasMissingLabels = $derived.by(() => {
		if (!this.devices.length) return false;
		// If at least one device has a substantial label, we consider things "unlocked"
		return this.devices.every((d) => !d.label || d.label === 'Default');
	});

	constructor() {
		if (browser) {
			this.load();
		}
	}

	/**
	 * Loads settings from IndexedDB.
	 */
	async load() {
		if (!browser) return;
		const saved = await db.get<UserSettings>('user_settings');
		if (saved) {
			this.data = { ...DEFAULT_SETTINGS, ...saved };
		}
		this.isLoaded = true;
		await this.refreshDevices();
	}

	/**
	 * Saves current settings to IndexedDB.
	 */
	async save() {
		if (!browser) return;
		await db.set('user_settings', $state.snapshot(this.data));
	}

	/**
	 * Updates a single setting and persists it.
	 */
	async update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
		this.data[key] = value;
		await this.save();
	}

	/**
	 * Requests temporary microphone permission to "unlock" the official device labels.
	 */
	async unlockLabels() {
		if (!browser || !navigator.mediaDevices) return;
		
		try {
			console.log('🔓 Attempting to unlock device labels...');
			const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			// Immediately refresh
			await this.refreshDevices();
			// Kill the stream immediately so the hardware light turns off
			tempStream.getTracks().forEach((t) => t.stop());
		} catch (err) {
			console.warn('⚠️ Could not unlock audio labels:', err);
		}
	}

	/**
	 * Refreshes the list of available audio input devices with deduplication.
	 */
	async refreshDevices() {
		if (!browser || !navigator.mediaDevices) return;

		try {
			const allDevices = await navigator.mediaDevices.enumerateDevices();
			const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');

			// Deduplicate by deviceId (favoring the one with a label)
			const uniqueDevices: Record<string, MediaDeviceInfo> = {};
			for (const d of audioInputs) {
				const existing = uniqueDevices[d.deviceId];
				if (!existing || (!existing.label && d.label)) {
					uniqueDevices[d.deviceId] = d;
				}
			}

			this.devices = Object.values(uniqueDevices);
			console.log(`🎙️ Found ${this.devices.length} unique audio inputs.`);
		} catch (err) {
			console.warn('⚠️ Could not enumerate audio devices:', err);
		}
	}
}

// Singleton instance
export const settings = new Settings();
