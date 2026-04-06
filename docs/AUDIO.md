# Mastodon Audio Upload: The "Opus Hint" Guide

This document explains the technical resolution for the `422: Validation failed: File has contents that are not what they are reported to be` error encountered when uploading browser-recorded audio to Mastodon.

## 1. The Problem: Spoof Detection
Mastodon uses backend media processing (typically `ffmpeg` via `Paperclip` or `ActiveStorage`) and a security check known as a "MediaTypeSpoofDetector".

*   **The Conflict**: Most modern browsers (especially Chrome) record audio using the **WebM container** (`audio/webm`).
*   **The Mismatch**: The server's `libmagic` utility identifies WebM as a **video container** (Matroska). When the API request reports the MIME type as `audio/webm`, the server sees a mismatch and rejects the file as a potential security risk (spoofing).

## 3. Implementation Reference: RecordRTC Store

The application uses a centralized reactive store in `src/lib/recorder.svelte.ts` which is powered by **RecordRTC**.

### Natural Tone Quality (CD-standard)
To capture a more natural, professional voice, we disable standard browser-level Digital Signal Processing (DSP) and boost the sample rate:

- **Bitrate**: 128 kbps (Transparent)
- **Sample Rate**: 48,000 Hz (CD-standard)
- **Echo Cancellation**: `false` (No processing)
- **Noise Suppression**: `false` (Preserves room tone)
- **Auto Gain Control**: `true` (Normalizes volume without clipping)

### Frontend Recorder logic (RecordRTC + Svelte 5):
```typescript
this.rtc = new RecordRTC(this.stream, {
  type: 'audio',
  mimeType: 'audio/webm', // Or ogg/mp4
  recorderType: StereoAudioRecorder,
  audioBitsPerSecond: 128000,
  sampleRate: 48000,
  desiredSampRate: 48000
});
```

### Usage in Components:
The UI remains decoupled from the recording engine:
```svelte
<script>
  import { recorder } from '$lib/recorder.svelte';
</script>

<RecordButton 
  isRecording={recorder.isRecording} 
  on:start={() => recorder.start()} 
  on:stop={() => recorder.stop()} 
/>
```

---

## 4. Why this works
By reporting `audio/opus` with a `.opus` extension, we satisfy two conditions:
1.  The reported MIME type starts with `audio/`, satisfying the server's expectation for an audio attachment.
2.  The `.opus` extension often triggers a more specialized `ffmpeg` parsing path that ignores the surrounding Matroska (WebM) container headers that would otherwise trigger the "video spoof" flag.

This approach is highly reliable across different Mastodon instance versions (Gargron/Mastodon, Glitch, Akkoma, Pleroma).
