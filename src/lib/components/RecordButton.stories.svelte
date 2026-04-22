<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RecordButton from './RecordButton.svelte';
	import { fn } from 'storybook/test';

	const { Story } = defineMeta({
		title: 'Components/RecordButton',
		component: RecordButton,
		tags: ['autodocs'],
		argTypes: {
			isReady: { control: 'boolean' },
			isRecording: { control: 'boolean' },
			isInitializing: { control: 'boolean' },
			isStopping: { control: 'boolean' }
		},
		args: {
			onwarmup: fn(),
			onstart: fn(),
			onstop: fn()
		}
	});
</script>

<Story name="Idle" args={{ isReady: true }} />

<Story name="Initializing" args={{ isReady: true, isInitializing: true }} />

<Story name="Recording" args={{ isReady: true, isRecording: true }} />

<Story name="Stopping" args={{ isReady: true, isStopping: true }} />

<Story name="Disabled" args={{ isReady: false }} />
