import { createRenderer } from '@/utils';
import { fetchLyrics, currentLyrics } from '@/plugins/synced-lyrics/providers';
import type { RendererContext } from '@/types/contexts';
import type { YoutubePlayer } from '@/types/youtube-player';
import type { LyricsHudPluginConfig } from './index';
import type { SongInfo } from '@/providers/song-info';

let api: YoutubePlayer | null = null;
let interval: NodeJS.Timeout | null = null;
let lyricsVersion = 0;
let currentIndex = -1;
let container: HTMLElement | null = null;

function createHud() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'lyricsHud';
  document.body.appendChild(container);
}

function renderLines() {
  if (!container) return;
  const data = currentLyrics()?.data;
  const lines = data?.lines;
  if (!lines) {
    container.textContent = '';
    return;
  }
  container.innerHTML = lines
    .map((l) => `<div class="hud-line">${l.text}</div>`) 
    .join('');
  currentIndex = -1;
}

function updateLine() {
  if (!container) return;
  const lines = currentLyrics()?.data?.lines;
  if (!api || !lines) return;
  const time = api.getCurrentTime() * 1000;
  let idx = lines.length - 1;
  for (let i = 0; i < lines.length; i++) {
    const next = lines[i + 1];
    if (time < (next?.timeInMs ?? Infinity)) {
      idx = i;
      break;
    }
  }
  if (idx === currentIndex) return;
  const children = container.children;
  if (children[currentIndex]) children[currentIndex].classList.remove('active');
  if (children[idx]) {
    children[idx].classList.add('active');
    (children[idx] as HTMLElement).scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
  currentIndex = idx;
}

export const renderer = createRenderer<{
  onPlayerApiReady: (api: YoutubePlayer) => void;
  start: (ctx: RendererContext<LyricsHudPluginConfig>) => void;
  stop: () => void;
}>({
  onPlayerApiReady(apiInstance) {
    api = apiInstance;
    interval = setInterval(() => {
      updateLine();
      const version = currentLyrics()?.data?.lines?.length ?? 0;
      if (version !== lyricsVersion) {
        lyricsVersion = version;
        renderLines();
      }
    }, 100);
  },

  async start(ctx) {
    createHud();
    ctx.ipc.on('ytmd:update-song-info', (info: SongInfo) => {
      fetchLyrics(info);
    });
  },

  stop() {
    if (interval) clearInterval(interval);
    container?.remove();
    container = null;
    api = null;
    interval = null;
    currentIndex = -1;
  },
});
