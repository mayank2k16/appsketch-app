package ai.appsketch.host

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JSBundleLoaderDelegate
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * The one guest app that can be running at a time.
 *
 * A guest gets its own ReactHost (its own Hermes runtime, TurboModules and
 * Expo AppContext) built from the same native package list as AppSketch, so
 * every native module AppSketch ships is available to it. Its JS comes over
 * HTTP and is reported to React Native under that URL, which makes
 * `require('./image.png')` resolve against the app's server like Expo Go does.
 */
object GuestSession {
  data class Guest(val bundleUrl: String, val manifest: String, val title: String)

  @Volatile var current: Guest? = null
    private set

  var host: ReactHost? = null
    private set

  /** Set by GuestActivity while it is on screen. Called on the main thread. */
  var onError: ((Exception) -> Unit)? = null

  private val main = Handler(Looper.getMainLooper())

  private val http: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .connectTimeout(20, TimeUnit.SECONDS)
      .readTimeout(180, TimeUnit.SECONDS)
      .build()
  }

  fun open(activity: Activity, guest: Guest) {
    close()
    current = guest
    clearHostLinkingURL()
    host = createHost(activity.application, guest)
    activity.startActivity(Intent(activity, GuestActivity::class.java))
  }

  /** Re-downloads the bundle and restarts the guest's JS. */
  fun reload() {
    host?.reload("AppSketch: reload guest app")
  }

  fun close() {
    host?.destroy("AppSketch: guest app closed", null)
    host = null
    current = null
  }

  /**
   * The guest manifest if [context] is the running guest's React context,
   * null for AppSketch's own context (which then keeps its embedded config).
   */
  fun manifestFor(context: ReactContext?): String? {
    val guest = current ?: return null
    val ctx = context ?: return null
    if (ctx.sourceURL == guest.bundleUrl) return guest.manifest
    val app = ctx.applicationContext as? ReactApplication ?: return null
    val ownContext = app.reactHost?.currentReactContext
    return if (ownContext != null && ownContext !== ctx) guest.manifest else null
  }

  @Suppress("UNCHECKED_CAST")
  /**
   * expo-linking keeps the last URL AppSketch was opened with in a static;
   * expo-router in the guest would route to it (e.g. AppSketch's own /scan).
   * AppSketch has already handled it. expo-linking belongs to the app, so it
   * is reached at runtime.
   */
  private fun clearHostLinkingURL() {
    try {
      val companion = Class.forName("expo.modules.linking.ExpoLinkingModule\$Companion")
      val instance = Class.forName("expo.modules.linking.ExpoLinkingModule").getField("Companion").get(null)
      companion.getMethod("setInitialURL", android.net.Uri::class.java).invoke(instance, null)
    } catch (_: ReflectiveOperationException) {
      // expo-linking not installed: nothing to clear.
    }
  }

  private fun packageList(app: Application): List<ReactPackage> {
    // PackageList is generated into the app module by autolinking, so this
    // library can only reach it at runtime.
    val cls = Class.forName("com.facebook.react.PackageList")
    val list = cls.getConstructor(Application::class.java).newInstance(app)
    return cls.getMethod("getPackages").invoke(list) as List<ReactPackage>
  }

  @OptIn(UnstableReactNativeAPI::class)
  private fun createHost(app: Application, guest: Guest): ReactHost {
    val packages = packageList(app)
    val delegate = object : ReactHostDelegate {
      override val jsMainModulePath: String = "index"
      override val bindingsInstaller: BindingsInstaller? = null
      override val reactPackages: List<ReactPackage> = packages
      override val jsRuntimeFactory: JSRuntimeFactory
        get() = HermesInstance()
      // Read on every (re)load, so Reload fetches the latest bundle.
      override val jsBundleLoader: JSBundleLoader
        get() = DownloadingBundleLoader(app, guest.bundleUrl)
      override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder =
        DefaultTurboModuleManagerDelegate.Builder()

      override fun handleInstanceException(error: Exception) {
        main.post { onError?.invoke(error) }
      }
    }

    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)

    return ReactHostImpl(
      app,
      delegate,
      componentFactory,
      allowPackagerServerAccess = false,
      useDevSupport = false
    )
  }

  /**
   * Downloads the bundle to the cache, then loads it under its http URL. If
   * the download fails but an earlier copy exists, that copy runs instead.
   */
  private class DownloadingBundleLoader(
    private val context: Context,
    private val url: String
  ) : JSBundleLoader() {
    override fun loadScript(delegate: JSBundleLoaderDelegate): String {
      val dir = File(context.cacheDir, "appsketch-guest").apply { mkdirs() }
      val file = File(dir, "${Integer.toHexString(url.hashCode())}.js")
      val partial = File(dir, "${file.name}.part")
      try {
        val request = Request.Builder().url(url).header("expo-platform", "android").build()
        http.newCall(request).execute().use { res ->
          if (!res.isSuccessful) throw IOException("The app's code could not be downloaded (HTTP ${res.code}).")
          val body = res.body ?: throw IOException("The app server sent an empty bundle.")
          partial.outputStream().use { out -> body.byteStream().copyTo(out) }
        }
        if (!partial.renameTo(file)) throw IOException("Could not save the app's code.")
      } catch (e: IOException) {
        partial.delete()
        if (!file.exists()) throw e
      }
      delegate.loadScriptFromFile(file.absolutePath, url, false)
      return url
    }
  }
}
