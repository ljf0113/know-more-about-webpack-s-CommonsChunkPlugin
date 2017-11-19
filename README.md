# 知多一点 webpack 的 CommonsChunkPlugin

hello ~ 亲爱的看官老爷们大家好 ~ 最近一直在学习 `webpack` 的相关知识。曾几何时我总觉得 `webpack` 的体系庞大而难以掌握，一直回避不愿去学。然而伟人鲁迅曾说过： ~~世上太多事会因无法掌握而使你狂躁不安，最好的解决方法就是硬着头皮开始做！~~ 因而就从比较简单的 `CommonsChunkPlugin` 开始学起吧~ 

虽然本文比较简单，但还是需要一点 `webpack` 知识的，如若完全没接触过 `webpack` ，建议先移步 [官方文档](http://www.css88.com/doc/webpack/) 与 [Webpack 3，从入门到放弃](https://segmentfault.com/a/1190000010871559) 了解一下 `webpack` 基础为佳~


## 基础配置

> `CommonsChunkPlugin` 插件，是一个可选的用于建立一个独立文件(又称作 chunk)的功能，这个文件包括多个入口 chunk 的公共模块。通过将公共模块拆出来，最终合成的文件能够在最开始的时候加载一次，便存起来到缓存中供后续使用。这个带来速度上的提升，因为浏览器会迅速将公共的代码从缓存中取出来，而不是每次访问一个新页面时，再去加载一个更大的文件。

简单来说，这有点像封装函数。把不变的与变化的分开，使得不变的可以高效复用，变化的灵活配置。接下来会根据这个原则优化我们的项目，现在先看看虚拟的项目长成什么样吧~

新建一个 `index.html` 模板与入口 `index.js`文件，简单配置如下：

`index.html` ： 
    
    <!doctype html>
    <html lang="en">
    <head>
    	<meta charset="UTF-8">
    	<meta name="viewport"
    	      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    	<meta http-equiv="X-UA-Compatible" content="ie=edge">
    	<title>Document</title>
    </head>
    <body>
    	<div id="app">
    		<p>{{ vue_test }}</p>
    	</div>
    	<div class="jq_test"></div>
    </body>
    </html>
    
`index.js`:
    
    import Vue from 'vue';
    import $ from 'jquery';
    
    new Vue({
      el: '#app',
      data: {
        vue_test: 'vue is loaded!'
      }
    })
    
    $(function() {
      $('.jq_test').html('jquery is loaded!')
    })

为演示起见，代码十分简单，相信不用多加解释。接下来先简单配置一下 `webpack.config.js`,代码如下：
    
    const path = require('path');
    const webpack = require('webpack');
    const HtmlWebpackPlugin = require('html-webpack-plugin');
    const CleanWebpackPlugin = require('clean-webpack-plugin');
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    
    module.exports = {
      entry: {
        index: path.join(__dirname, 'index.js')
      },
      output: {
        path: path.join(__dirname, '/dist'),
        filename: 'js/[name].[chunkhash].js'
      },
      resolve: { alias: { 'vue': 'vue/dist/vue.js' } },
      plugins: [
        new CleanWebpackPlugin(['./dist']),
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: 'index.html',
          inject: true
        }),
        new BundleAnalyzerPlugin(),
      ]
    };

`CleanWebpackPlugin` 主要用于清除 `dist` 目录下的文件，这样每次打包就不必手动清除了。`HtmlWebpackPlugin` 则是为了在 `dist` 目录下新建 `html` 模板并自动插入依赖的 `js`。 `BundleAnalyzerPlugin` 主要是为了生成打包后的 `js` 文件包含的依赖，如此时进行打包，则生成：

![](https://user-gold-cdn.xitu.io/2017/11/19/15fd33852ccb8b67?w=620&h=312&f=jpeg&s=23931)

可以看到生成的 `index.js` 文件包含了 `vue` 与 `jquery`。

## 首次优化

一般而言，我们项目中的类库变化较少，业务代码倒是多变的。需要想办法把类库抽离出来，把业务代码单独打包。这样加伤 `hash` 后浏览器就能缓存类库的 `js` 文件，优化用户体验。此时我们的主角 `CommonsChunkPlugin` 就正式登场了。我们在 `webpack.config.js` 文件的 `plugins` 中添加 `CommonsChunkPlugin`，配置如下：

    plugins: [
        //...此前的代码
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: function(module) {
            return (
              module.resource &&
              /\.js$/.test(module.resource) &&
              module.resource.indexOf(
                path.join(__dirname, './node_modules')
              ) === 0
            )
          }
        }),
    ]

上述配置，是通过 `CommonsChunkPlugin` 生成一个名为 `vendor` 的 `js` 文件，它抽取入口文件也就是 `index.js` 中来源于 `node_modules` 的依赖组成。此例中就是 `vue` 与 `jquery`。打包出来画风是这样的：

