/**
 * Minimalist WAV Encoder for AudioBuffer.
 * Converts an AudioBuffer into a standards-compliant audio/wav Blob.
 */
export function encodeWAV(buffer: AudioBuffer): Blob {
	const numChannels = buffer.numberOfChannels;
	const sampleRate = buffer.sampleRate;
	const format = 1; // PCM
	const bitDepth = 16;

	const bytesPerSample = bitDepth / 8;
	const blockAlign = numChannels * bytesPerSample;

	const dataLength = buffer.length * blockAlign;
	const bufferLength = 44 + dataLength;

	const arrayBuffer = new ArrayBuffer(bufferLength);
	const view = new DataView(arrayBuffer);

	/* RIFF identifier */
	writeString(view, 0, 'RIFF');
	/* RIFF chunk length */
	view.setUint32(4, 36 + dataLength, true);
	/* RIFF type */
	writeString(view, 8, 'WAVE');
	/* format chunk identifier */
	writeString(view, 12, 'fmt ');
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, format, true);
	/* channel count */
	view.setUint16(22, numChannels, true);
	/* sample rate */
	view.setUint32(24, sampleRate, true);
	/* byte rate (sample rate * block align) */
	view.setUint32(28, sampleRate * blockAlign, true);
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, blockAlign, true);
	/* bits per sample */
	view.setUint16(34, bitDepth, true);
	/* data chunk identifier */
	writeString(view, 36, 'data');
	/* data chunk length */
	view.setUint32(40, dataLength, true);

	// Write PCM samples
	const offset = 44;
	for (let i = 0; i < buffer.numberOfChannels; i++) {
		const channelData = buffer.getChannelData(i);
		for (let j = 0; j < channelData.length; j++) {
			// Interleave channels
			const index = offset + (j * numChannels + i) * bytesPerSample;
			// Clamp and convert to 16-bit PCM
			const s = Math.max(-1, Math.min(1, channelData[j]));
			view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
	}

	return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}
