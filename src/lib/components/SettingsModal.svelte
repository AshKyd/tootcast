<script lang="ts">
	import { Modal, Padding, Button, Select, Small } from 'svelte-akui';
	import { settings } from '$lib/settings.svelte';
	import { recorder } from '$lib/recorder.svelte';
	import { Mic, Hash } from 'svelte-bootstrap-icons';

	let { onClose } = $props<{ onClose: () => void }>();
	let isSearching = $state(false);

	const deviceOptions = $derived(
		settings.devices.map((d) => ({
			value: d.deviceId,
			label: d.label || `Microphone (${d.deviceId.slice(0, 4)}...)`
		}))
	);

	async function handleSearch() {
		isSearching = true;
		// A short delay to ensure UI updates before the blocking scan
		await new Promise((resolve) => setTimeout(resolve, 100));
		await settings.unlockLabels();
		isSearching = false;
	}

	function handleDeviceChange() {
		settings.save();
		// Re-initialize recorder to switch to the new hardware device immediately
		recorder.disconnect();
		recorder.init();
	}

	function handleSave() {
		settings.save();
		onClose();
	}
</script>

<Modal title="Settings" icon="gear" {onClose} fullscreenOnMobile={true}>
	<div class="settings-content">
		<Padding size="l">
			<section class="settings-section">
				<header class="section-header">
					<Mic width="18" height="18" />
					<h3>Audio Hardware</h3>
				</header>

				<div class="field">
					{#if settings.hasMissingLabels}
						<div class="search-container">
							<Button
								variant="accent"
								loading={isSearching}
								icon="search"
								label="Search for microphones"
								onclick={handleSearch}
							/>
						</div>
					{:else}
						<label for="device-select" class="sr-only">Recording Device</label>
						<Select
							id="device-select"
							bind:value={settings.data.deviceId}
							options={deviceOptions}
							placeholder="Default System Microphone"
							onchange={handleDeviceChange}
						/>
					{/if}
				</div>

				<div class="control-list mt-8">
					<label class="control-row">
						<div class="control-label">
							<span class="title">Noise Cancellation</span>
							<Small>Reduce background hiss and fan noise. May reduce quality.</Small>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.data.noiseCancellation}
							onchange={() => settings.save()}
						/>
					</label>
				</div>
			</section>

			<section class="settings-section mt-8">
				<header class="section-header">
					<Hash width="18" height="18" />
					<h3>Post Preferences</h3>
				</header>

				<div class="control-list">
					<label class="control-row">
						<div class="control-label">
							<span class="title">Append #VoiceNote</span>
							<Small>Include the hashtag in posts so we can find them in the app.</Small>
						</div>
						<input
							type="checkbox"
							bind:checked={settings.data.addHashtag}
							onchange={() => settings.save()}
						/>
					</label>
				</div>
			</section>
		</Padding>
	</div>

	{#snippet footer()}
		<Button variant="accent" label="Done" onclick={handleSave} />
	{/snippet}
</Modal>

<style>
	.settings-content {
		max-width: 100%;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		color: var(--akui-fg-secondary);
	}

	.section-header h3 {
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.field label {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.control-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--akui-bg-secondary);
		border-radius: var(--akui-radius-m);
		padding: 1rem;
		border: 1px solid var(--akui-border-input);
	}

	.control-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		cursor: pointer;
	}

	.control-label {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.control-label .title {
		font-size: 0.95rem;
		font-weight: 600;
	}

	input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
		accent-color: var(--akui-bg-accent);
		cursor: pointer;
	}

	.mt-8 {
		margin-top: 2rem;
	}
</style>
