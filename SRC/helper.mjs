/* parse cookie parameters in a object.
  @ key name of cookie. optional, give to return it only.
  Return: object. */
function cookieParam (key) {
  const cookieObject = {};
  const cookieParts = document.cookie.split(';'); // cookie string array.

  for (const i in cookieParts) {
    if (!Object.prototype.hasOwnProperty.call(cookieParts, i)) { continue; }

    const [ key, value ] = cookieParts[i].replace(/^\s+|\s+$/g, '').split('='); // trim each data.

    cookieObject[key] = decodeURIComponent(value);
  }

  if (key && typeof key === 'string') {
    for (const i in cookieObject) {
      if (!Object.prototype.hasOwnProperty.call(cookieObject, i)) { continue; }

      if (i === key) { return cookieObject[i]; }
    }

    return null;
  }

  return cookieObject;
}

/* set cookie.
  @ expiration = expired time in seconds. give negative number to remove target cookie.
  @ domain. optional.
  < 0 as OK, < 0 as error. */
function cookieSet (name, value, expiration, path, domain) {
  if (
    typeof name !== 'string' ||
    typeof value === 'undefined' || value === null ||
    typeof expiration !== 'number' || expiration === null
  ) { return -1; }

  const date = new Date();

  date.setTime(date.getTime() + (expiration * 1000));

  let Str = name + '=' + encodeURIComponent(value) + ';expires=' + date.toUTCString() + ';';

  if (typeof path === 'string' && path.length > 0) { Str += 'path=' + path + ';'; }

  if (typeof domain === 'string' && domain.length > 5) { Str += 'domain=' + domain + ';'; }

  document.cookie = Str;

  return 0;
}

/*
  @ Date object, optional, default is now.
  @ format string, optional
  < date time string with format. */
function dateToString (date, format = 'yyyy-mm-dd hh:ii') {
  if (!(date instanceof Date)) {
    date = new Date();
  }

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');

  switch (format.toLowerCase()) {
    case 'yyyy-mm-dd hh:ii':
      return `${year}-${month}-${day} ${hour}:${minute}`;

    case 'yyyy-mm-dd hh:ii:ss':
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`;

    case 'yyyymmddhhiiss':
      return `${year}${month}${day}${hour}${minute}${second}`;
  }

  return '???';
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
  cookieParam,
  cookieSet,
  dateToString,
  PageTurn,
  RandomRange,
};
