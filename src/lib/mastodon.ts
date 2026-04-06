import { createRestAPIClient } from 'masto';
import { db } from './db';

export interface AppConfig {
	clientId: string;
	clientSecret: string;
	instance: string;
}

export interface UserSession {
	accessToken: string;
	instance: string;
}

const SCOPES = 'read write:statuses write:media';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '';

/**
 * Ensures the app is registered on the given instance.
 * Stores and reuses credentials.
 */
export async function getAppConfig(instance: string): Promise<AppConfig> {
	const cleanInstance = instance.replace(/^https?:\/\//, '').replace(/\/$/, '');
	const cacheKey = `app_${cleanInstance}`;
	const cached = await db.get<AppConfig>(cacheKey);

	if (cached) return cached;

	const client = createRestAPIClient({ url: `https://${cleanInstance}` });
	const app = await client.v1.apps.create({
		clientName: 'Big Ears',
		redirectUris: REDIRECT_URI,
		scopes: SCOPES,
		website: window.location.origin,
	});

	const config: AppConfig = {
		clientId: app.clientId || '',
		clientSecret: app.clientSecret || '',
		instance: cleanInstance,
	};

	await db.set(cacheKey, config);
	return config;
}

/**
 * Generates the authorization URL for the user.
 */
export async function getAuthUrl(instance: string): Promise<string> {
	const config = await getAppConfig(instance);
	const params = new URLSearchParams({
		client_id: config.clientId,
		response_type: 'code',
		redirect_uri: REDIRECT_URI,
		scope: SCOPES,
	});

	return `https://${config.instance}/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges an OAuth code for an access token.
 */
export async function exchangeCode(instance: string, code: string): Promise<UserSession> {
	const config = await getAppConfig(instance);

	const formData = new FormData();
	formData.append('client_id', config.clientId);
	formData.append('client_secret', config.clientSecret);
	formData.append('redirect_uri', REDIRECT_URI);
	formData.append('grant_type', 'authorization_code');
	formData.append('code', code);

	const response = await fetch(`https://${config.instance}/oauth/token`, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		throw new Error('Failed to exchange code for token');
	}

	const data = await response.json();
	const session: UserSession = {
		accessToken: data.access_token,
		instance: config.instance,
	};

	await db.set('session', session);
	return session;
}

/**
 * Returns an authenticated masto client.
 */
export async function getMastoClient() {
	const session = await db.get<UserSession>('session');
	if (!session) return null;

	return createRestAPIClient({
		url: `https://${session.instance}`,
		accessToken: session.accessToken,
	});
}

export type StatusVisibility = 'public' | 'unlisted' | 'private' | 'direct';

/**
 * Uploads a voice note to Mastodon.
 */
export async function postVoiceNote(
	blob: Blob,
	text?: string,
	visibility: StatusVisibility = 'public'
): Promise<void> {
	const client = await getMastoClient();
	if (!client) throw new Error('Not authenticated with Mastodon.');

	// Mastodon is picky about MIME types. 
	// CHROME FIX: WebM is technically a video container.
	// Reporting it as 'audio/opus' with a '.opus' extension helps bypass the video-spoof-detector.
	let mimeType = blob.type.split(';')[0];
	let extension = 'ogg';

	if (mimeType.includes('webm')) {
		mimeType = 'audio/opus'; // The "hint" for Chrome WebM
		extension = 'opus';
	} else if (mimeType.includes('mp4')) {
		mimeType = 'audio/mp4';
		extension = 'm4a';
	} else if (mimeType.includes('ogg')) {
		mimeType = 'audio/ogg';
		extension = 'ogg';
	}

	const filename = `voicenote_${Date.now()}.${extension}`;
	const file = new File([blob], filename, { type: mimeType });

	console.log('📡 Mastodon: Preparing upload (Normalized)...');
	console.table({
		filename,
		mimeType,
		reportedSize: `${(blob.size / 1024).toFixed(2)} KB`,
		blobOriginType: blob.type
	});

	try {
		// 1. Upload Media
		console.log('📡 Mastodon: Uploading media...');
		const attachment = await client.v1.media.create({
			file,
			description: 'Voice note recorded with Big Ears'
		});
		console.log('✅ Mastodon: Media uploaded', attachment.id);

		// 2. Post Status with Media
		console.log('📡 Mastodon: Posting status...');
		
		const statusText = text ? `${text} #bigears` : 'A voice note from #bigears 👂';

		await client.v1.statuses.create({
			status: statusText,
			mediaIds: [attachment.id],
			visibility
		});
		console.log('✅ Mastodon: Status posted');
	} catch (err: unknown) {
		console.error('❌ Mastodon API Error:', err);
		// Log more details if available safely
		if (err && typeof err === 'object' && 'data' in err) {
			console.error('Error Data:', (err as { data: unknown }).data);
		}
		throw err;
	}
}

/**
 * Logs out the current user.
 */
export async function logout() {
	await db.delete('session');
}
