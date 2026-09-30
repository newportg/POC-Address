<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		// Load Swagger UI from CDN
		const script = document.createElement('script');
		script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
		script.onload = () => {
			const preset = document.createElement('script');
			preset.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js';
			preset.onload = () => {
				(window as any).SwaggerUIBundle({
					url: '/api/docs',
					dom_id: '#swagger-ui',
					deepLinking: true,
					presets: [
						(window as any).SwaggerUIBundle.presets.apis,
						(window as any).SwaggerUIStandalonePreset
					],
					layout: 'StandaloneLayout',
				});
			};
			document.head.appendChild(preset);
		};
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>POC Address API - Documentation</title>
	<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</svelte:head>

<main>
	<div id="swagger-ui"></div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	main {
		width: 100%;
		height: 100vh;
	}
</style>
