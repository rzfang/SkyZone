#!/usr/bin/node

'use strict';

var fs = require('fs'),
    sass = require('node-sass'),
    uglifyjs = require('uglify-js'),
    RtPth = __dirname + '/../';

SCSS_CSS(RtPth + 'SRC/base.scss', RtPth + 'WEB/www/resource/base.css');
SCSS_CSS(RtPth + 'SRC/style1.scss', RtPth + 'WEB/www/resource/style1.css');
SCSS_CSS(RtPth + 'SRC/style2.scss', RtPth + 'WEB/www/resource/style2.css');
JsCompress([RtPth + 'SRC/api.js'], RtPth + 'WEB/www/resource/api.min.js');
JsCompress([RtPth + 'SRC/include.js'], RtPth + 'WEB/www/resource/include.min.js');
JsCompress([RtPth + 'SRC/include.js', RtPth + 'SRC/api.js'], RtPth + 'WEB/www/resource/api2.min.js');

return 0;

function SCSS_CSS (FrmPth, ToPth)
{
  var Src = fs.readFileSync(FrmPth, 'utf8'), // 'Src' = Source.
      CSS = sass.renderSync({'data': Src}).css.toString().replace(/\n +/g, ' ').replace(/\n\n/g, "\n");
      
  fs.writeFileSync(ToPth, CSS);
}

function JsCompress (FrmPthA, ToPth)
{
  var Js = uglifyjs.minify(FrmPthA, {'mangle': true}).code;

  fs.writeFileSync(ToPth, Js);
}