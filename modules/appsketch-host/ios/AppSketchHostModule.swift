import ExpoModulesCore

struct OpenAppOptions: Record {
  @Field var bundleUrl: String = ""
  @Field var manifest: String = ""
  @Field var title: String = "App"
}

public final class AppSketchHostModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppSketchHost")

    Constant("sdkVersion") { "57.0.0" }

    AsyncFunction("openApp") { (options: OpenAppOptions) in
      guard let url = URL(string: options.bundleUrl), url.scheme?.hasPrefix("http") == true else {
        throw Exception(name: "ERR_BAD_URL", description: "Not an app URL: \(options.bundleUrl)")
      }
      guard let presenter = self.appContext?.utilities?.currentViewController() else {
        throw Exception(name: "ERR_NO_VIEW_CONTROLLER", description: "AppSketch is not in the foreground.")
      }
      // runOnQueue(.main) below: this closure is already on the main thread.
      MainActor.assumeIsolated {
        GuestSession.shared.open(
          GuestSession.Guest(bundleUrl: url, manifest: options.manifest, title: options.title),
          from: presenter
        )
      }
    }.runOnQueue(.main)
  }
}
