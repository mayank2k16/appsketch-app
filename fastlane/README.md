fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build release IPA and upload to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Build, upload to TestFlight, upload screenshots, and submit for App Store Review

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload screenshots to App Store Connect (no build)

### ios profile

```sh
[bundle exec] fastlane ios profile
```

Download / refresh provisioning profile

----


## Android

### android beta

```sh
[bundle exec] fastlane android beta
```

Build release AAB and upload to Play Store internal track

### android apk

```sh
[bundle exec] fastlane android apk
```

Build a signed Release APK (for direct distribution / staging)

### android release

```sh
[bundle exec] fastlane android release
```

Promote Play Store internal track to production

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
