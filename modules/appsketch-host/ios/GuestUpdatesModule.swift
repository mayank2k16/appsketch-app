import ExpoModulesCore

/// Stands in for expo-updates (which AppSketch does not ship) so a guest app's
/// expo-constants reads the guest's manifest: `Constants.expoConfig` is then the
/// guest's app.json. In AppSketch's own runtime it reports an embedded launch,
/// so expo-constants keeps AppSketch's embedded config.
public final class GuestUpdatesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUpdates")

    Constants { () -> [String: Any?] in
      let manifest = GuestSession.shared.manifest(forBundleURL: self.appContext?.bundleURL)
      return [
        "isEnabled": false,
        "isEmbeddedLaunch": manifest == nil,
        "isUsingEmbeddedAssets": manifest == nil,
        "manifestString": manifest,
        "localAssets": [String: String](),
        "isEmergencyLaunch": false,
        "runtimeVersion": nil,
        "channel": nil,
        "updateId": nil,
      ]
    }
  }
}
