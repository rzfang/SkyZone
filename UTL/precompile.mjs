#!/usr/bin/node

import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RtPth = __dirname + '/../'; // 'RtPth' = Root Path.

const RscPth = RtPth + 'WEB/www/resource/', // 'RscPth' = Resouce Path.
      SrcPth = RtPth + 'SRC/'; // 'SrcPth' = Source Path.

async function SCSS_CSS (FrmPth, ToPth) {
  const { css } = await sass.compileAsync(FrmPth);

  fs.writeFileSync(ToPth, css);
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

SCSS_CSS(SrcPth + 'style1.scss', RscPth + 'style1.css');
SCSS_CSS(SrcPth + 'style2.scss', RscPth + 'style2.css');
JsCompress(
  [ SrcPth + 'include.js',
    SrcPth + 'wording.js',
    SrcPth + 'RZ-Js-ZFT.js' ],
  RscPth + 'api1.min.js');
JsCompress(
  [ SrcPth + 'include.js',
    SrcPth + 'wording.js',
    SrcPth + 'RZ-Js-ZFT.js' ],
  RscPth + 'api2.min.js');
