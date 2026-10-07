// Xcode 27 rejects pod targets below iOS 15.0, and some pods still ship 12.4/13.4.
// This raises every pod target to the app's deployment target in the generated Podfile.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# unistats: raise pod deployment targets';

module.exports = (config) =>
    withDangerousMod(config, [
        'ios',
        (cfg) => {
            const file = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
            let podfile = fs.readFileSync(file, 'utf8');
            if (!podfile.includes(MARKER)) {
                podfile = podfile.replace(
                    /(react_native_post_install\([\s\S]*?\n\s*\))/,
                    `$1

    ${MARKER}
    min_target = podfile_properties['ios.deploymentTarget'] || '15.1'
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || Gem::Version.new(current) < Gem::Version.new(min_target)
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_target
        end
      end
    end`,
                );
                fs.writeFileSync(file, podfile);
            }
            return cfg;
        },
    ]);
