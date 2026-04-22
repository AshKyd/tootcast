<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import RecordStep from './RecordStep.svelte';

	const { Story } = defineMeta({
		title: 'Routes/App/RecordStep',
		component: RecordStep,
		parameters: {
			layout: 'fullscreen'
		}
	});

	export { Story };
</script>

<script lang="ts">
	const baseRecorder = {
		error: null,
		status: 'ready',
		isRecording: false,
		isInitializing: false,
		isReady: true,
		isStopping: false,
		isNearLimit: false,
		remainingSeconds: 60,
		analyser: null,
		start: () => console.log('Start recording'),
		stop: () => console.log('Stop recording'),
		init: () => console.log('Init recorder')
	};
</script>

<Story name="Idle">
	{#snippet children()}
		<RecordStep recorder={baseRecorder} error={null} />
	{/snippet}
</Story>

<Story name="Recording (Normal)">
	{#snippet children()}
		<RecordStep
			recorder={{
				...baseRecorder,
				status: 'recording',
				isRecording: true,
				remainingSeconds: 45,
				isNearLimit: false
			}}
			error={null}
		/>
	{/snippet}
</Story>

<Story name="Recording (Urgent)">
	{#snippet children()}
		<RecordStep
			recorder={{
				...baseRecorder,
				status: 'recording',
				isRecording: true,
				remainingSeconds: 5,
				isNearLimit: true
			}}
			error={null}
		/>
	{/snippet}
</Story>

<Story name="Error State">
	{#snippet children()}
		<RecordStep recorder={baseRecorder} error="Microphone access denied" />
	{/snippet}
</Story>
