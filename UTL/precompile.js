#!/usr/bin/node

'use strict';

const fs = require('fs'),
      sass = require('node-sass');

const RtPth = __dirname + '/../', // 'RtPth' = Root Path.
      RscPth = RtPth + 'WEB/www/resource/', // 'RscPth' = Resouce Path.
      SrcPth = RtPth + 'SRC/'; // 'SrcPth' = Source Path.

SCSS_CSS(SrcPth + 'base.scss', RscPth + 'base.css');
SCSS_CSS(SrcPth + 'style1.scss', RscPth + 'style1.css');
SCSS_CSS(SrcPth + 'style2.scss', RscPth + 'style2.css');
JsCompress(
  [ SrcPth + 'include.js',
    SrcPth + 'wording.js',
    SrcPth + 'RZ-Js-Is.js',
    SrcPth + 'RZ-Js-ZFT.js' ],
  RscPth + 'api1.min.js');
JsCompress(
  [ SrcPth + 'include.js',
    SrcPth + 'wording.js',
    SrcPth + 'RZ-Js-Is.js',
    SrcPth + 'RZ-Js-RiotMixin.js',
    SrcPth + 'RZ-Js-ZFT.js' ],
  RscPth + 'api2.min.js');

return 0;

function SCSS_CSS (FrmPth, ToPth) {
  const Src = fs.readFileSync(FrmPth, 'utf8'), // 'Src' = Source.
        CSS = sass.renderSync({ data: Src }).css.toString()
        .replace(/\n +/g, ' ')
        .replace(/\n\n/g, '\n')
        .replace(/\}/g, '}\n')
        .replace(/\n /g, '\n')
        .replace(/ > /g, '>');

  fs.writeFileSync(ToPth, CSS);
}

function JsCompress (FrmPthA, ToPth) {
  let Js = '';

  for (let i = 0; i < FrmPthA.length; i++) {
    let PtJs = fs.readFileSync(FrmPthA[i], { encoding: 'utf8' })
      .replace(/\n +/g, '\n')
      .replace(/\n\/\/.+/g, '')
      .replace(/\n+/g, '\n')
      + '\n\n\n';

    Js += PtJs;
  }

  fs.writeFileSync(ToPth, Js);
}
