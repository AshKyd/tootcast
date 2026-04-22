<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CountdownTimer from './CountdownTimer.svelte';

	const { Story } = defineMeta({
		title: 'Components/CountdownTimer',
		component: CountdownTimer
	});

	export { Story };
</script>

<Story name="Default" args={{ seconds: 45 }}>
	{#snippet children(args: any)}
		<div
			style="background: #080808; padding: 5rem; display: flex; justify-content: center; align-items: center; min-height: 200px; border-radius: 20px;"
		>
			<CountdownTimer {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Urgent" args={{ seconds: 8, urgent: true }}>
	{#snippet children(args: any)}
		<div
			style="background: #080808; padding: 5rem; display: flex; justify-content: center; align-items: center; min-height: 200px; border-radius: 20px;"
		>
			<CountdownTimer {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Final Seconds" args={{ seconds: 3, urgent: true }}>
	{#snippet children(args: any)}
		<div
			style="background: #080808; padding: 5rem; display: flex; justify-content: center; align-items: center; min-height: 200px; border-radius: 20px;"
		>
			<CountdownTimer {...args} />
		</div>
	{/snippet}
</Story>
