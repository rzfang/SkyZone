'use strict';

//==== Library =========================================================================================================

//==== Z Check API =====================================================================================================

(function Z_Check_API () {
  let Is;

  Is = {
    Boolean: Obj => { return (typeof Obj === 'boolean'); },
    Number: Obj => { return (typeof Obj === 'number'); },
    String: Obj => { return (typeof Obj === 'string'); },
    Function: Obj => { return (typeof Obj === 'function'); },
    Object: Obj => { return (typeof Obj === 'object'); },
    Undefined: Obj => { return (typeof Obj === 'undefined'); },
    Array: Obj => { return (Obj instanceof Array); },
    Promise: Obj => {
      return (typeof Obj !== 'object' || !Obj.hasOwnProperty('then') || !Obj.hasOwnProperty('catch'))
    },
    EMail: Str => {
      if (typeof Str !== 'string') { return false; }

      return (/^[\w.]+@.{2,16}\.[0-9a-z]{2,3}$/).test(Str);
    },
    jQuery: Obj => { return (typeof jQuery !== 'undefined' && Obj instanceof jQuery); }
  };

  if (typeof exports !== 'undefined') { exports = Is; }
  else if (typeof window !== 'undefined') { window.Is = Is; }
})();

//==== Tool Function ===================================================================================================

/* count a String Length, chinese word count as 2 because of full-width.
  'Str' = String passing in.
  Return: string length.*/
function StringLength (Str) {
  if (typeof Str !== 'string') { return 0; }

  let C = 0,
      SL = Str.length;

  for (let i = 0; i < SL; i++) {
    let Chr = Str.charCodeAt(i);

    if (Chr < 32 || Chr > 126) { C++; }
  }

  return Str.length + C;
}

/* substr in full-width as 2 mode.
  'Str' = String.
  'Ofst' = Offset of substring.
  'Lmt' = Limit of substring.
  Return: fixed substring. */
function SubStrFx (Str, Ofst, Lmt) {
  if (typeof Str !== 'string') { Str = Str.toString(); }

  if (typeof Ofst !== 'number' || Ofst < 0) { Ofst = 0; }

  Str = Str.substr(Ofst);

  if (typeof Lmt !== 'number' || Lmt < 1) { Lmt = Str.length; }

  let Rst = '',
      C = 0;

  for (let i = 0; i < Lmt && C < Lmt; i++) {
    Rst += Str.charAt(i);

    let Chr = Str.charCodeAt(i);

    if (Chr < 32 || Chr > 126) { ++C; }

    ++C;
  }

  return Rst;
}

/* add a 'style' tag into 'head' tag of the HTML DOM tree to register some CSS rules.
  'CSSStr' = CSS String.
  'ID' = element 'style' ID. optional. give to skip if style exist.
  Return: 0 as OK, < 0 as error. */
function CSSAdd (CSSStr, ID) {
  if (typeof CSSStr !== 'string' || CSSStr.length === 0) { return -1; }

  if (typeof ID === 'string' && ID.length > 0) {
    if (document.getElementById(ID)) { return 1; }
  }
  else { ID = ''; }

  let Stl = document.createElement('style'), // 'Stl' = Style.
      TxtNd = document.createTextNode(CSSStr); // 'TxtNd' = CSS Text Node.

  if (ID.length > 0) { Stl.id = ID; }

  Stl.type = 'text/css';

  if (Stl.styleSheet) { Stl.styleSheet.cssText = TxtNd.nodeValue; } // for IE hack.
  else { Stl.appendChild(TxtNd); }

  document.getElementsByTagName('head')[0].appendChild(Stl);

  return 0;
}

/* Combine the seconde object into first object.
  'BsObj' = Base Object.
  'ExtObj' = Extend Object.
  'Md' = Mode, 0: Union mode in default, 1: Intersection mode.
  Return: new object after combined, or null as error. */
function ObjectCombine (BsObj, ExtObj, Md) {
  if (typeof BsObj !== 'object' || typeof ExtObj !== 'object') { return null; }

  if (typeof Md !== 'number') { Md = 0; }

  let RstObj = {};

  for (let i in BsObj) { RstObj[i] = BsObj[i]; }

  if (Md === 0) {
    for (let i in ExtObj) { RstObj[i] = ExtObj[i];}
  }
  else {
    for (let i in ExtObj) {
      if (typeof RstObj[i] === 'undefined') { continue; }

      RstObj[i] = ExtObj[i];
    }
  }

  return RstObj;
}

/* Pad Characters into a string.
  'Str' = String.
  'Lth' = Length. minimum length of string should be padding to.
  'Chr' = Character. optional, default '0';
  'Sd' = Side. optional, default 'l'. 'l'|'L': left padding, 'r'|'R': right padding.
  Return: string after handle. */
function CharPad (Str, Lth, Chr, Sd) {
  if (typeof Str !== 'string') { Str = Str.toString(); }

  if (typeof Lth !== 'number' || Lth < 2 || Str.length >= Lth) { return Str; }

  if (typeof Chr !== 'string' || Chr.length === 0) { Chr = '0'; }

  if (typeof Sd !== 'string') { Sd = 'l'; }
  else {
    Sd = Sd.toLowerCase();

    if (Sd !== 'l' && Sd !== 'r') { return Str; }
  }

  let PN = Lth - Str.length, // 'PN' = Padding Number.
      PS = ''; // 'PS' = Padding String.

  for (PS = ''; PS.length < PN; PS += Chr);

  if (Sd === 'l') { Str = PS + Str; }
  else { Str += PS; }

  return Str;
}

