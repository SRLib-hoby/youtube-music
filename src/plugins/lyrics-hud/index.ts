import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { t } from '@/i18n';
import { renderer } from './renderer';

export type LyricsHudPluginConfig = {
  enabled: boolean;
};

export default createPlugin({
  name: () => t('plugins.lyrics-hud.name'),
  description: () => t('plugins.lyrics-hud.description'),
  restartNeeded: true,
  config: { enabled: false } as LyricsHudPluginConfig,
  stylesheets: [style],
  renderer,
});
