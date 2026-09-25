# Walkthrough videos

These scripts make short narrated videos of the real site. A browser clicks through a page while it records, with captions, a title card and an end card on top. The recording is then lined up with a voiceover and rendered to a 1080p MP4 for YouTube.

Each video is a folder:

| File | What it is |
|---|---|
| `video.json` | The narration, split into segments, with each segment's caption lines, the voice used and each segment's length |
| `record.cjs` | What happens on screen during each segment |
| `thumbnail.cjs` | Renders the YouTube thumbnail on top of the real page |
| `youtube-details.md` | Title, description, chapters, tags and keyword notes |
| `out/` | Generated files: voiceovers, recording, MP4, captions and thumbnail. Not committed. |

Shared code: `lib/recorder.cjs` (browser, timeline, captions and overlays) and `build.py` (timing, voiceover mix, render).

## Requirements

- Node with Playwright and Chromium. Playwright isn't a project dependency: install it with `npm i -g playwright` and `npx playwright install chromium`, then run with `NODE_PATH=$(npm root -g)`. To use a Chromium that's already installed, set `CHROMIUM_PATH`.
- Python 3 and ffmpeg. Use a system `ffmpeg`, set `FFMPEG=/path/to/ffmpeg`, or run `pip install imageio-ffmpeg`.
- Voiceover MP3s, one per segment. The pilot used vidIQ's text-to-speech with the voice named in `video.json`. You can also record your own voice.

## Make a video

1. Build and serve the site: `npm run build && npx vite preview` (serves on http://127.0.0.1:4173). To record the live site instead, set `SITE_URL=https://your-site`.
2. Voiceover: save one MP3 per segment as `out/vo1.mp3`, `out/vo2.mp3`, and so on, reading each segment's `narration` text.
3. Store the segment lengths: `python3 tools/video/build.py durations max-safe-bid`
4. Record: `NODE_PATH=$(npm root -g) node tools/video/max-safe-bid/record.cjs`
5. Render: `python3 tools/video/build.py render max-safe-bid`. This writes `out/max-safe-bid.mp4` and `out/max-safe-bid.en.srt`, and prints the chapter times.
6. Thumbnail: `NODE_PATH=$(npm root -g) node tools/video/max-safe-bid/thumbnail.cjs`
7. Watch the video once with sound before you upload it.

## How the timing works

Every segment starts at a fixed time, calculated from the voiceover lengths plus a short pause between segments. `record.cjs` waits for each segment's start time before acting, so the screen matches the narration. Headless screen capture runs a few percent slow. The recorder therefore flashes green when the narration clock starts and magenta when it ends, and `build.py` finds both flashes and stretches the picture to real time before adding the audio.

## Tips for new videos

- Copy the `max-safe-bid` folder, rewrite `video.json`, then write the scenes in `record.cjs`. Use `v.typeInto(label, value)`, `v.hl(locator)`, `v.card(html)`, `v.badge(text)` and `v.at(seconds)`.
- Keep each segment under about 20 seconds, and aim for 60–120 seconds per video.
- While the site shows sample data, label it on screen (`v.badge('Sample property')`). With real listings, set `PROPERTY_ID` for the property scene.
- Keep the tone educational: no income promises, and say it's an estimate, not advice.
