# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.14.0 create --template minimal --types ts --add prettier eslint storybook --install npm tootcast
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Component Index

### [RecordButton](file:///Users/ash/Web/bigears/src/lib/components/RecordButton.svelte)
A bespoke glassmorphism recording button.
- **Variants**: default.
- **States**: `recording`, `hover`, `active`.
- **Function**: Handles "Hold to Record" interaction with tactile visual feedback and pulsing animations. Remains custom to preserve its unique high-end aesthetic.

### [Waveform](file:///Users/ash/Web/bigears/src/lib/components/Waveform.svelte)
A full-screen symmetric waveform visualization.
- **Function**: Renders frequency data from an `AnalyserNode` onto a full-screen canvas during recording. Provides high-performance, fluid visual feedback.

### [Scrim](file:///Users/ash/Web/bigears/src/lib/components/Scrim.svelte)
A semi-transparent, blurring backdrop.
- **Function**: Focuses user attention by dimming and blurring the background UI when recording starts.

### [InstanceSelector](file:///Users/ash/Web/bigears/src/lib/components/InstanceSelector.svelte)
The Mastodon instance entry screen, built with `svelte-akui`.
- **Components**: `Field`, `TextInput`, `Button`, `InputGroup`.
- **Function**: Allows users to enter their instance URL and initiates the OAuth flow. Now uses the shared design system for a more integrated feel.
