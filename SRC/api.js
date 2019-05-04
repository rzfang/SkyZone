'use strict';

//======================================================================================================================

function GoodWordsSet()
{
  var Str = '',
      Cvs = $('canvas#GdWds'),
      Ctx = null,
      Wds = [];

  NowWordGet();

  return 0;

  function NowWordGet()
  {
    $.ajax(
      {
        'type': 'POST',
        'dataType': 'json',
        'timeout' : 20000,
        'url': 'service/words/nowone',
        'data': null,
        'success': function(Data, TxtSt, JQXHR)
          {
            if (Data.Index < 0)
            { return -1; }

            Str = Data.Extend.Wds;

            Initialize();
            Animate();
          }
      });
  }

  function Initialize()
  {
    Cvs.attr({'width': Cvs.width(), 'height': Cvs.height()});

    Ctx = Cvs.get(0).getContext('2d');
    Ctx.textBaseline = 'middle';

    //==== word info set. ====

    var BsSptA = [40, 25], // 'BsSptA' = Base Seperate Array, [X, Y].
        StrA = Str.replace(/\n|，|；|。| /g, "\n").split("\n"); // 'StrA' = String Array.

    for (var i = 0; i < StrA.length; i++)
    {
      var BsLct = [80, Ctx.canvas.height - (BsSptA[1] * (StrA.length - i + 1))]; // 'BsLct' = Base Location.

      for (var j = 0; j < StrA[i].length; j++)
      {
        var Chr = StrA[i].charAt(j);

        var Clr = [RandomRange(64, 128).toString(),
                 RandomRange(64, 192).toString(),
                 RandomRange(64, 255).toString(),
                 RandomRange(0.2, 0.9, 2).toString()];

        var Sz = RandomRange(20, 50);

        var Wd = {'Chr': Chr,
                  'DftLct': [BsLct[0] + (j * BsSptA[0]) + RandomRange(-5, 5), BsLct[1] + RandomRange(-5, 5)],
                  'Lct': [RandomRange(0, Ctx.canvas.width, 2), RandomRange(0, Ctx.canvas.height, 2)],
                  'Drct': [RandomRange(-1, 1, 2), RandomRange(-1, 1, 2)],
                  'Sz': Sz,
                  'Clr': 'rgba(' + Clr[0] + ', ' + Clr[1] + ', ' + Clr[2] + ', ' + Clr[3] + ')',
                  'Fnt': 'italic bold ' + Sz.toString() + 'px sans-serif'};

        Wds.push(Wd);
      }
    }
  }

  function Animate()
  {
    Ctx.clearRect(0, 0, Ctx.canvas.width, Ctx.canvas.height);

    AlignedStand();
  }

  function AlignedStand()
  {
    for (var i = 0; i < Wds.length; i++)
    {
      Wds[i].Lct[0] = Wds[i].DftLct[0];
      Wds[i].Lct[1] = Wds[i].DftLct[1];

      Ctx.font = Wds[i].Fnt;
      Ctx.fillStyle = Wds[i].Clr;
      Ctx.shadowOffsetX = 0;
      Ctx.shadowOffsetY = 0;
      Ctx.shadowBlur = 0;

      Ctx.fillText(Wds[i].Chr, Wds[i].Lct[0], Wds[i].Lct[1]);
    }
  }

  function FreeWalk()
  {
    for (var i = 0; i < Wds.length; i++)
    {
      Ctx.font = Wds[i].Fnt;
      Ctx.fillStyle = Wds[i].Clr;
      Ctx.shadowColor = Wds[i].Clr;
      Ctx.shadowOffsetX = 3;
      Ctx.shadowOffsetY = 3;
      Ctx.shadowBlur = 5;

      Ctx.fillText(Wds[i].Chr, Wds[i].Lct[0], Wds[i].Lct[1]);

      Wds[i].Lct[0] += Wds[i].Drct[0];
      Wds[i].Lct[1] += Wds[i].Drct[1];

      if (Wds[i].Lct[0] + Wds[i].Sz < 0)
      { Wds[i].Lct[0] = Ctx.canvas.width; }
      else if (Wds[i].Lct[0] > Ctx.canvas.width)
      { Wds[i].Lct[0] = Wds[i].Sz * -1; }

      if (Wds[i].Lct[1] + Wds[i].Sz < 0)
      { Wds[i].Lct[1] = Ctx.canvas.height; }
      else if ((Wds[i].Lct[1] - Wds[i].Sz) > Ctx.canvas.height)
      { Wds[i].Lct[1] = Wds[i].Sz * -1; }
    }
  }

  /* make a random number in the range.
    'Min' = minimum number.
    'Max' = maximum number.
    'Dcm' = Decimal. optional, default 0. give -1 to keep original decimal.
    Return: random number in the range, or 0 as error. */
  function RandomRange(Min, Max, Dcm)
  {
    if (typeof Min !== 'number' || typeof Max !== 'number')
    { return 0; }

    if (typeof Dcm !== 'number')
    { Dcm = 0; }

    if (Min > Max || Max < Min)
    {
      var T = Min;

      Min = Max;
      Max = T;
    }

    var Dst =  Max - Min, // 'Dst' = Distance.
        Nbr = Math.random() * Dst + Min;

    if (Dcm === 0)
    { Nbr = Math.floor(Nbr); }
    else if (Dcm > 0)
    {
      var Pow = Math.pow(10, Dcm);

      Nbr = Math.floor(Nbr * Pow) / Pow;
    }

    return Nbr;
  }
}

function ArtCornerSet () {
  var AtCnr = $('#AtCnr'),
      AtCnrChk = $('#AtCnrChk');

  AtCnrChk.on({
    'mouseenter': function(Evt){ AtCnr.children().show(); },
    'mouseleave': function(Evt){ AtCnr.children().hide(); }
  });

  RandomOne();

  return AtCnr;

  function RandomOne () {
    $.ajax({
      type: 'POST',
      dataType: 'json',
      timeout : 20000,
      url: '/service/artcorner/randomone',
      data: { Cmd: 6 },
      success: function (Data, TxtSt, JQXHR) {
        if (Data.Index < 0) { return -1; }

        AtCnr.css('backgroundImage', 'url("' + Data.Extend.ImgUrl + '")')
             .children().text(Data.Extend.Ttl + "\n" + Data.Extend.Dt.substr(0, 10) + "\nby " + Data.Extend.Atr);
      }});
  }
}

//==== Independent Module, may need jQuery API. ========================================================================

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


//======================================================================================================================
