module.exports = {
    pages: {
        override: {
            template: 'public/browser-extension.html',
            entry: './src/override/main.js',
            title: "alw-AY's New Tab"
        }
    },
    css: {
        loaderOptions: {
            sass: {
                implementation: require('sass'), // This line must in sass option
            },
            scss: {
                prependData: `@import "~@/css/variables.scss";`
            }
        }
    },
    pluginOptions: {
        browserExtension: {
            componentOptions: {
                background: {
                    entry: 'src/background.js'
                },
                contentScripts: {
                    entries: {
                        'content-script': [
                            'src/content-scripts/content-script.js'
                        ]
                    }
                }
            }
        }
    }
}
