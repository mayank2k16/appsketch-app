import Expo
import React
import ReactAppDependencyProvider
import UIKit

/// Supplies the guest app's JS bundle URL. Reporting the remote URL as the
/// source makes `require('./image.png')` resolve against the app's server,
/// the same way Expo Go loads a project.
final class GuestFactoryDelegate: ExpoReactNativeFactoryDelegate {
  private let url: URL

  init(url: URL) {
    self.url = url
    super.init()
  }

  override func bundleURL() -> URL? { url }

  override func sourceURL(for bridge: RCTBridge) -> URL? { url }

  // AppSketch's own app-delegate subscribers (splash screen etc.) customise
  // AppSketch's root view; a guest only needs a plain background.
  override func customize(_ rootView: UIView) {
    rootView.backgroundColor = .systemBackground
  }
}

/// The one guest app that can be running at a time.
///
/// A guest gets its own React Native factory, hence its own RCTHost, Hermes
/// runtime and Expo AppContext, built from the same native modules as AppSketch.
final class GuestSession {
  struct Guest {
    let bundleUrl: URL
    let manifest: String
    let title: String
  }

  static let shared = GuestSession()

  private let lock = NSLock()
  private var _current: Guest?

  /// Read from module constant providers, which may run off the main thread.
  var current: Guest? {
    lock.lock(); defer { lock.unlock() }
    return _current
  }

  private var factory: ExpoReactNativeFactory?
  private var factoryDelegate: GuestFactoryDelegate?
  private weak var controller: GuestViewController?
  private var previousFatalHandler: RCTFatalHandler?
  private var previousFatalExceptionHandler: RCTFatalExceptionHandler?

  /// The guest's manifest if `bundleURL` belongs to the running guest.
  func manifest(forBundleURL bundleURL: URL?) -> String? {
    guard let guest = current, let bundleURL else { return nil }
    return bundleURL == guest.bundleUrl ? guest.manifest : nil
  }

  @MainActor
  func open(_ guest: Guest, from presenter: UIViewController) {
    close(animated: false)
    lock.lock(); _current = guest; lock.unlock()
    installFatalHandlers()
    // expo-linking keeps the last URL AppSketch was opened with in a
    // process-wide registry; expo-router in the guest would route to it
    // (e.g. AppSketch's own /scan). AppSketch has already handled it.
    NotificationCenter.default.post(name: Notification.Name("ExpoLinkingClearInitialURL"), object: nil)

    let controller = GuestViewController(title: guest.title)
    controller.modalPresentationStyle = .fullScreen
    controller.onClose = { [weak self] in self?.close(animated: true) }
    controller.onReload = { [weak self] in self?.reload() }
    self.controller = controller
    controller.show(rootView: makeRootView(for: guest))
    presenter.present(controller, animated: true)
  }

  /// Rebuilds the guest from scratch, re-downloading its bundle.
  @MainActor
  func reload() {
    guard let guest = current, let controller else { return }
    controller.show(rootView: makeRootView(for: guest))
  }

  @MainActor
  func close(animated: Bool) {
    if let controller, controller.presentingViewController != nil {
      controller.dismiss(animated: animated)
    }
    controller = nil
    factory = nil
    factoryDelegate = nil
    lock.lock(); _current = nil; lock.unlock()
    restoreFatalHandlers()
  }

  @MainActor
  private func makeRootView(for guest: Guest) -> UIView {
    let delegate = GuestFactoryDelegate(url: guest.bundleUrl)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    // Drop the previous runtime only after the new one exists.
    self.factoryDelegate = delegate
    self.factory = factory
    return factory.rootViewFactory.view(withModuleName: "main", initialProperties: nil, launchOptions: nil)
  }

  // A release build turns a JS error into RCTFatal, which would crash AppSketch
  // along with the guest. While a guest runs, fatals show the guest's error
  // screen instead.
  private func installFatalHandlers() {
    previousFatalHandler = RCTGetFatalHandler()
    previousFatalExceptionHandler = RCTGetFatalExceptionHandler()
    RCTSetFatalHandler { [weak self] error in
      let message = (error as NSError?)?.localizedDescription ?? "Unknown error"
      DispatchQueue.main.async { self?.controller?.showError(message) }
    }
    RCTSetFatalExceptionHandler { [weak self] exception in
      let message = exception?.reason ?? exception?.name.rawValue ?? "Unknown error"
      DispatchQueue.main.async { self?.controller?.showError(message) }
    }
  }

  private func restoreFatalHandlers() {
    RCTSetFatalHandler(previousFatalHandler)
    RCTSetFatalExceptionHandler(previousFatalExceptionHandler)
    previousFatalHandler = nil
    previousFatalExceptionHandler = nil
  }
}
