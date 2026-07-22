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

export const vsLightSyntaxStyle: SyntaxStyleSheet = {
  hljs: { background: '#FFFFFF', color: '#000000' },

  'hljs-keyword': { color: '#AF00DB' },
  'hljs-literal': { color: '#0000FF' },
  'hljs-meta-keyword': { color: '#0000FF' },

  'hljs-string': { color: '#A31515' },
  'hljs-meta-string': { color: '#A31515' },
  'hljs-regexp': { color: '#811F3F' },

  'hljs-comment': { color: '#008000', fontStyle: 'italic' },
  'hljs-quote': { color: '#008000', fontStyle: 'italic' },
  'hljs-doctag': { color: '#008000' },

  'hljs-number': { color: '#098658' },

  'hljs-built_in': { color: '#267F99' },
  'hljs-type': { color: '#267F99' },

  'hljs-class': { color: '#000000' },
  'hljs-function': { color: '#000000' },
  'hljs-params': { color: '#000000' },
  'hljs-title': { color: '#795E26' },

  'hljs-attr': { color: '#0451A5' },
  'hljs-attribute': { color: '#0451A5' },
  'hljs-variable': { color: '#001080' },
  'hljs-template-variable': { color: '#001080' },

  'hljs-name': { color: '#800000' },
  'hljs-tag': { color: '#800000' },

  'hljs-symbol': { color: '#000000' },
  'hljs-bullet': { color: '#795E26' },
  'hljs-link': { color: '#0000FF', textDecorationLine: 'underline' },
  'hljs-meta': { color: '#795E26' },

  'hljs-selector-tag': { color: '#800000' },
  'hljs-selector-id': { color: '#800000' },
  'hljs-selector-class': { color: '#800000' },
  'hljs-selector-attr': { color: '#800000' },
  'hljs-selector-pseudo': { color: '#800000' },

  'hljs-emphasis': { fontStyle: 'italic' },
  'hljs-strong': { fontWeight: 'bold' },
  'hljs-addition': { background: '#EAFFEA' },
  'hljs-deletion': { background: '#FFECEC' },
};
