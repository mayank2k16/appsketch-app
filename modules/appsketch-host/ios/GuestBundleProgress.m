#import <Foundation/Foundation.h>
#import <Expo/ExpoReactNativeFactory.h>
#import <React/RCTJavaScriptLoader.h>

/// RCTHost asks its delegate to load the bundle when the delegate implements
/// this selector, and otherwise calls RCTJavaScriptLoader itself, dropping the
/// progress on the floor in release builds (no dev loading view). Every
/// runtime's delegate is an EXReactNativeFactory, so this category gives each
/// one the stock loader and forwards its progress, for http bundles only (the
/// guest's), as an "AppSketchGuestBundleProgress" notification. Metro's
/// multipart response reports the build ("Bundling", done/total modules) and
/// then the download ("Downloading", done/total bytes).
@implementation EXReactNativeFactory (AppSketchGuestProgress)

- (void)loadBundleAtURL:(NSURL *)sourceURL
             onProgress:(RCTSourceLoadProgressBlock)onProgress
             onComplete:(RCTSourceLoadBlock)loadCallback
{
  BOOL remote = [sourceURL.scheme hasPrefix:@"http"];
  NSString *url = sourceURL.absoluteString ?: @"";
  [RCTJavaScriptLoader loadBundleAtURL:sourceURL
      onProgress:^(RCTLoadingProgress *progress) {
        if (onProgress) {
          onProgress(progress);
        }
        if (!remote) {
          return;
        }
        NSDictionary *info = @{
          @"url" : url,
          @"status" : progress.status ?: @"",
          @"done" : progress.done ?: @0,
          @"total" : progress.total ?: @0,
        };
        dispatch_async(dispatch_get_main_queue(), ^{
          [[NSNotificationCenter defaultCenter] postNotificationName:@"AppSketchGuestBundleProgress"
                                                              object:nil
                                                            userInfo:info];
        });
      }
      onComplete:loadCallback];
}

@end
