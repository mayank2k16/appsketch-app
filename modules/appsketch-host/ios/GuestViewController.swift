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
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground
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

  /// The bundle downloads and runs before anything paints; until the guest's
  /// first frame, say so instead of showing a blank screen.
  private func showLoading() {
    loadingView?.removeFromSuperview()
    let panel = UIView(frame: view.bounds)
    panel.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    panel.backgroundColor = .systemBackground

    let spinner = UIActivityIndicatorView(style: .large)
    spinner.startAnimating()
    let label = UILabel()
    label.text = "Starting \(appTitle)…"
    label.font = .boldSystemFont(ofSize: 17)
    label.textAlignment = .center
    let hint = UILabel()
    hint.text = "Downloading the latest version of your app"
    hint.font = .systemFont(ofSize: 13)
    hint.textColor = .secondaryLabel
    hint.textAlignment = .center

    let stack = UIStackView(arrangedSubviews: [spinner, label, hint])
    stack.axis = .vertical
    stack.spacing = 12
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

  private func hideLoading() {
    guard let panel = loadingView else { return }
    loadingView = nil
    UIView.animate(withDuration: 0.2, animations: { panel.alpha = 0 }) { _ in panel.removeFromSuperview() }
  }

  func showError(_ message: String) {
    guard errorView == nil else { return }
    loadingView?.removeFromSuperview()
    loadingView = nil
    let panel = UIView(frame: view.bounds)
    panel.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    panel.backgroundColor = .systemBackground

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
