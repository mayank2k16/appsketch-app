package ai.appsketch.host

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class OpenAppOptions : Record {
  @Field val bundleUrl: String = ""
  @Field val manifest: String = ""
  @Field val title: String = "App"
}

class AppSketchHostModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppSketchHost")

    Constant("sdkVersion") { "57.0.0" }

    AsyncFunction("openApp") { options: OpenAppOptions ->
      val activity = appContext.currentActivity
        ?: throw CodedException("ERR_NO_ACTIVITY", "AppSketch is not in the foreground.", null)
      if (!options.bundleUrl.startsWith("http")) {
        throw CodedException("ERR_BAD_URL", "Not an app URL: ${options.bundleUrl}", null)
      }
      GuestSession.open(
        activity,
        GuestSession.Guest(options.bundleUrl, options.manifest, options.title)
      )
    }.runOnQueue(Queues.MAIN)
  }
}
