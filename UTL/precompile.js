#!/usr/bin/node

'use strict';

var fs = require('fs'),
    sass = require('node-sass'),
    uglifyjs = require('uglify-js'),
    RtPth = __dirname + '/../', // 'RtPth' = Root Path.
    SrcPth = RtPth + 'SRC/', // 'SrcPth' = Source Path.
    RscPth = RtPth + 'WEB/www/resource/'; // 'RscPth' = Resouce Path.

SCSS_CSS(SrcPth + 'base.scss', RscPth + 'base.css');
SCSS_CSS(SrcPth + 'style1.scss', RscPth + 'style1.css');
SCSS_CSS(SrcPth + 'style2.scss', RscPth + 'style2.css');
JsCompress([SrcPth + 'api.js'], RscPth + 'api.min.js');
JsCompress([SrcPth + 'include.js'], RscPth + 'include.min.js');
JsCompress([SrcPth + 'include.js', SrcPth + 'api.js'], RscPth + 'api2.min.js');
JsCompress([SrcPth + 'RZ-Js-RiotMixin.js'], RscPth + 'api3.min.js');

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