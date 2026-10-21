/**
 * FirebaseCoreInternal (Swift) imports GoogleUtilities, which has no module map
 * when Firebase is built as a static library. The Podfile is generated, so the
 * fix that used to be hand-edited into it is applied here on every prebuild.
 */
const { withPodfile } = require('@expo/config-plugins');

const LINE = "  pod 'GoogleUtilities', :modular_headers => true";

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (c) => {
    if (!c.modResults.contents.includes(LINE)) {
      c.modResults.contents = c.modResults.contents.replace(
        /(\n\s*use_expo_modules!\n)/,
        `$1${LINE}\n`
      );
    }
    return c;
  });
};
