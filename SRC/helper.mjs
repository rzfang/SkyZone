/* parse Cookie Parameters in a object.
  'Ky' = Key name of cookie. optional, give to return it only.
  Return: object. */
function CookieParam (Ky) {
  const CSA = document.cookie.split(';'), // 'CSA' = Cookie String Array.
    CO = {};

  for (const i in CSA) {
    if (!Object.prototype.hasOwnProperty.call(CSA, i)) { continue; }

    const T = CSA[i].replace(/^\s+|\s+$/g, '').split('='); // trim each data.

    CO[T[0]] = decodeURIComponent(T[1]);
  }

  if (Ky && typeof Ky === 'string') {
    for (const i in CO) {
      if (!Object.prototype.hasOwnProperty.call(CO, i)) { continue; }

      if (i === Ky) { return CO[i]; }
    }

    return null;
  }

  return CO;
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

  const Dt = new Date();

  Dt.setTime(Dt.getTime() + (Exp * 1000));

  let Str = Nm + '=' + encodeURIComponent(V) + ';expires=' + Dt.toUTCString() + ';';

  if (typeof Pth === 'string' && Pth.length > 0) { Str += 'path=' + Pth + ';'; }

  if (typeof Dmn === 'string' && Dmn.length > 5) { Str += 'domain=' + Dmn + ';'; }

  document.cookie = Str;

  return 0;
}

/* turn to another page. give empty string to reload current page.
  'URL' = URL to go. optional, default ''. */
function PageTurn (URL) {
  if (typeof URL !== 'string') { return 0; }

  if (URL.length > 0) { window.location = URL; }
  else { window.location.reload(true); }
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
    const T = Min;

    Min = Max;
    Max = T;
  }

  const Dst =  Max - Min; // 'Dst' = Distance.

  let Nbr = Math.random() * Dst + Min;

  if (Dcm === 0) { Nbr = Math.floor(Nbr); }
  else if (Dcm > 0) {
    const Pow = Math.pow(10, Dcm);

    Nbr = Math.floor(Nbr * Pow) / Pow;
  }

  return Nbr;
}

export {
  CookieParam,
  CookieSet,
  PageTurn,
  RandomRange,
};
