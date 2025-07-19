(function Z_ZFT () {
  var Encode = function (Str) {
    return Str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  var Tag = function (Str) {
    return Str
      .replace(/(https?:\/\/\S+)(\s)?/g, '<a href="$1" target="_blank">$1</a>$2');
      // .replace(/(\[[^\[\]]+\])/g, '<i>$1</i>');
  };

  var ParagraphParse = function (Str) {
    var Ptn = /==== .+ ====\n/g,
      Prgrphs = Str.split(Ptn), // paragraphs.
      Ttls = Str.match(Ptn), // titles.
      Ldr = Prgrphs.splice(0, 1)[0], // leader context.
      HTML = '',
      Anchrs = [];

    if (Ldr && (Ldr = Ldr.trim())) { HTML += '<p>' + Tag(Encode(Ldr)).trim() + '</p>\n'; }

    for (var i = 0; i < Prgrphs.length; i++) {
      var Anchr = {
        Ttl: Ttls[i].replace(/^=+|=+\s$/g, '').trim(),
        Nm: '',
        Lv: 1 };

      Anchr.Nm = Encode(Anchr.Ttl.replace(/\s/g, '_'));
      HTML +=
        '<h4 id="' + Anchr.Nm + '"><a href="#' + Anchr.Nm + '">' + Ttls[i].replace(/\n$/, '</a></h4>\n') +
        '<p>' + Tag(Encode(Prgrphs[i])).trim() + '</p>\n';

      Anchrs.push(Anchr);
    }

    return { HTML: HTML, Anchrs: Anchrs };
  };

  var ChapterParse = function (Str) {
    var Ptn = /==== .+ =====+\n/g,
      Chptrs = Str.split(Ptn), // chapters.
      Ttls = Str.match(Ptn), // titles.
      Ldr = Chptrs.splice(0, 1)[0], // leader context.
      HTML = '',
      Anchrs = [],
      Rst; // result of ParagraphParse.

    if (Ldr) {
      Rst = ParagraphParse(Ldr);
      HTML += Rst.HTML;
      Anchrs = Anchrs.concat(Rst.Anchrs);
    }

    for (var i = 0; i < Chptrs.length; i++) {
      var Anchr = {
        Ttl: Ttls[i].replace(/^=+|=+\s$/g, '').trim(),
        Nm: '',
        Lv: 0 };

      Rst = ParagraphParse(Chptrs[i]);
      Anchr.Nm = Encode(Anchr.Ttl.replace(/\s/g, '_'));
      HTML +=
        '<h3 id="' + Anchr.Nm + '"><a href="#' + Anchr.Nm + '">' + Ttls[i].replace(/\n$/, '</a></h3>\n') +
        Rst.HTML;

      Anchrs.push(Anchr);

      Anchrs = Anchrs.concat(Rst.Anchrs);
    }

    return { HTML: HTML, Anchrs: Anchrs };
  };

  var ZFT = function (Str) { // RZ format text.
    var Rst = ChapterParse(Str),
      HTML = '';

    HTML =
      '<style class="zft">\n' +
        '.zft~* { margin: 0; }\n' +
        '.zft~* a { text-decoration: none; }\n' +
      '</style>\n' + Rst.HTML;

    // console.log(HTML);

    return HTML;
  };

  if (typeof module !== 'undefined') { module.exports = ZFT; }
  else if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { ZFT: ZFT }; }
    else { window.Z.ZFT = ZFT; }
  }
})();
