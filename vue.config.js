const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
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
                additionalData: `@import "~@/css/variables.scss";`
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
    },
    configureWebpack: {
        optimization: {
            splitChunks: {
                cacheGroups: {
                    background: {
                        name: 'background',
                        test: /[\\/]src[\\/]background\.js$/,
                        chunks: 'all',
                        enforce: true
                    }
                }
            }
        }
    },
    chainWebpack: config => {
        // 为 background script 设置特殊配置
        config.entry('background')
            .add('./src/background.js')
            .end();
        
        // 设置 background script 的输出
        config.output
            .filename('js/[name].js')
            .chunkFilename('js/[name].js');
        
        // 为 background script 禁用代码分割
        config.optimization.splitChunks({
            cacheGroups: {
                background: {
                    name: 'background',
                    test: /[\\/]src[\\/]background\.js$/,
                    chunks: 'all',
                    enforce: true,
                    priority: 10
                }
            }
        });
    }
})
