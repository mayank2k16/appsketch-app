package ai.appsketch.host

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Stands in for expo-updates (which AppSketch does not ship) so a guest app's
 * expo-constants reads the guest's manifest: `Constants.expoConfig` is then the
 * guest's app.json. In AppSketch's own runtime it reports an embedded launch,
 * which makes expo-constants fall back to AppSketch's embedded config as usual.
 */
class GuestUpdatesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      val manifest = GuestSession.manifestFor(appContext.reactContext as? com.facebook.react.bridge.ReactContext)
      mapOf(
        "isEnabled" to false,
        "isEmbeddedLaunch" to (manifest == null),
        "isUsingEmbeddedAssets" to (manifest == null),
        "manifestString" to manifest,
        "localAssets" to emptyMap<String, String>(),
        "isEmergencyLaunch" to false,
        "runtimeVersion" to null,
        "channel" to null,
        "updateId" to null
      )
    }
  }
}
