/* eslint-env node */
// react-native-maps ships native-only code (codegenNativeCommands) with no web
// implementation. Consumers already feature-detect it via a guarded require(),
// but Metro still needs to statically resolve the module when bundling for
// web, so this stub is swapped in for that platform only (see metro.config.js).
function MapViewStub() {
  return null;
}
function MarkerStub() {
  return null;
}

module.exports = {
  default: MapViewStub,
  Marker: MarkerStub,
  PROVIDER_DEFAULT: undefined,
  PROVIDER_GOOGLE: undefined,
};
