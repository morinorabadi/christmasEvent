const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')

let version;
require('fs').readFile(path.resolve(__dirname, '../../version.txt'),"utf8",(err,data) => {version = data})

module.exports = {
    entry : "./src/index.js",
    output : {
        filename : ()=> { return `main${version}.js` },
        path : path.resolve(__dirname, '../../dist'),
    },
    plugins:[
        new MiniCssExtractPlugin({ filename : 'styles.css' }),
        new HtmlWebpackPlugin({ template : './src/index.html' })
    ],
    module : {
        rules : [
            {
                test : /\.js/,
                exclude : /node_modules/,
                use : {
                    loader : 'babel-loader',
                    options : {
                        presets : [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ]
                    }
                }
            },
            {
                test : /\.sass$/,
                use : [MiniCssExtractPlugin.loader,"css-loader","sass-loader"]
            }
        ]
    }
}