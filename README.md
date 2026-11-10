# Lumina Mix

A BitChord HTTP addon prototype focused on transition-aware discovery and track ordering.

## Current scope

- BitChord-compatible `/manifest.json`, `/search`, and `/stream/{id}` routes.
- Jamendo catalogue adapter for tracks that Jamendo makes streamable.
- Transition scoring from BPM, Camelot key and optional energy metadata.
- Optional seed metadata on search: `seedBpm`, `seedKey`, `seedEnergy`.
- A diagnostic `/mix/score` endpoint for testing transition scores.

## Important limitations

This is the first working foundation, not a full DJ mixing engine. BitChord addons provide catalogue search and playable stream URLs; they do not receive control of BitChord's playback queue or mix two audio streams together. Lumina Mix can rank compatible search results, but true automatic queue control and beat-aligned crossfades require support in the player itself or a separate player integration.

The Jamendo adapter only returns catalogue items with an audio URL. It does not scrape other services, bypass DRM, or claim lossless quality. Actual quality and playback availability depend on the source provider.

## Setup

Requires Node.js 20+.

```bash
cp .env.example .env
# Set JAMENDO_CLIENT_ID in .env
npm install
npm test
npm start
```

The app reads environment variables directly. For local development, export them in your shell or use your hosting platform's environment-variable settings.

## Routes

- `GET /manifest.json`
- `GET /search?q=ambient`
- `GET /search?q=house&seedBpm=124&seedKey=8A&mix_mode=balanced`
- `GET /stream/jamendo%3A<track-id>`
- `GET /mix/score?fromBpm=120&fromKey=8A&toBpm=124&toKey=9A`
- `GET /health`

## Deploy

Deploy as a Node.js service on any HTTPS host. Set `JAMENDO_CLIENT_ID` and `PORT` as environment variables. Add the deployed HTTPS root URL (not the raw GitHub URL) in BitChord's Settings → Sources → Add an addon.

## Roadmap

1. Add provider-neutral track metadata and cache.
2. Improve tempo/key analysis where reliable source metadata or licensed analysis is available.
3. Add transition explanations and queue sequencing API.
4. Validate the addon against the current BitChord client and source-provider terms.
5. Implement BitChord addon request authentication once the public host is fixed.
