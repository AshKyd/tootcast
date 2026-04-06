<script lang="ts">
	import { resolve } from '$app/paths';
	import InstanceSelector from '$lib/components/InstanceSelector.svelte';
	import { Divider, Padding, Panel } from 'svelte-akui';
	import { fade } from 'svelte/transition';
</script>

<div class="login-page" in:fade>
	<Panel style="width: 100%; max-width: 400px;">
		<Padding size="m">
			<h1 style="margin-bottom: 1rem;">Login</h1>
			<InstanceSelector />
			<div class="gap">
				<Divider />
			</div>
			<small><a class="icon-back" href={resolve('/app')}>Back to record</a></small>
		</Padding>
	</Panel>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100dvh;
		width: 100%;
		h1 {
			text-align: center;
			margin-top: 1rem;
		}
		.gap {
			margin: 1rem 0;
		}
	}
</style>