/* get a Data String by giving Second number.
  'Scd' = Second, float to include millisecond.
  'Fmt' = Format.
    0: YYYY-MM-DD HH:II:SS.CCC+ZZ. (default)
    1: YYYY-MM-DD HH:II:SS.CCC+ZZ (W).
    2: YYYYMMDDHHIISS.
  Return: datatime string.
  Need: CharPad(). */
function Second2Datetime (Scd, Fmt) {
  let Dt = new Date(Scd * 1000), // 'Dt' = Date.
      DtStr = '',
      TZOM = Dt.getTimezoneOffset(), // 'TZOM' = Time Zone Offset Minute.
      TZOH = TZOM / 60; // 'TZOH' = Time Zone Offset Hour.

  Scd = parseFloat(Scd);

  if (typeof Fmt !== 'number') { Fmt = 0; }

  Fmt = parseInt(Fmt, 10);
  TZOH = (TZOH > 0 ? '-' : '+') + CharPad(Math.abs(TZOH), 2);

  switch (Fmt) {
    case 1:
      Dt.setMinutes(Dt.getMinutes() - TZOM);

      DtStr = Dt.toJSON().substr(0, 19).replace('T', ' ');

      break;

    case 2:
      DtStr = '' + Dt.getFullYear() + CharPad((Dt.getMonth() + 1), 2) + CharPad(Dt.getDate(), 2) +
              CharPad(Dt.getHours(), 2) + CharPad(Dt.getMinutes(), 2) + CharPad(Dt.getSeconds(), 2);

      break;

    case 0:
    default:
      DtStr = Dt.getFullYear() + '-' + CharPad((Dt.getMonth() + 1), 2) + '-' + CharPad(Dt.getDate(), 2) + ' ' +
              CharPad(Dt.getHours(), 2) + ':' + CharPad(Dt.getMinutes(), 2) + ':' + CharPad(Dt.getSeconds(), 2) + '.' +
              CharPad(Dt.getMilliseconds(), 3) + TZOH;
  }

  return DtStr;
}

/*
  @ Date object, optional, default is now.
  < date time string with format: YYYY-MM-DD HH:II:SS. */
function DatetimeFormat (Dt) {
  if (!Dt) { return ''; }

  return Dt.getFullYear().toString() + '-' +
    (Dt.getMonth() + 1).toString().padStart(2, '0') + '-' +
    Dt.getDate().toString().padStart(2, '0') + ' ' +
    Dt.getHours().toString().padStart(2, '0') + ':' +
    Dt.getMinutes().toString().padStart(2, '0') + ':' +
    Dt.getSeconds().toString().padStart(2, '0');
}

/* parse bytes number to be normailize size string.
  'Byte' = file size, should be a number.
  Return: size string. */
function FileSizeNormalize (Byte) {
  if (typeof Byte !== 'number') { Byte = parseInt(Byte, 10); }

  if (isNaN(Byte) || Byte < 0) { return '???'; }

  let UntA = ['KB', 'MB', 'GB'];

  for (let i = UntA.length; i > 0; i--) {
    let Cmp = Math.pow(2, i * 10);

    if (Byte > Cmp) {
      Byte = Math.round(Byte / Cmp * 100) / 100;

      return Byte.toString() + ' ' + UntA[i - 1];
    }
  }

  return Byte + ' Bytes';
}

/* test if a string is a TimeStamp (YYYY-MM-DD HH:II:SS).
  'TmStr' = String.
  Return: true | false.
  Need: RECheck(). */
function IsTimeStamp (TmStr) {
  if (typeof TmStr !== 'string' || TmStr.length === 0) { return false; }

  return RECheck(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, TmStr);
}

/* Check if 'Str' is matched with rule 'Ptm' of Regular Expression.
  'Ptm' = Pettam, can be a RegExp Object, or a String.
  'Str' = String for testing.
  Return: true / false of rule match. */
function RECheck (Ptm, Str) {
  if ((typeof Ptm != 'function' && //for chrome, a RegExp is a function.
      typeof Ptm != 'object' && typeof Ptm != 'string') || typeof Str != 'string')
  { return false; }

  let RE = new RegExp(Ptm);

  // alert(RE.source);

  return RE.test(Str);
}

/* Set Cookie.
  'Nm' = Name.
  'V' = Value.
  'Exp' = Expires time in seconds. give negative number to remove target cookie.
  'Pth' = Path. optional.
  'Dmn' = Domain. optional.
  Return: 0 as OK, < 0 as error. */
function CookieSet (Nm, V, Exp, Pth, Dmn) {
  if (typeof Nm !== 'string' || typeof V === 'undefined' || V === null || typeof Exp !== 'number' || Exp === null)
  { return -1; }

  let Dt = new Date();

  Dt.setTime(Dt.getTime() + (Exp * 1000));

  let Str = Nm + '=' + encodeURIComponent(V) + ';expires=' + Dt.toUTCString() + ';';

  if (typeof Pth === 'string' && Pth.length > 0) { Str += 'path=' + Pth + ';'; }

  if (typeof Dmn === 'string' && Dmn.length > 5) { Str += 'domain=' + Dmn + ';'; }

  document.cookie = Str;

  return 0;
}

/* parse Cookie Parameters in a object.
  'Ky' = Key name of cookie. optional, give to return it only.
  Return: object. */
function CookieParam (Ky) {
  let CSA = document.cookie.split(';'), // 'CSA' = Cookie String Array.
      CO = {};

  for (let i in CSA) {
    let T;

    if (!CSA.hasOwnProperty(i)) { continue; }

    T = CSA[i].replace(/^\s+|\s+$/g, '').split('='); // trim each data.

    CO[T[0]] = decodeURIComponent(T[1]);
  }

  if (Ky && typeof Ky === 'string') {
    for (let i in CO) {
      if (!CO.hasOwnProperty(i)) { continue; }

      if (i === Ky) { return CO[i]; }
    }

    return null;
  }

  return CO;
}

