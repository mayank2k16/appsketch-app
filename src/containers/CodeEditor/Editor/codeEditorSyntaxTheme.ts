/** Custom `react-syntax-highlighter` (hljs) style objects matching the
 * Windsurf/VS Code "Dark+" / "Light+" default themes, by eye off a
 * screenshot of the Windsurf editor — not extracted from the theme's actual
 * source, so treat as a close approximation rather than a pixel-exact
 * match. Swap the hex values below if exact values are ever available.
 *
 * Keys are the flat `hljs-*` class names this app's bundled highlight.js
 * core actually emits for TS/JS/JSON/CSS (verified by running `lowlight`
 * directly against sample code) — not the newer compound
 * `hljs-title.function_`-style classes from highlight.js v11. */
import type { TextStyle } from 'react-native';

type SyntaxStyleSheet = Record<string, TextStyle & { background?: string }>;

export const vsDarkSyntaxStyle: SyntaxStyleSheet = {
  hljs: { background: '#1E1E1E', color: '#D4D4D4' },

  'hljs-keyword': { color: '#C586C0' },
  'hljs-literal': { color: '#569CD6' },
  'hljs-meta-keyword': { color: '#569CD6' },

  'hljs-string': { color: '#CE9178' },
  'hljs-meta-string': { color: '#CE9178' },
  'hljs-regexp': { color: '#D16969' },

  'hljs-comment': { color: '#6A9955', fontStyle: 'italic' },
  'hljs-quote': { color: '#6A9955', fontStyle: 'italic' },
  'hljs-doctag': { color: '#608B4E' },

  'hljs-number': { color: '#B5CEA8' },

  'hljs-built_in': { color: '#4EC9B0' },
  'hljs-type': { color: '#4EC9B0' },

  'hljs-class': { color: '#D4D4D4' },
  'hljs-function': { color: '#D4D4D4' },
  'hljs-params': { color: '#D4D4D4' },
  'hljs-title': { color: '#DCDCAA' },

  'hljs-attr': { color: '#9CDCFE' },
  'hljs-attribute': { color: '#9CDCFE' },
  'hljs-variable': { color: '#9CDCFE' },
  'hljs-template-variable': { color: '#9CDCFE' },

  'hljs-name': { color: '#569CD6' },
  'hljs-tag': { color: '#808080' },

  'hljs-symbol': { color: '#D4D4D4' },
  'hljs-bullet': { color: '#D7BA7D' },
  'hljs-link': { color: '#569CD6', textDecorationLine: 'underline' },
  'hljs-meta': { color: '#9B9B9B' },

  'hljs-selector-tag': { color: '#D7BA7D' },
  'hljs-selector-id': { color: '#D7BA7D' },
  'hljs-selector-class': { color: '#D7BA7D' },
  'hljs-selector-attr': { color: '#D7BA7D' },
  'hljs-selector-pseudo': { color: '#D7BA7D' },

  'hljs-emphasis': { fontStyle: 'italic' },
  'hljs-strong': { fontWeight: 'bold' },
  'hljs-addition': { background: '#144212' },
  'hljs-deletion': { background: '#600000' },
};

/** White theme: a GitHub-Light-style palette on the paper canvas rather than
 * the saturated VS Code Light+ primaries (pure #0000FF / #A31515 / #008000
 * shouted on #FAFAF8). Ink base text, muted grey comments, one restrained hue
 * per token family so code stays readable without looking like a rainbow.
 * The background matches `codeEditorBg` so the highlighter layer never shows
 * as a white slab on the canvas. */
export const vsLightSyntaxStyle: SyntaxStyleSheet = {
  hljs: { background: '#FAFAF8', color: '#0B0B0C' },

  'hljs-keyword': { color: '#CF222E' },
  'hljs-literal': { color: '#0550AE' },
  'hljs-meta-keyword': { color: '#CF222E' },

  'hljs-string': { color: '#0A3069' },
  'hljs-meta-string': { color: '#0A3069' },
  'hljs-regexp': { color: '#116329' },

  'hljs-comment': { color: '#8C8D93', fontStyle: 'italic' },
  'hljs-quote': { color: '#8C8D93', fontStyle: 'italic' },
  'hljs-doctag': { color: '#8C8D93' },

  'hljs-number': { color: '#0550AE' },

  'hljs-built_in': { color: '#953800' },
  'hljs-type': { color: '#953800' },

  'hljs-class': { color: '#0B0B0C' },
  'hljs-function': { color: '#0B0B0C' },
  'hljs-params': { color: '#0B0B0C' },
  'hljs-title': { color: '#8250DF' },

  'hljs-attr': { color: '#0550AE' },
  'hljs-attribute': { color: '#0550AE' },
  'hljs-variable': { color: '#953800' },
  'hljs-template-variable': { color: '#953800' },

  'hljs-name': { color: '#116329' },
  'hljs-tag': { color: '#5C5D63' },

  'hljs-symbol': { color: '#0B0B0C' },
  'hljs-bullet': { color: '#953800' },
  'hljs-link': { color: '#0A3069', textDecorationLine: 'underline' },
  'hljs-meta': { color: '#5C5D63' },

  'hljs-selector-tag': { color: '#116329' },
  'hljs-selector-id': { color: '#0550AE' },
  'hljs-selector-class': { color: '#8250DF' },
  'hljs-selector-attr': { color: '#0550AE' },
  'hljs-selector-pseudo': { color: '#CF222E' },

  'hljs-emphasis': { fontStyle: 'italic' },
  'hljs-strong': { fontWeight: 'bold' },
  'hljs-addition': { background: 'rgba(18,161,80,0.08)' },
  'hljs-deletion': { background: 'rgba(229,72,77,0.08)' },
};
