<script lang="ts">
	import {
		Button,
		MenuButton,
		MenuItem,
		Tooltip,
		// @ts-ignore - createTooltip is exported but missing from types
		createTooltip,
		Padding,
		InfoBox
	} from 'svelte-akui';
	import { onMount } from 'svelte';
	import { type StatusVisibility } from '$lib/mastodon';
	import { settings } from '$lib/settings.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fade } from 'svelte/transition';
	import { transcript } from '$lib/transcript.svelte';

	let { recorder, ondiscard, onsend, error } = $props();

	let visibility = $state<StatusVisibility>(settings.data.defaultVisibility);

	$effect(() => {
		if (settings.isLoaded && visibility !== settings.data.defaultVisibility) {
			settings.data.defaultVisibility = visibility;
			settings.save();
		}
	});

	const visibilityOptions = [
		{ value: 'public' as StatusVisibility, label: 'Public', icon: 'globe' },
		{ value: 'unlisted' as StatusVisibility, label: 'Unlisted', icon: 'moon' },
		{ value: 'private' as StatusVisibility, label: 'Followers only', icon: 'lock' },
		{ value: 'direct' as StatusVisibility, label: 'Direct Message', icon: 'at' }
	];

	const currentVisibilityIcon = $derived.by(() => {
		return visibilityOptions.find((v) => v.value === visibility)?.icon || 'globe';
	});

	const currentVisibilityLabel = $derived.by(() => {
		return visibilityOptions.find((v) => v.value === visibility)?.label || 'Public';
	});

	const deleteT = createTooltip({ position: 'top' });
	const privacyT = createTooltip({ position: 'top' });

	let isMouse = $state(false);

	onMount(() => {
		isMouse = window.matchMedia('(hover: hover)').matches;
	});

	async function handleSend() {
		if (!recorder.audioBlob) return;

		const description = $transcript?.trim() || 'Voice note recorded with TootCast';
		onsend({
			blob: recorder.audioBlob,
			visibility,
			description
		});
	}

	function handleDiscard() {
		recorder.discard();
		ondiscard();
	}
</script>

<div class="playback-step" transition:fade>
	{#if error}
		<div class="error-container w-full max-w-sm m-b-m" transition:fade>
			<InfoBox variant="error" title="Post failed">
				{error}
			</InfoBox>
		</div>
	{/if}
	<div class="player-wrapper">
		<AudioPlayer {recorder} />
	</div>

	<div class="actions-row">
		<Tooltip
			visible={deleteT.visible && isMouse}
			x={deleteT.x}
			y={deleteT.y}
			position={deleteT.position}
		>
			<Padding size="s">Delete and start over</Padding>
		</Tooltip>
		<!-- Offset the 1.5rem internal padding of the large ghost button to align its icon with the player -->
		<Button
			variant="ghost"
			icon="trash"
			iconPosition="left"
			label="Delete"
			onclick={handleDiscard}
			size="large"
			{...isMouse ? deleteT.handlers : {}}
		/>

		<div class="spacer"></div>

		<Tooltip
			visible={privacyT.visible && isMouse}
			x={privacyT.x}
			y={privacyT.y}
			position={privacyT.position}
		>
			<Padding size="s">Post privacy: {currentVisibilityLabel}</Padding>
		</Tooltip>
		<MenuButton
			icon={currentVisibilityIcon}
			variant="regular"
			size="large"
			origin="bottom-right"
			{...isMouse ? privacyT.handlers : {}}
		>
			{#snippet menu()}
				{#each visibilityOptions as option}
					<MenuItem
						label={option.label}
						icon={option.icon}
						onclick={() => (visibility = option.value)}
					/>
				{/each}
			{/snippet}
		</MenuButton>

		{#if auth.session}
			<Button
				variant="accent"
				icon="send"
				iconPosition="left"
				label="Post"
				onclick={handleSend}
				size="large"
				class="post-button"
			/>
		{:else}
			<Button
				variant="accent"
				icon="box-arrow-in-right"
				iconPosition="left"
				onclick={async () => {
					await recorder.saveToStore();
					goto(resolve('/login'));
				}}
				size="large"
				class="post-button"
			>
				Login<span class="no-mobile"> to Post</span>
			</Button>
		{/if}
	</div>
</div>

<style>
	.playback-step {
		position: absolute;
		bottom: 10dvh;
		left: 1rem;
		width: calc(100% - 2rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.spacer {
		flex: 1;
	}

	.player-wrapper {
		width: 100%;
		max-width: 600px;
		margin-bottom: 2.5rem;
	}

	.actions-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		max-width: 600px;
		/* Match AudioPlayer internal padding to keep buttons aligned with player controls */
		padding: 0 2rem 0 0;
	}

	:global(.post-button) {
		min-width: 10em;
	}

	@media (max-width: 640px) {
		.playback-step {
			padding: 0;
		}
		.actions-row {
			padding-right: 0;
		}
		:global(.playback-step .post-button) {
			min-width: 0 !important;
		}
	}
</style>
