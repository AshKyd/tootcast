<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AudioPlayer from './AudioPlayer.svelte';

	const { Story } = defineMeta({
		title: 'Components/AudioPlayer',
		component: AudioPlayer,
		tags: ['autodocs'],
		args: {
			src: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg'
		}
	});
</script>

<Story name="Default" />
