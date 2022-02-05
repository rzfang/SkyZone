'use strict';

//==== Library =========================================================================================================

//==== Tool Function ===================================================================================================

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

    if (!Object.prototype.hasOwnProperty.call(CSA, i)) { continue; }

    T = CSA[i].replace(/^\s+|\s+$/g, '').split('='); // trim each data.

    CO[T[0]] = decodeURIComponent(T[1]);
  }

  if (Ky && typeof Ky === 'string') {
    for (let i in CO) {
      if (!Object.prototype.hasOwnProperty.call(CO, i)) { continue; }

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

/* Deny web page embeded into another page by frame or iframe. */
function EmbedDeny () {
  if (top != self) { window.location.href = 'about:blank'; }
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

//==== Independent Module, may need jQuery API. ========================================================================

//======================================================================================================================
