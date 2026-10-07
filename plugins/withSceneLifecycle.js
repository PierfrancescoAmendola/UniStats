// iOS 27 terminates apps linked against its SDK that do not adopt the UIScene lifecycle.
// Expo SDK 54 still creates the window in AppDelegate, so this plugin:
//  - declares a scene manifest in Info.plist,
//  - moves window creation into a SceneDelegate (appended to AppDelegate.swift, so the
//    Xcode project needs no new file),
//  - forwards deep links received by the scene to React Native.
const { withDangerousMod, withInfoPlist } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '// unistats: scene lifecycle';

const SCENE_DELEGATE = `

${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }
    let window = UIWindow(windowScene: windowScene)
    factory.startReactNative(withModuleName: "main", in: window, launchOptions: nil)
    self.window = window
    appDelegate.window = window
    if let url = connectionOptions.urlContexts.first?.url {
      RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
      RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
    }
  }
}
`;

const withSceneDelegate = (config) =>
    withDangerousMod(config, [
        'ios',
        (cfg) => {
            const dir = path.join(cfg.modRequest.platformProjectRoot, cfg.modRequest.projectName);
            const file = path.join(dir, 'AppDelegate.swift');
            let src = fs.readFileSync(file, 'utf8');
            if (!src.includes(MARKER)) {
                // The scene creates the window now; the app delegate only prepares the factory.
                src = src.replace(/#if os\(iOS\) \|\| os\(tvOS\)\s*\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)[\s\S]*?#endif\n/, '');
                src += SCENE_DELEGATE;
                fs.writeFileSync(file, src);
            }
            return cfg;
        },
    ]);

const withSceneManifest = (config) =>
    withInfoPlist(config, (cfg) => {
        cfg.modResults.UIApplicationSceneManifest = {
            UIApplicationSupportsMultipleScenes: false,
            UISceneConfigurations: {
                UIWindowSceneSessionRoleApplication: [
                    {
                        UISceneConfigurationName: 'Default Configuration',
                        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
                    },
                ],
            },
        };
        return cfg;
    });

module.exports = (config) => withSceneManifest(withSceneDelegate(config));
