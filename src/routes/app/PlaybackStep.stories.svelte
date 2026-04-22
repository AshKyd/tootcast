<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PlaybackStep from './PlaybackStep.svelte';
	import { fn } from 'storybook/test';
	import { auth } from '$lib/auth.svelte';
	import { settings } from '$lib/settings.svelte';

	const { Story } = defineMeta({
		title: 'App/PlaybackStep',
		component: PlaybackStep,
		tags: ['autodocs'],
		args: {
			recorder: {
				audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
				audioBlob: new Blob([''], { type: 'audio/ogg' }),
				discard: fn(),
				saveToStore: fn(),
				clearStore: fn()
			},
			onsuccess: fn(),
			ondiscard: fn(),
			onerror: fn()
		}
	});
</script>

<Story
	name="Logged In"
	play={async () => {
		auth.setSession({
			instance: 'mastodon.social',
			accessToken: 'mock-token'
		});
		settings.isLoaded = true;
		settings.data.defaultVisibility = 'unlisted';
	}}
/>

<Story
	name="Logged Out"
	play={async () => {
		auth.setSession(null);
		settings.isLoaded = true;
		settings.data.defaultVisibility = 'public';
	}}
/>
