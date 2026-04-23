<script lang="ts">
	import { Panel, Padding, Fieldset, Button, InputGroup, Small } from 'svelte-akui';
	import { settings } from '$lib/settings.svelte';
	import { fly } from 'svelte/transition';

	function setModel(model: 'english' | 'multilingual' | 'none') {
		settings.update('whisperModel', model);
	}
</script>

<div class="setup-step" in:fly={{ y: 20 }}>
	<Panel>
		<Padding size="l">
			<div class="setup-content">
				<h2 class="text-3xl font-bold mb-2 leading-tight">Alt text options</h2>
				<p>How do you want to handle alt text?</p>

				<Fieldset legend="Automatically with AI">
					<div class="mb-4">
						This respects your privacy and runs on your own device. This will download about 30MB of
						data.
					</div>
					<InputGroup style="width: 100%;">
						<Button
							variant="regular"
							label="English"
							onclick={() => setModel('english')}
							style="flex: 1;"
						/>
						<Button
							variant="regular"
							label="Multilingual"
							onclick={() => setModel('multilingual')}
							style="flex: 1;"
						/>
					</InputGroup>
				</Fieldset>
				<div class="no-ai-option m-t-m">
					<Small>
						If you prefer not to use AI transcription, you can
						<button class="link-btn" onclick={() => setModel('none')}>
							manually write alt text
						</button>. You can change this later in settings.
					</Small>
				</div>
			</div>
		</Padding>
	</Panel>
</div>

<style>
	.setup-step {
		width: calc(100% - 2rem);
		max-width: 420px;
	}
	.setup-content {
		max-width: 100%;
	}
	.link-btn {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-accent);
		text-decoration: underline;
		font: inherit;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 0.2s;
	}
	.link-btn:hover {
		opacity: 1;
	}
	.m-t-m {
		margin-top: var(--spacing-m);
	}
	p {
		margin-bottom: 30px;
		color: var(--akui-fg-secondary);
	}
</style>