![](https://user-gold-cdn.xitu.io/2017/11/19/15fd34b116d97d88?w=620&h=306&f=jpeg&s=23071)

此时看上去解决了我们的问题，将依赖的类库抽取抽来独立打包，加上缓存就能被浏览器缓存了。然而事情没那么简单，不行你随意改一下入口的  `index.js` 代码，再次打包：
    
![](https://user-gold-cdn.xitu.io/2017/11/19/15fd34b971c42392?w=620&h=306&f=jpeg&s=23471)

 绝望地发现 `vendor.js` 文件的 `hash` 改变了。简单说，这是因为模块标识产生了变化所导致的，更具体的原因可以查看[相关的中文文档](http://www.css88.com/doc/webpack/concepts/manifest/)~修正的方法其实也挺简单，就是再使用 `CommonsChunkPlugin` 抽取一次模块，将不变的类库沉淀下来，将变化的抽离出去。因而添如下代码：
 
    plugins: [
        //...此前的代码
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: function(module) {
            return (
              module.resource &&
              /\.js$/.test(module.resource) &&
              module.resource.indexOf(
                path.join(__dirname, './node_modules')
              ) === 0
            )
          }
        }),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'manifest',
          chunks: ['vendor', 'index']
        })
    ]

打包后， `dist/js` 目录下多出一个名为 `manifest` 的 `js` 文件，此时你无论如何改变 `index.js` 的代码，打包后的 `vendor.js` 的 `hash` 都不再会改变了。

然而稍等，当你想拍拍手收工的时候，思考一下这样的场景：随着项目不断迭代，`vendor` 中的依赖不断被添加与删除，使得它的 `hash` 会不断变化，这显然不符合我们的利益，这到底如何解决呢？

## 再次优化

既然 `CommonsChunkPlugin` 是可以按照我们的需求抽取模块，而依赖的外部模块可能是不断变化的，那么为何不将基础的依赖模块抽取出来作为一个文件，其他的依赖如插件等作为另一个文件呢？

简单说，如我们的项目中 `vue` 是基本的依赖，必须用到它，而 `jquery` 等则是后加的类库，之后可能变更。那么将 `vue` 独立打包一个文件，有利于浏览器缓存，因为无论此后添加更多的类库或删去 `jquery` 时， `vue` 文件的缓存依然是生效的。因而我们可以这么做，首先新建一个入口：
    
    entry: {
        index: path.join(__dirname, 'index.js'),
        vendor: ['vue'],
    },

此处主要是用于指明需要独立打包的依赖有哪些。之后在 `plugins` 中做如下修改：
    
    plugins: [
        //...此前的代码
        new webpack.HashedModuleIdsPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: Infinity,
        }),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'common',
          minChunks: function(module) {
            return (
              module.resource &&
              /\.js$/.test(module.resource) &&
              module.resource.indexOf(
                path.join(__dirname, './node_modules')
              ) === 0
            )
          },
          chunks: ['index'],
        }),
        new webpack.optimize.CommonsChunkPlugin({
          name: 'manifest',
          chunks: ['vendor', 'common', 'index']
        })
    ]

插件 `HashedModuleIdsPlugin`，是用于保持模块引用的 `module id` 不变。而 `CommonsChunkPlugin` 则提取入口指定的依赖独立打包，`minChunks: Infinity,`的用意是让插件别管其他，就按照设置的数组提取文件就好。之后修改一下原来的 `vendor`，重命名为 `common`，指定它从入口 `index.js` 中抽取来自 `node_modules` 的依赖。最后就是抽取 `webpack` 运行时的函数及其模块标识组成 `manifest`。运行一下 `webpack`，构建出来如图：

![](https://user-gold-cdn.xitu.io/2017/11/19/15fd3c47094e5d54?w=620&h=305&f=jpeg&s=30395)

可以看到 `vue` 与 `jquery` 被分开打包成了两个文件，我们尝试添加一下新的依赖 `vuex`,打包后结果如下：
    
![](https://user-gold-cdn.xitu.io/2017/11/19/15fd3c36d7581ecb?w=620&h=304&f=jpeg&s=30928)

如此一来，我们的优化目的就达到了，不变的都提取出来，变化的可以动态配置~

## 小结

`webpack` 插件 `CommonsChunkPlugin` 就介绍到这里了，然而优化还是有很多的，比如开启压缩，去除注释等。而当项目体积逐渐增大时，`CommonsChunkPlugin` 就不一定是提取代码的最优解了。在打包速度与控制构建的精细程度来说，是不如 `DLLPlugin` 的，根据不同的场景使用不用的插件以达到我们的目的，本来就是 `webpack` 的魅力之一。

感谢各位看官大人看到这里，知易行难，希望本文对你有所帮助，所有的代码均会被上传到 [github](https://github.com/ljf0113/know-more-about-webpack-s-CommonsChunkPlugin) 上，滚求 `star` ~谢谢！