/* turn to another page. give empty string to reload current page.
  'URL' = URL to go. optional, default ''. */
function PageTurn (URL) {
  if (typeof URL !== 'string') { return 0; }

  if (URL.length > 0) { window.location = URL; }
  else { window.location.reload(true); }
}

/* get the Window View Size.
  Return: [W, H]. */
function WindowViewSize () {
  let Sz = [0, 0];

  if (document.documentElement)
  { Sz = [document.documentElement.clientWidth, document.documentElement.clientHeight]; }
  else if (window.innerWidth && window.innerHeight)
  { Sz = [window.innerWidth, window.innerHeight]; }

  return Sz;
}

/* Get now Page Name without parent directories.
  Return: page name, maybe empty string as /, etc. */
function PageNameGet () {
  let PthA = window.location.pathname.split('/');

  return PthA[PthA.length - 1];
}

/* Deny web page embeded into another page by frame or iframe. */
function EmbedDeny () {
  if (top != self) { window.location.href = 'about:blank'; }
}

/* encode/decode HTML special chars.
  'Txt' = Text to parse.
  'Flg' = encode/decode Flag. true: encode | false: decode.
  Return: parsed string, or '' as error. */
function HTMLSpecialCharsEnDeCode (Txt, Flg) {
  if (typeof Txt !== 'string' || typeof Flg !== 'boolean') { return ''; }

  if (Flg) {
    return Txt.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
  else {
    return Txt.replace(/&amp;|&#0?38;/g, '&')
              .replace(/&lt;|&#0?60;/g, '<')
              .replace(/&gt;|&#0?62;/g, '>')
              .replace(/&quot;|&#0?34;/g, '"')
              .replace(/&#0?39;/g, '\'');
  }
}

/* transform traditional text to be HTML code for convenient render & read.
  'Txt' = Text string.
  Return: HTML string for render. */
function TextToHTML (Txt) {
  if (typeof Txt !== 'string' || Txt.length === 0) { return Txt; }

  Txt = Txt.replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>');

  return Txt;
}

/* make a random number in the range.
  'Min' = minimum number.
  'Max' = maximum number.
  'Dcm' = Decimal. optional, default 0. give -1 to keep original decimal.
  Return: random number in the range, or 0 as error. */
function RandomRange (Min, Max, Dcm) {
  if (typeof Min !== 'number' || typeof Max !== 'number') { return 0; }

  if (typeof Dcm !== 'number') { Dcm = 0; }

  if (Min > Max || Max < Min) {
    let T = Min;

    Min = Max;
    Max = T;
  }

  let Dst =  Max - Min, // 'Dst' = Distance.
      Nbr = Math.random() * Dst + Min;

  if (Dcm === 0) { Nbr = Math.floor(Nbr); }
  else if (Dcm > 0) {
    let Pow = Math.pow(10, Dcm);

    Nbr = Math.floor(Nbr * Pow) / Pow;
  }

  return Nbr;
}

function URLParameters () {
  let PrmStr = window.location.search, // 'PrmStr' = Parameters String.
      URLPrms = {};

  if (PrmStr.length > 0) {
    let TmpA0 = PrmStr.substr(1).split('&');

    for (let i = 0; i < TmpA0.length; i++ ) {
      let TmpA1 = TmpA0[i].split('=');

      URLPrms[TmpA1[0]] = (TmpA1.length < 2) ? true : TmpA1[1];
    }
  }

  return URLPrms;
}

//==== Independent Module, may need jQuery API. ========================================================================

/* set a Tab Box.
  'BxOS' = Box as a DOM Object, or a jQuery Selector, must be a container.
  'TbCSSS' = Tab CSS Selector.
  'PrmIdx' = Prime Index. optional, default 0.
  'TbSwF(OO, NO)' = Tab Switch Function. optional.
    'OO' = Old tab jQuery Object.
    'NO' = Now tab jQuery Object.
  'HshKy' = Hash Key string.
  Return: Tab Box jQuery object, or null as error.
  Need: CSSAdd function.
  Notice: tab name is decide by attribute data-tab-name, name or the index of the tab themself. */
function TabBox (BxOS, TbCSSS, PrmIdx, TbSwF, HshKy) {
  if (typeof BxOS === 'undefined' || typeof TbCSSS !== 'string') {
    alert('Tab Bx initialize failed.');

    return null;
  }

  if (typeof PrmIdx !== 'number' || PrmIdx < 0) { PrmIdx = 0; }

  if (typeof TbSwF !== 'function') { TbSwF = (OO, NO) => {}; }

  let Bx = $(BxOS).data('IdxRcd', [-1, -1]),
      CtxAJO = $(TbCSSS),
      TbTlt = $('<li/>'),
      CSSStr = '';

  let TbBx = Bx.prepend('<ul/>')
               .children('ul:first');

  CSSStr = BxOS + " > ul { margin: 0px; padding: 0px; }\n" +
           BxOS + ' > ul > li { display: inline-block; position: relative; ' +
                               'border-style: solid; vertical-align: bottom; ' +
                               "cursor: pointer; }\n" +
           TbCSSS + ' { display: none; min-height: 100px; border-style: solid; }';

  CSSAdd(CSSStr);

  if (typeof HshKy !== 'string' || HshKy.length === 0) {
    CtxAJO.each(function (Idx) {
        let This = $(this),
            TbNmA = [This.data('tabName'), This.attr('name')];

        let Tb = TbTlt.clone()
                      .text(TbNmA[0] ? TbNmA[0] : (TbNmA[1] ? TbNmA[1] : Idx.toString()))
                      .appendTo(TbBx);
      });

    TbBx.on('click', '>  li', ClickToTabSwitch);
  }
  else {
    let Hsh = window.location.hash.replace(/^#/, ''),
        RE = new RegExp(HshKy + '\\d+,?', 'g'),
        MchA = Hsh.match(RE);

    if (MchA !== null) {
      MchA = MchA[MchA.length - 1].match(/\d+/);
      PrmIdx = parseInt(MchA[0], 10);
    }

    CtxAJO.each(function (Idx) {
        let This = $(this),
            TbNmA = [This.data('tabName'), This.attr('name')];

        let Tb = TbTlt.clone()
                      .text(TbNmA)
                      .attr('name', HshKy + Idx.toString())
                      .appendTo(TbBx);
      });

    TbBx.on('click', '> span', HashToTabSwitch);
    $(window).on('hashchange', HashTrigger);
  }

  TabSwitch(TbBx.children('li:eq(' + PrmIdx + ')'));

  return Bx;

  function ClickToTabSwitch (Evt) {
    TabSwitch($(this));
  }

  function HashToTabSwitch (Evt) {
    let This = $(this),
        Idx = This.index(),
        Hsh = window.location.hash.replace(/^#/, '');

    if (Hsh.length === 0) {
      window.location = '#' + HshKy + Idx.toString();

      return 0;
    }

    let RE = RegExp(HshKy + '\\d+,?', 'g'),
        MchA = Hsh.match(RE);

    if (MchA !== null) { Hsh = Hsh.replace(RE, ''); }

    if (Hsh.length > 0) { window.location = '#' + Hsh.replace(/,$/, '') + ',' + HshKy + Idx.toString(); }
    else { window.location = '#' + HshKy + Idx.toString(); }
  }

  function HashTrigger (Evt) {
    let Hsh = window.location.hash.replace(/^#/, '');

    if (Hsh.length === 0) {
      TabSwitch(TbBx.children(':first'));

      return 0;
    }

    let RE = RegExp(HshKy + '\\d+,?', 'g'),
        MchA = Hsh.match(RE),
        Idx = 0;

    if (MchA !== null) { Idx = parseInt(MchA[MchA.length - 1].match(/\d+/), 10); }

    TabSwitch(TbBx.children(':eq(' + Idx.toString() + ')'));
  }

  function TabSwitch (JO) {
    let This = JO,
        Idx = This.index(),
        Rcd = Bx.data('IdxRcd');

    if (Rcd[1] === Idx) { return 0; }

    let NO = This,
        OO = NO.siblings('.PckTb').removeClass('PckTb');

    NO.addClass('PckTb');

    Rcd[0] = Rcd[1];
    Rcd[1] = Idx;

    Bx.data('IdxRcd', Rcd);
    CtxAJO.eq(Rcd[1]).show();

    if (Rcd[0] >= 0) { CtxAJO.eq(Rcd[0]).hide(); }

    TbSwF(OO, NO);
  }
}

/* set all element matched with given CSS selector string to be Button0 objects,
   even if the object is not created yet.
  'CSSS' = CSS Selector string.
  Return: 'Button0' element jQuery objects, or null.
  Need: jQuery API, CSSAdd(). */
function Button0 (CSSS) {
  if (typeof CSSS !== 'string') {
    alert('Set \'Button0\' object failed. Please check out passing values.');

    return null;
  }

  CSSS = CSSS.trim();

  $('body').on('mouseenter', CSSS, Evt => { Initialize(Evt.currentTarget); })
           .on('focus', CSSS, Evt => { Initialize(Evt.currentTarget); })
           .find(CSSS).each(() => { Initialize(this); });

  return 0;

  function Initialize (Obj) {
    if (!Obj || typeof Obj.LckFlg === 'boolean') { return; }

    $(Obj).attr('autocomplete', 'off');

    Obj.LckFlg = false; // 'LckFlg' = Locked Flag.
    Obj.Lock = Lock;
    Obj.Unlock = Unlock;
  }

  function Lock () {
    if (this.LckFlg) { return; }

    this.LckFlg = true;

    $(this).addClass('Lock')
           .prop('disabled', true);
  }

  function Unlock () {
    if (!this.LckFlg) { return; }

    this.LckFlg = false;

    $(this).removeClass('Lock')
           .prop('disabled', false);
  }
}

/* set a HTML element to be a Item Lister object.
  'BxOS' = Box DOM Object, jQuery Selector.
  'URL' = service URL.
  'Lmt' = Limit number of one page, give < 1 as no limit.
  'Data' = post Data, a JSON.
  'OneItmF(OneData, Idx)' = One Item build Function.
    'OneData' = One Data from server.
    'Idx' = Index of Data.
    Return: DOM to append to 'BxOS' DOM.
  'SkpIdxFlg' = Skip page Index Flag, optional, give true to skipping build page index tags.
  'IdxCls' = Index Class. optional. give empty array to skip page index tags builded.
    'IdxCls[0]' = normal class name, give non-string to ignore this state setting.
    'IdxCls[1]' = optional. disable class name, give non-string to ignore this state setting.
  'AftItmsF(Cnt, Data)' = After Items build Function. optional.
    'Cnt' = Count of data.
    'Data' = origin Data array.
  Return: jQuery object of 'BxOS'.
  Extend: PageGet(), Recount(), LimitSet(), NowPage().
  Need: ObjectCombine(). */
function ItemList (BxOS, URL, Lmt, Data, OneItmF, IdxCls, AftItmsF) {
  if (typeof BxOS === 'undefined' || typeof URL !== 'string' || isNaN(Lmt) || typeof Data !== 'object' ||
      typeof OneItmF !== 'function') {
    alert('Create a \'ItemList\' failed. Please check out passing values.');

    return null;
  }

  Lmt = parseInt(Lmt, 10);

  if (Lmt < 1) { Lmt = 0; }

  let Bx = $(BxOS),
      BxDOM = Bx.get(0),
      NwPg = 0,
      PgTgRng = 2,
      TtlCnt = 0,
      MxPg = 0;

  Bx.data('Data', Data);

  BxDOM.PageGet = OnePageList;
  BxDOM.Recount = TotalCount;
  BxDOM.LimitSet = LimitSet;
  BxDOM.NowPage = () => { return NwPg; };

  TotalCount(() => { OnePageList(NwPg); });

  if (typeof IdxCls === 'object' && IdxCls.length > 0) {
    Bx.off('click', 'div.ItmLstIdxBx:last-child > span')
      .on(
        'click',
        'div.ItmLstIdxBx:last-child > span',
        function (Evt) { // 20120727 by RZ. use class to focus on index list box.
          let This = $(this),
              Idx = parseInt(This.attr('name'), 10);

          if (Idx < 0 || Idx > MxPg || Idx === NwPg) { return 0; }

          let TC = ['', ''];

          if (typeof IdxCls[1] === 'string' && IdxCls[1].length > 0) {
            This.siblings().addBack().removeClass()
                                     .addClass(IdxCls[1]);
          }

          OnePageList(Idx);
        });
  }

  return Bx;

  function OnePageList (Pg) {
    let Tp = typeof Pg;

    if (Tp === 'undefined') { Pg = NwPg; }
    else if (Tp !== 'number') { return 0; }

    let PstData = ObjectCombine(Data, {'Lmt': Lmt, 'Ofst': (Pg * Lmt)}); // 'PstData' = Post Data.

    $.ajax({
      type: 'POST',
      dataType: 'json',
      timeout : 20000,
      url: URL,
      data: PstData,
      // beforeSend: (JQXHR, Set) => {},
      // error : (JQXHR, TxtSt, ErrThr) => {},
      // complete : (JQXHR, TxtSt) => {},
      success: (Rtn, TxtSt, JQXHR) => {
        if (Rtn.Index != 0) {
          alert(Rtn.Index + ', ' + Rtn.Message);

          return 0;
        }

        NwPg = Pg;
        Bx.empty();

        for (let i in Rtn.Extend) { Bx.append(OneItmF(Rtn.Extend[i], i)); }

        if (typeof IdxCls === 'object' || IdxCls.length > 1) { PageIndexBuild(); }

        if (typeof AftItmsF === 'function') {
          AftItmsF((typeof Rtn.Extend === 'undefined') ? 0 : Rtn.Extend.length, Rtn.Extend);
        }
      }});
  }

  /* Count Total number.
    'AftF' = After Function, called after TotalCount() finished. optional. */
  function TotalCount (AftF) {
    let PstData = ObjectCombine(Data, {'Cnt': 1, 'Lmt': 0, 'Ofst': 0}); // 'PstData' = Post Data.

    $.ajax({
        type: 'POST',
        dataType: 'json',
        timeout : 20000,
        url: URL,
        data: PstData,
        // beforeSend: (JQXHR, Set) => {},
        // error : (JQXHR, TxtSt, ErrThr) => {},
        // complete : (JQXHR, TxtSt) => {},
        success: (Rtn, TxtSt, JQXHR) => {
          if (Rtn.Index < 0) {
            alert(Rtn.Index + ', ' + Rtn.Message);

            return 0;
          }

          TtlCnt = isNaN(Rtn.Extend) ? Rtn.Extend.length : Rtn.Extend;
          MxPg = Math.ceil(TtlCnt / Lmt) - 1;

          if (Rtn.Extend == 0 && typeof IdxCls === 'object' && IdxCls.length > 1) { PageIndexBuild(); }

          if (typeof AftF === 'function') { AftF(); }
        }});
  }

  /* Reset Limit.
    'NwLmt' = New Limit.
    Return: real setting limit. or original limit without change. */
  function LimitSet (NwLmt) {
    if (typeof NwLmt !== 'number' || NwLmt < 1) { return Lmt; }

    if (NwLmt > 99) { NwLmt = 99; }

    Lmt = NwLmt;

    return Lmt;
  }

  function PageIndexBuild () {
    let IdxLst = $('<div/>').appendTo(Bx),
        TC = ['', '']; // 'TC' = Temptory Class.

    if (typeof IdxCls !== 'object' || IdxCls.length === 0) { return 0; }

    IdxLst.addClass('ItmLstIdxBx') // 20120727 by RZ. for solve 'on - click' event point multiple element, use class to focus on the index box.
          .css({'textAlign': 'center', 'marginTop': 10});

    if (typeof IdxCls[0] === 'string' && IdxCls[0].length > 0) { TC[0] = IdxCls[0]; }

    if (typeof IdxCls[1] === 'string' && IdxCls[1].length > 0) { TC[1] = IdxCls[1]; }

    /*==== first & prev page tag. ====*/

    $('<span/>').addClass(NwPg > 0 ? TC[0] : TC[1])
                .attr({'name': NwPg > 0 ? 0 : -1, 'title': 1})
                .text('╞')
                .appendTo(IdxLst); // first page.

    $('<span/>').addClass(NwPg == 0 ? TC[1] : TC[0])
                .attr({'name': NwPg - 1})
                .text('◁')
                .appendTo(IdxLst); // prev page.

    /*==== now page tag. ====*/

    let Nw = $('<span/>').addClass(TC[1])
                         .attr('name', NwPg)
                         .text(NwPg + 1)
                         .appendTo(IdxLst); // 'Nw' = Now page.

    /*==== last & next page tag. ====*/

    $('<span/>').addClass(NwPg >= MxPg ? TC[1] : TC[0])
                .attr({'name': NwPg + 1})
                .text('▷')
                .appendTo(IdxLst); // next page.

    $('<span/>').addClass(NwPg < MxPg ? TC[0] : TC[1])
                .attr({'name': NwPg < MxPg ? MxPg : (MxPg + 1), 'title': MxPg + 1})
                .text('╡')
                .appendTo(IdxLst); // last page.

    /*==== page index range handle. ====*/

    let PrvBgn = NwPg - PgTgRng,
        PrvEnd = NwPg,
        NxtBgn = NwPg + PgTgRng,
        NxtEnd = NwPg;

    if (PrvBgn < 0) {
      NxtBgn -= PrvBgn;
      PrvBgn = 0;

      if (NxtBgn > MxPg) { NxtBgn = MxPg; }
    }

    if (NxtBgn > MxPg) {
      PrvBgn -= (NxtBgn - MxPg);
      NxtBgn = MxPg;

      if (PrvBgn < 0) { PrvBgn = 0; }
    }

    /*==== prev page tags. ====*/

    for (let i = PrvBgn; i < PrvEnd; i++) { // prev range page tags.
      $('<span/>').addClass(TC[0])
                  .attr({'name': i})
                  .text(i + 1)
                  .insertBefore(Nw);
    }

    /*==== next page tags. ====*/

    for (let i = NxtBgn; i > NxtEnd; i--) {
      $('<span/>').addClass(TC[0])
                  .attr({'name': i})
                  .text(i + 1)
                  .insertAfter(Nw);
    }
  }
}

/* create a 'Frame' object.
  'PrtOS' =  Parent DOM Object or jQuery Selector.
  'W' = frame Width.
  'H' = frame Height.
  'CtxLdF' = Context Load Function. return DOM to inserted to frame.
  'CSSCls' = CSS Class name.
  'Ttl' = Title. optional.
  'SltBldB' = Silent Build Boolean. optional, default false.
  Return: 'Frame' element jQuery object.
  Need: jQuery API, CSSAdd(). */
function Frame (PrtOS, W, H, CtxLdF, CSSCls, Ttl, SltBldB) {
  let FIBCID = 'FrmIcnBtn'; // 'FIBCID' = Frame Icon Button Class ID.

  if ($('#' + FIBCID).length === 0) {
    let II = {'X': 3, 'Y': 2, 'W': 20, 'H': 20}; // 'II' = Icon image Info.

    /*==== component 'Frame' ====*/

    let CSSS = '.' + CSSCls + " > div:first-child { " +
               " padding: 1px 5px; border-radius: 5px 5px 0px 0px; font-size: 18px; border-bottom-width: 1px; " +
               " background-image:         linear-gradient(to bottom, rgba(200, 240, 255, 1), rgba(240, 248, 255, 0.9)); " +
               " background-image: -webkit-linear-gradient(top, rgba(200, 240, 255, 1), rgba(240, 248, 255, 0.9)); }\n" +
               '.' + CSSCls + " { border-width: 1px; border-radius: 5px; box-shadow: -1px 1px 2px; }\n" +
               '.' + CSSCls + " > div:nth-child(2) { padding: 5px; background-color: rgba(240, 240, 240, 0.9); }\n" +
               '.' + CSSCls + " > div:nth-child(3) { padding: 1px 3px; border-top-width: 1px; border-radius: 0px 0px 5px 5px; background-color: rgba(248, 248, 255, 0.9); }\n";

    CSSAdd(CSSS, FIBCID);
  }

  if (typeof PrtOS === 'undefined' || typeof W !== 'number' || typeof H !== 'number' || typeof CtxLdF !== 'function' ||
      typeof CSSCls !== 'string' || CSSCls.length === 0) {
    alert('Create a \'Frame\' object failed. Please check out passing values.');

    return null;
  }

  if (typeof SltBldB !== 'boolean') { SltBldB = false; }

  let Ctnr = $(PrtOS), // 'Ctnr' = Container.
      TgtRtg = {'X': 0, 'Y': 0, 'W': 0, 'H': 0}, // 'TgtRtg' = Target frame Rectangle. use to controll frame moving & resizing.
      PrtFrm = null,
      WthPrtB = false;

  let Frm = $('<span>' +
              '<div class="Hdr"><span/><span><span/><span/><span/><span/></span></div>' +
              '<div class="Ctn"/>' +
              '</span>').data({'IsMv': false, 'IsRsz': false})
                        .on('click', '> *', Evt => { ToFront(); }) // 20121205 by RZ. test new way of Frame view priority.
                        .appendTo(Ctnr);

  let FrmDOM = Frm.get(0);

  let TtlBx = Frm.addClass(CSSCls)
                 .css({'display': 'inline-block', 'position': 'absolute'})
                 .children('div:eq(1)').css({'position': 'relative', 'width': W, 'height': H, 'overflow': 'auto', 'whiteSpace': 'nowrap'})
                                       .end()
                 .children('div:first'); // 'TtlBx' = Title Box.

  TtlBx.css({'position': 'relative', 'minHeight': '28px'})
       // .click(Evt => { ToFront(); }) // 20121205 by RZ. test another way.
       .children('span:first').css({'display': 'inline-block'})
                              .text(typeof Ttl === 'string' ? Ttl : '')
                              .end()
       .children('span:last').css({'position': 'absolute', 'right': 3, 'top': 1, 'textAlign': 'right'})
                             .children('span').first().addClass('FIB FIB_Move')
                                                      .attr('title', '移動')
                                                      .on('click', FrameMoveStart)
                                                      .end()
                                              .eq(1).addClass('FIB FIB_Resize')
                                                    .attr('title', '調整大小')
                                                    .on('click', FrameResizeStart)
                                                    .end()
                                              .eq(2).addClass('FIB FIB_Max')
                                                    .attr('title', '最大/復原')
                                                    .on('click', FrameMaxSize)
                                                    .end()
                                              .last().addClass('FIB FIB_Close')
                                                     .attr('title', '關閉')
                                                     .click(FrameClose);

  FrmDOM.ActionExtend = ActionExtend;
  FrmDOM.ToFront = ToFront;
  FrameOpen(Frm, SltBldB);

  return Frm;

  function ToFront () {
    let MxZIdx = -1,
        FrmA = [];

    Frm.siblings('.' + CSSCls).each(Idx => {
      let This = $(this),
          ZIdx = parseInt(This.css('zIndex'), 10);

      MxZIdx = Math.max(MxZIdx, ZIdx);
      FrmA.push({'JO': This, 'ZIdx': ZIdx})
    });

    MxZIdx++;

    if (parseInt(Frm.css('zIndex'), 10) == MxZIdx) { return 0; }

    Frm.css('zIndex', MxZIdx);
    FrmA.push({'JO': Frm, 'ZIdx': MxZIdx});

    let C = FrmA.length;

    if (C > 1) {
      FrmA.sort(SortByZIndex);

      let FstIdx = FrmA[0].ZIdx;

      if (FrmA[0].ZIdx > 0) {
        FrmA[0].JO.css('zIndex', 0);
        FrmA[0].ZIdx = 0;
      }

      for (let i = 1; i < C; i++) {
        let GlIdx = FrmA[i - 1].ZIdx + 1;

        if (FrmA[i].ZIdx > GlIdx) {
          FrmA[i].JO.css('zIndex', GlIdx);
          FrmA[i].ZIdx = GlIdx;
        }
      }
    }

    return 1;

    function SortByZIndex (OA, OB) {
      if (OA.ZIdx === OB.ZIdx) { return 0; }

      return (OA.ZIdx > OB.ZIdx ? 1 : -1);
    }
  }

  function FrameOpen (Frm, SltBldB) {
    Frm.hide();
    ToFront();

    if (SltBldB) {
      Frm.children('div:eq(1)').append(CtxLdF);

      return 0;
    }

    let Rdm = Math.round(Math.random() * 3);

    switch (Rdm) {
      case 1:
        Frm.slideDown('normal', () => { Frm.children('div:eq(1)').append(CtxLdF); });

        break;

      case 2:
        Frm.fadeIn('normal', () => { Frm.children('div:eq(1)').append(CtxLdF); });

        break;

      case 0:
      default:
        Frm.show('normal', () => { Frm.children('div:eq(1)').append(CtxLdF); });
    }
  }

  function FrameClose (Evt) {
    let Rdm = Math.round(Math.random() * 3);

    switch (Rdm) {
      case 1:
        Frm.slideUp('normal', () => { $(this).remove(); });

        break;

      case 2:
        Frm.fadeOut('normal', () => { $(this).remove(); });

        break;

      case 0:
      default:
        Frm.hide('normal', () => { $(this).remove(); });
    }
  }

  function FrameMoveStart (Evt) {
    let TL = Frm.offset();

    TgtRtg.X = Evt.pageX - TL.left;
    TgtRtg.Y = Evt.pageY - TL.top;

    ToFront();

    Ctnr.css('cursor', 'move')
        .on('mousemove', FrameMove);

    Frm.css('border', '1px solid rgba(255, 0, 0, 0.7)')
       .data('IsMv', true);

    $(Evt.currentTarget).css('cursor', 'move')
                        .off('click')
                        .on('click', FrameMoveStop);

    return 0;

    function FrameMove (Evt) {
      Frm.css({'left': Evt.pageX - TgtRtg.X, 'top': Evt.pageY - TgtRtg.Y});
    }
  }

  function FrameMoveStop (Evt) {
    Ctnr.css({'cursor': ''})
        .off('mousemove');

    Frm.css('border', '')
       .data('IsMv', false);

    $(Evt.currentTarget).css('cursor', 'pointer')
                        .off('click')
                        .on('click', FrameMoveStart);
  }

  function FrameResizeStart (Evt) {
    let TL = Frm.offset(),
        SzTgt = Frm.children('div:eq(1)');

    TgtRtg.X = Evt.pageX;
    TgtRtg.Y = Evt.pageY;
    TgtRtg.W = SzTgt.width();
    TgtRtg.H = SzTgt.height();

    ToFront();

    Ctnr.css('cursor', 'ne-resize')
        .on('mousemove', FrameResize);

    Frm.css('border', '1px solid rgba(255, 0, 0, 0.7)')
       .data('IsRsz', true);

    $(Evt.currentTarget).css('cursor', 'ne-resize')
                        .off('click', FrameResizeStart)
                        .on('click', FrameResizeStop);

    return 0;

    function FrameResize (Evt) {
      let X = Evt.pageX - TgtRtg.X,
          Y = Evt.pageY - TgtRtg.Y,
          W = TgtRtg.W + X,
          H = TgtRtg.H - Y;

      Y += TL.top;

      if (W < 200) { W = 200; }

      if (H < 200) { H = 200; }
      else { Frm.css('top', Y); }

      Frm.children('div:eq(1)').css({'width': W, 'height': H});
    }
  }

  function FrameResizeStop (Evt) {
    Ctnr.css({'cursor': ''})
        .off('mousemove');

    Frm.css('border', '')
       .data('IsRsz', false);

    $(Evt.currentTarget).css('cursor', 'pointer')
                        .off('click', FrameResizeStop)
                        .on('click', FrameResizeStart);
  }

  function FrameMaxSize (Evt) {
    let Tgt = Frm.children('div:eq(1)'),
        Sz = [Tgt.width(), Tgt.height()],
        Lct = Frm.offset(),
        W = Ctnr.width() - (Frm.outerWidth() - Sz[0]),
        H = $(document).height() - (Frm.outerHeight() - Sz[1]);

    ToFront();

    $(Evt.currentTarget).data('LstSt', {'X': Lct.left, 'Y': Lct.top, 'W': Sz[0], 'H': Sz[1]})
                        .off('click', FrameMaxSize)
                        .on('click', FrameLastSize)
                        .prevAll('span').hide();

    Frm.css({'left': 0, 'top': 0});
    Tgt.css({'width': W, 'height': H});
  }

  function FrameLastSize (Evt) {
    let Tgt = Frm.children('div:eq(1)');

    let LstSt = $(Evt.currentTarget).off('click', FrameLastSize)
                                    .on('click', FrameMaxSize)
                                    .prevAll('span').show()
                                                    .end()
                                    .data('LstSt');

    Frm.css({'left': LstSt.X, 'top': LstSt.Y});
    Tgt.css({'width': LstSt.W, 'height': LstSt.H});
  }

  /* extend action which works with default defined.
    'Cmd' = Command of action.
    'ActnF(This)' = Action Function to extend default.
      'This' = frame DOM itself.
    Return: Frm DOM itself as OK, null as error. */
  function ActionExtend (Cmd, ActnF) {
    if (typeof Cmd !== 'string' || Cmd.length === 0 || typeof ActnF !== 'function') { return null; }

    let This = this,
        TtlBtn = TtlBx.find('> span:last > span');

    switch (Cmd) {
      case 'CloseButtonClick':
        TtlBtn.last().off('click')
                     .on('click', Evt => { ActnF(This); });

        break;

      case 'SizeChange':
        TtlBtn.eq(1).on('click', SizeChange)
                    .end()
              .eq(2).on('click', SizeChange);

        break;

      default:
    }

    return this;

    function SizeChange () {
      setTimeout(
        () => {
          if (!Frm.data('IsRsz')) { ActnF(This); }
        },
        0
      );
    }
  }
}

/* class Animation.
  'DO' = DOM Object.
  'ItmDrwFA' = Item Draw Function Array. each function gets values: (Ctx, Sz).
    'Ctx' = canvas Context object.
    'Sz' = Size object includes {'W', 'H'};
  'BgDrwF' = Background Draw Function. optional. */
function Animation (DO, ItmDrwFA, BgDrwF) {
  if (typeof DO !== 'object' || DO === null || typeof ItmDrwFA !== 'object' || typeof ItmDrwFA.length !== 'number') {
    console.log('Animation is not going to run.');

    return;
  }

  let This = this;

  // properties set.
  this.DOM = null;
  this.Ctx = DO.getContext('2d'); // 'Ctx' = Context object.
  this.ScnSz = {'W': DO.width, 'H': DO.height}; // 'ScnSz' = Scenary Size.
  this.RunB = false;
  this.BgDrwF = Ctx => {}; // 'BgDrwF' = Background Draw Function.
  this.ItmDrwFA = []; // array of Item Draw Function.

  // methods set.
  this.Start = Start;
  this.Stop = Stop;
  this.FrameDraw = FrameDraw;
  this.ItemDrawAdd = ItemDrawAdd;
  this.ItemDrawDel = ItemDrawDel;

  for (let i = 0; i < ItmDrwFA.length; i++) {
    if (typeof ItmDrwFA[i] === 'function') { this.ItmDrwFA.push(ItmDrwFA[i]); }
  }

  if (typeof BgDrwF === 'function') { this.BgDrwF = BgDrwF; }
  else {
    this.BgDrwF = () => {
      this.Ctx.fillStyle = 'rgba(255, 255, 255, 1)';

      this.Ctx.fillRect(0, 0, this.ScnSz.W, this.ScnSz.H);
    };
  }

  return;

  function Start () {
    this.RunB = true;

    this.FrameDraw();
  }

  function Stop () {
    this.RunB = false;
  }

  function FrameDraw () {
    if (!this.RunB) { return; }

    this.BgDrwF(this.Ctx, this.ScnSz);

    for (let i = 0 ; i < this.ItmDrwFA.length; i++) { this.ItmDrwFA[i](this.Ctx, this.ScnSz); }

    setTimeout(() => { This.FrameDraw(); }, 50);
  }

  function ItemDrawAdd (ItmDrwF) {
    if (typeof ItmDrwF !== 'function') { return -1; }

    this.ItmDrwFA.push(ItmDrwF);

    return 0;
  }

  function ItemDrawDel (Idx) {
    if (typeof Idx !== 'number' || Idx >= this.ItmDrwFA.length) { return -1; }

    this.ItmDrwFA.splice(Idx, 1);
  }
}

//======================================================================================================================
