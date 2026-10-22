import UIKit

/// Full-screen home of the running guest app. A small draggable bubble floats
/// over it (Reload / Back to AppSketch): a release build has no shake menu.
final class GuestViewController: UIViewController {
  var onClose: (() -> Void)?
  var onReload: (() -> Void)?

  private let appTitle: String
  private var rootView: UIView?
  private var errorView: UIView?
  private var loadingView: UIView?
  private var appearObserver: NSObjectProtocol?
  private let bubble = UIButton(type: .custom)

  init(title: String) {
    self.appTitle = title
    super.init(nibName: nil, bundle: nil)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

  deinit {
    if let appearObserver { NotificationCenter.default.removeObserver(appearObserver) }
    if let progressObserver { NotificationCenter.default.removeObserver(progressObserver) }
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = Self.canvas
    setUpBubble()
  }

  func show(rootView newRoot: UIView) {
    loadViewIfNeeded()
    errorView?.removeFromSuperview()
    errorView = nil
    rootView?.removeFromSuperview()
    newRoot.frame = view.bounds
    newRoot.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.insertSubview(newRoot, at: 0)
    rootView = newRoot
    showLoading()
  }

  /// The bundle builds, downloads and runs before anything paints; until the
  /// guest's first frame, show how far along it is: a thin bar with a
  /// percentage, fed by GuestBundleProgress.m (Metro's build progress, then
  /// the download's bytes). White canvas by default, black in dark mode.
  private let progressTrack = UIView()
  private let progressFill = UIView()
  private let percentLabel = UILabel()
  private let stageLabel = UILabel()
  private var progressObserver: NSObjectProtocol?
  private var fillWidth: NSLayoutConstraint?
  private var shown: CGFloat = 0
  private var sawBuild = false

  private static let canvas = UIColor { $0.userInterfaceStyle == .dark
    ? .black : UIColor(red: 0.98, green: 0.98, blue: 0.973, alpha: 1) }
  private static let ink = UIColor { $0.userInterfaceStyle == .dark
    ? .white : UIColor(red: 0.043, green: 0.043, blue: 0.047, alpha: 1) }
  private static let inset = UIColor { $0.userInterfaceStyle == .dark
    ? UIColor(white: 1, alpha: 0.12) : UIColor(red: 0.957, green: 0.957, blue: 0.949, alpha: 1) }
  private static let orange = UIColor(red: 0.949, green: 0.376, blue: 0.047, alpha: 1)

  private func showLoading() {
    loadingView?.removeFromSuperview()
    shown = 0
    sawBuild = false
    let panel = UIView(frame: view.bounds)
    panel.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    panel.backgroundColor = Self.canvas

    let label = UILabel()
    label.text = "Starting \(appTitle)"
    label.font = .systemFont(ofSize: 20, weight: .bold)
    label.textColor = Self.ink
    label.textAlignment = .center

    percentLabel.text = "0%"
    percentLabel.font = .monospacedDigitSystemFont(ofSize: 40, weight: .heavy)
    percentLabel.textColor = Self.ink
    percentLabel.textAlignment = .center

    progressTrack.backgroundColor = Self.inset
    progressTrack.layer.cornerRadius = 3
    progressTrack.clipsToBounds = true
    progressTrack.translatesAutoresizingMaskIntoConstraints = false
    progressFill.backgroundColor = Self.orange
    progressFill.layer.cornerRadius = 3
    progressFill.translatesAutoresizingMaskIntoConstraints = false
    progressFill.removeFromSuperview()
    progressTrack.addSubview(progressFill)
    let width = progressFill.widthAnchor.constraint(equalToConstant: 0)
    fillWidth = width
    NSLayoutConstraint.activate([
      progressTrack.heightAnchor.constraint(equalToConstant: 6),
      progressTrack.widthAnchor.constraint(equalToConstant: 220),
      progressFill.leadingAnchor.constraint(equalTo: progressTrack.leadingAnchor),
      progressFill.topAnchor.constraint(equalTo: progressTrack.topAnchor),
      progressFill.bottomAnchor.constraint(equalTo: progressTrack.bottomAnchor),
      width,
    ])

    stageLabel.text = "Connecting to your app…"
    stageLabel.font = .systemFont(ofSize: 13)
    stageLabel.textColor = .secondaryLabel
    stageLabel.textAlignment = .center

    let stack = UIStackView(arrangedSubviews: [label, percentLabel, progressTrack, stageLabel])
    stack.axis = .vertical
    stack.spacing = 14
    stack.setCustomSpacing(6, after: label)
    stack.alignment = .center
    stack.translatesAutoresizingMaskIntoConstraints = false
    panel.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.centerYAnchor.constraint(equalTo: panel.centerYAnchor),
      stack.leadingAnchor.constraint(equalTo: panel.leadingAnchor, constant: 24),
      stack.trailingAnchor.constraint(equalTo: panel.trailingAnchor, constant: -24),
    ])
    view.insertSubview(panel, belowSubview: bubble)
    loadingView = panel

