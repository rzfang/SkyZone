#!/usr/bin/node

var fs = require('fs'),
    sass = require('node-sass'),
    uglifyjs = require('uglify-js'),
    RtPth = __dirname + '/../';

SCSS_CSS(RtPth + 'SRC/base.scss', RtPth + 'WEB/www/resource/base.css');
SCSS_CSS(RtPth + 'SRC/style1.scss', RtPth + 'WEB/www/resource/style1.css');
JsCompress(RtPth + 'SRC/api.js', RtPth + 'WEB/www/resource/api.min.js')
JsCompress(RtPth + 'SRC/include.js', RtPth + 'WEB/www/resource/include.min.js')

return 0;

function SCSS_CSS (FrmPth, ToPth)
{
  var Src = fs.readFileSync(FrmPth, 'utf8'), // 'Src' = Source.
      CSS = sass.renderSync({'data': Src}).css.replace(/\n +/g, ' ').replace(/\n\n/g, "\n");

  fs.writeFileSync(ToPth, CSS);
}

function JsCompress (FrmPth, ToPth)
{
    var Js = uglifyjs.minify(FrmPth, {'mangle': false}).code;



    fs.writeFileSync(ToPth, Js);
}