import fs from 'node:fs';
import path from 'node:path';

import { appTheme } from './AppTheme';
import { useCoderTheme } from './CoderTheme';

const CODER_DIR = path.join(__dirname, '..', '..', 'containers', 'CodeEditor');

/** The brand indigo. Correct everywhere in the app EXCEPT the coder screens,
 * which are a port of the achromatic web workspace. */
const BRAND_INDIGO = /#6C5CE7|108\s*,\s*92\s*,\s*231/i;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

describe('the coder screens are achromatic', () => {
  it('scopes accent away from the brand indigo', () => {
    const dark = useCoderTheme('dark');
    const light = useCoderTheme('light');

    expect(appTheme.dark.accent).toMatch(BRAND_INDIGO); // the app at large
    for (const t of [dark, light]) {
      expect(t.accent).not.toMatch(BRAND_INDIGO);
      expect(t.accent).toBe(t.codeEditorFocus);
      expect(t.accentSoft).toBe(t.codeEditorAccentWash);
    }
  });

  it('keeps every other token identical to the app palette', () => {
    const t = useCoderTheme('dark');
    for (const key of Object.keys(appTheme.dark)) {
      if (key === 'accent' || key === 'accentSoft') continue;
      expect(t[key as keyof typeof t]).toBe(
        appTheme.dark[key as keyof typeof appTheme.dark]
      );
    }
  });

  it('leaves no hardcoded indigo anywhere under containers/CodeEditor', () => {
    // The scope swap only covers `colors.accent`. A literal typed into a style
    // is invisible to it — which is how the inspector's selection outline
    // stayed violet long after the theme stopped being.
    const offenders = walk(CODER_DIR).filter((f) =>
      BRAND_INDIGO.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  it('never calls useAppTheme inside the coder screens', () => {
    // A screen that reads the unscoped palette gets the brand indigo back.
    // `ReturnType<typeof useAppTheme>` in a type position is fine — the shape
    // is the same object — so only reject the call.
    const offenders = walk(CODER_DIR).filter((f) =>
      /\buseAppTheme\s*\(/.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});