    if progressObserver == nil {
      progressObserver = NotificationCenter.default.addObserver(
        forName: NSNotification.Name(rawValue: "AppSketchGuestBundleProgress"), object: nil, queue: .main
      ) { [weak self] note in self?.onBundleProgress(note.userInfo ?? [:]) }
    }
    if appearObserver == nil {
      appearObserver = NotificationCenter.default.addObserver(
        forName: NSNotification.Name(rawValue: "RCTContentDidAppearNotification"), object: nil, queue: .main
      ) { [weak self] note in
        guard let self, let root = self.rootView,
              let source = note.object as? UIView, source.isDescendant(of: root) else { return }
        self.hideLoading()
      }
    }
  }

  /// Build progress fills the first half (when Metro has to build), the
  /// download the rest; with a cached build the download is the whole bar.
  /// Never goes backwards, and holds at 99% until the first frame.
  private func onBundleProgress(_ info: [AnyHashable: Any]) {
    guard loadingView != nil else { return }
    let status = info["status"] as? String ?? ""
    let done = (info["done"] as? NSNumber)?.doubleValue ?? 0
    let total = (info["total"] as? NSNumber)?.doubleValue ?? 0
    let ratio = total > 0 ? min(max(done / total, 0), 1) : 0
    let downloading = status == "Downloading"
    var value: CGFloat
    if downloading {
      value = sawBuild ? 0.5 + 0.49 * ratio : 0.99 * ratio
      stageLabel.text = total > 0
        ? String(format: "Downloading %.1f of %.1f MB", done / 1_048_576, total / 1_048_576)
        : "Downloading your app…"
    } else {
      sawBuild = true
      value = 0.5 * ratio
      stageLabel.text = total > 0 ? "Building your app…" : (status.isEmpty ? "Building your app…" : status)
    }
    if ratio >= 1 && downloading { stageLabel.text = "Opening…" }
    setProgress(value)
  }

  private func setProgress(_ value: CGFloat) {
    guard value > shown else { return }
    shown = min(value, 0.99)
    percentLabel.text = "\(Int((shown * 100).rounded()))%"
    fillWidth?.constant = 220 * shown
    UIView.animate(withDuration: 0.18, delay: 0, options: [.curveEaseOut, .beginFromCurrentState]) {
      self.progressTrack.layoutIfNeeded()
    }
  }

  private func hideLoading() {
    guard let panel = loadingView else { return }
    loadingView = nil
    percentLabel.text = "100%"
    fillWidth?.constant = 220
    UIView.animate(withDuration: 0.15, animations: { self.progressTrack.layoutIfNeeded() }) { _ in
      UIView.animate(withDuration: 0.22, animations: { panel.alpha = 0 }) { _ in panel.removeFromSuperview() }
    }
  }

  func showError(_ message: String) {
    guard errorView == nil else { return }
    loadingView?.removeFromSuperview()
    loadingView = nil
    let panel = UIView(frame: view.bounds)
    panel.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    panel.backgroundColor = Self.canvas

    let title = UILabel()
    title.text = "This app couldn't start"
    title.font = .boldSystemFont(ofSize: 20)
    title.textAlignment = .center

    let body = UILabel()
    body.text = message
    body.font = .systemFont(ofSize: 14)
    body.textColor = .secondaryLabel
    body.numberOfLines = 8
    body.textAlignment = .center

    let retry = UIButton(type: .system)
    retry.setTitle("Try again", for: .normal)
    retry.titleLabel?.font = .boldSystemFont(ofSize: 16)
    retry.addAction(UIAction { [weak self] _ in self?.onReload?() }, for: .touchUpInside)

    let back = UIButton(type: .system)
    back.setTitle("Back to AppSketch", for: .normal)
    back.addAction(UIAction { [weak self] _ in self?.onClose?() }, for: .touchUpInside)

    let stack = UIStackView(arrangedSubviews: [title, body, retry, back])
    stack.axis = .vertical
    stack.spacing = 14
    stack.alignment = .center
    stack.translatesAutoresizingMaskIntoConstraints = false
    panel.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.centerYAnchor.constraint(equalTo: panel.centerYAnchor),
      stack.leadingAnchor.constraint(equalTo: panel.leadingAnchor, constant: 24),
      stack.trailingAnchor.constraint(equalTo: panel.trailingAnchor, constant: -24),
    ])
    view.insertSubview(panel, belowSubview: bubble)
    errorView = panel
  }

  private func setUpBubble() {
    let size: CGFloat = 46
    bubble.setTitle("AS", for: .normal)
    bubble.titleLabel?.font = .boldSystemFont(ofSize: 13)
    bubble.setTitleColor(.white, for: .normal)
    bubble.backgroundColor = UIColor(white: 0.07, alpha: 0.92)
    bubble.layer.cornerRadius = size / 2
    bubble.layer.borderWidth = 1.5
    bubble.layer.borderColor = UIColor.white.cgColor
    bubble.layer.shadowColor = UIColor.black.cgColor
    bubble.layer.shadowOpacity = 0.25
    bubble.layer.shadowRadius = 6
    bubble.layer.shadowOffset = CGSize(width: 0, height: 3)
    bubble.accessibilityLabel = "AppSketch menu"
    bubble.frame = CGRect(x: view.bounds.width - size - 12, y: 120, width: size, height: size)
    bubble.autoresizingMask = [.flexibleLeftMargin, .flexibleBottomMargin]
    bubble.addAction(UIAction { [weak self] _ in self?.showMenu() }, for: .touchUpInside)
    bubble.addGestureRecognizer(UIPanGestureRecognizer(target: self, action: #selector(drag(_:))))
    view.addSubview(bubble)
  }

  @objc private func drag(_ pan: UIPanGestureRecognizer) {
    let t = pan.translation(in: view)
    var c = CGPoint(x: bubble.center.x + t.x, y: bubble.center.y + t.y)
    let half = bubble.bounds.width / 2
    c.x = min(max(c.x, half), view.bounds.width - half)
    c.y = min(max(c.y, view.safeAreaInsets.top + half), view.bounds.height - view.safeAreaInsets.bottom - half)
    bubble.center = c
    pan.setTranslation(.zero, in: view)
  }

  private func showMenu() {
    let sheet = UIAlertController(title: appTitle, message: nil, preferredStyle: .actionSheet)
    sheet.addAction(UIAlertAction(title: "Reload", style: .default) { [weak self] _ in self?.onReload?() })
    sheet.addAction(UIAlertAction(title: "Back to AppSketch", style: .destructive) { [weak self] _ in self?.onClose?() })
    sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel))
    sheet.popoverPresentationController?.sourceView = bubble
    present(sheet, animated: true)
  }
}
