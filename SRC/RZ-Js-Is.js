/*global jQuery */

(function Z_Is_API () {
  var Is;

  Is = {
    Boolean: function (Obj) { return (typeof Obj === 'boolean'); },
    Number: function (Obj) { return (typeof Obj === 'number'); },
    String: function (Obj) { return (typeof Obj === 'string'); },
    Function: function (Obj) { return (typeof Obj === 'function'); },
    Object: function (Obj) { return (typeof Obj === 'object'); },
    Undefined: function (Obj) { return (typeof Obj === 'undefined'); },
    Array: function (Obj) { return (Obj instanceof Array); },
    Date: function (Obj) { return (Obj instanceof Date); },
    Promise: function (Obj) {
      return (typeof Obj !== 'object' || !Obj.hasOwnProperty('then') || !Obj.hasOwnProperty('catch'));
    },
    EMail: function (Str) {
      if (typeof Str !== 'string') { return false; }

      return (/^[\w.]+@.{2,16}\.[0-9a-z]{2,3}$/).test(Str);
    },
    jQuery: function (Obj) { return (typeof jQuery !== 'undefined' && Obj instanceof jQuery); },
    URL: function (Obj) {
      if (typeof Obj !== 'string') { return false; }

      return (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/).test(Obj);
    } // from here : http://stackoverflow.com/questions/1701898/how-to-detect-whether-a-string-is-in-url-format-using-javascript
  };

  if (typeof module !== 'undefined') { module.exports = Is; }
  else if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = {Is: Is}; }
    else { window.Z.Is = Is; }
  }
})();