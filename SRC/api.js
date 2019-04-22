'use strict';

function FrameShow(Frm, X, Y, ThenF)
{
  if (typeof Frm !== 'object')
  { return 0; }

  X = typeof X !== 'number' ? Frm.css('left') : X;
  Y = typeof Y !== 'number' ? Frm.css('top') : Y;

  if (typeof ThenF !== 'function')
  { ThenF = function(){}; }

  Frm.get(0).ToFront();

  if (Frm.css('display') !== 'none')
  {
    Frm.animate({'left': X, 'top': Y});

    return 0;
  }

  var Rdm = Math.round(Math.random() * 3);

  Frm.css({'left': X, 'top': Y});

  switch (Rdm)
  {
    case 1:
      Frm.slideDown('normal', ThenF);
      break;

    case 2:
      Frm.fadeIn('normal', ThenF);
      break;

    case 0:
    default:
      Frm.show('normal', ThenF);
  }
}

function FrameHide(Frm)
{
  var Rdm = Math.round(Math.random() * 3);

  switch (Rdm)
  {
    case 1:
      Frm.slideUp('normal');
      break;

    case 2:
      Frm.fadeOut('normal');
      break;

    case 0:
    default:
      Frm.hide('normal');
  }
}

/* get Related Frame Rectangle.
  'OrgFrm' =  Origin Frame object.
  'TgtSz' = Target Size. [W, H].
  'OfstLct' = Offset Location X and Y. optional.
  Return: [X, Y, W, H]. */
function RelatedFrameRectangle(OrgFrm, TgtSz, OfstLct)
{
  if (typeof OrgFrm !== 'object' || typeof TgtSz !== 'object')
  { return 0; }

  if (typeof OfstLct !== 'object' || OfstLct.length < 2)
  { OfstLct = [0, 0]; }

  var C = $('#Main'), // 'C' = Container.
      CL = C.offset(),
      CR = [CL.left, CL.top, C.innerWidth(), C.innerHeight()], // 'CR' = Container Rectangle.
      OFL = OrgFrm.offset(), // 'OFL' = Origin Frame Location.
      OR = [OFL.left, OFL.top, OrgFrm.innerWidth(), OrgFrm.innerHeight()],
      TR = [OR[0] + OR[2] + OfstLct[0] + 5, OR[1] + OfstLct[1], TgtSz[0], TgtSz[1]]; // 'TR' = Target Rectangle.

  if ((TR[0] + TR[2]) > (CR[2] + CR[0]))
  { TR[0] = OR[0] - TR[2] - 5 + CR[0] + OfstLct[0]; }
  if (TR[0] < CR[0])
  { TR[0] = CR[0] + OfstLct[0]; }

  if ((TR[1] + TR[3]) > (CR[3] + CR[1]))
  { TR[1] = CR[3] - TR[3] + CR[1] - 5; }
  if (TR[1] < CR[1])
  { TR[1] = CR[1] + 5; }

  return TR;
}

/* locate a new opened Base Frame X coordinate.
  'Self' = Self Frame of base frames.
  Return: X location of self frame. */
function BaseFrameXGet(Self)
{
  if (typeof Self !== 'object')
  { return 0; }

  var BsFrmA = [$('#BlgLstFrm'), $('#MsgBrdFrm'), $('#TtlLstFrm')],
      MaxX = 0,
      MinX = 99999;

  for (var i = 0; i < BsFrmA.length; i++)
  {
    if (BsFrmA[i] === undefined || BsFrmA[i].length === 0 || Self.attr('id') === BsFrmA[i].attr('id') ||
       BsFrmA[i].css('display') === 'none')
    { continue; }

    var ChkXY = BsFrmA[i].offset();

    MaxX = Math.max(MaxX, (ChkXY.left + BsFrmA[i].width() + 5));
    MinX = Math.min(MinX, (ChkXY.left - 5))
  }

  if (MinX === 99999)
  { MinX = 0; }

  var SelfW = Self.width();

  return (SelfW < MinX) ? (MinX - SelfW) : MaxX;

  // if (Self.width() < MinX)


  // return X;
}

function AboutFrame(Ttl)
{
  var ID = 'ItdFrm',
      Frm = $('#' + ID);

  if (Frm.length > 0)
  {
    FrameShow(Frm);
    return 0;
  }

  Frm = Frame('#Main', 640, 480, AboutFrameSet, 'Frm', Ttl, true);

  Frm.attr({'id': ID})
     .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

  var Bs = $('#Main');

  FrameShow(Frm, (Bs.width() - Frm.outerWidth()) / 2, Bs.offset().top + 5);

  return 0;

  function AboutFrameSet()
  {
    return TabBox('#AbtBx', '#AbtBx > div.AbtPg', 0);
  }
}

/*
  Notice: this is a base frame. */
function BlogListFrame(Ttl)
{
  var ID = 'BlgLstFrm',
      BlogLstFrm = $('#' + ID),
      Sz = [280, 520],
      MsgLstFrm = $('#MsgBrdFrm');

  if (BlogLstFrm.length > 0)
  {
    FrameShow(BlogLstFrm);

    return 0;
  }

  BlogLstFrm = Frame('#Main', Sz[0], Sz[1], BlogListFrameSet, 'Frm', Ttl, true);

  BlogLstFrm.attr({'id': ID})
            .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(BlogLstFrm); });

  FrameShow(BlogLstFrm, BaseFrameXGet(BlogLstFrm));

  return 0;

  function BlogListFrameSet()
  {
    var LstBx = $('#BlogLstBx'),
        BlogBx = LstBx.parent(),
        OptnBtn = BlogBx.find('> div:first > input:button');

    ItemList(LstBx, '/service/blog/list', 5, {}, OneBlog, ['LstIdxTg', 'LstIdxTgDsb']); // List Recent Blogs.

    OptnBtn.first().on('click', TagListFrame)
                   .end()
           .eq(1).on('click', OneRandomBlogShow);
    LstBx.on('click', '.OneBlog', OneBlogShow);

    return BlogBx;
  }

  function OneBlog(Data, Idx)
  {
    var Itm = $('#OneBlog').clone().removeAttr('id');

    Itm.attr('id', Data.ID)
       .data('Pswd', Data.Pswd)
       .children('div:first').text(Data.Ttl)
                             .end()
       .children('div:eq(2)').text(Data.Smry)
                             .end()
       .find('> div:last > span:last').text(Data.Dt.substr(0, 10));

    if (typeof Data.Tg === 'object' && Data.Tg.length > 0)
    {
      for (var i in Data.Tg)
      {
        var Tg = Data.Tg[i];

        $('<span/>').text(Tg.Nm)
                    .attr('name', Tg.ID)
                    .appendTo(Itm.children('div:eq(1)'));
      }
    }

    if (Data.Pswd.length > 0)
    {
      var LckIco = $('<span/>');

      LckIco.addClass('IcoBlogTp IcoBlogLck')
            .attr({'title': '上鎖的文章'})
            .prependTo(Itm.find('> div:last > span:last'));
    }

    switch (Data.Tp)
    {
      case 'text':
        $('<span/>').addClass('IcoBlogTp IcoBlogTxt')
                    .attr({'title': '文章'})
                    .prependTo(Itm.find('> div:last > span:last'));
        break;

      case 'image':
        $('<span/>').addClass('IcoBlogTp IcoBlogImg')
                    .attr({'title': '圖文'})
                    .prependTo(Itm.find('> div:last > span:last'));
        break;

      case 'images':
        $('<span/>').addClass('IcoBlogTp IcoBlogImgs')
                    .attr({'title': '相簿'})
                    .prependTo(Itm.find('> div:last > span:last'));
        break;
    }

    return Itm;
  }

  function OneRandomBlogShow(Evt)
  {
    Evt.stopPropagation();

    $(Evt.currentTarget).attr({'id': '00000000000000000000000000000000', 'name': 'random'});

    OneBlogShow(Evt);
  }

  function TagListFrame(Evt)
  {
    Evt.stopPropagation();

    var ID = 'TgLstFrm',
        Frm = $('#' + ID),
        R = [0, 0];

    if (typeof Frm === 'object' && Frm.length > 0)
    {
      R = RelatedFrameRectangle(BlogLstFrm, [Frm.outerWidth(), Frm.outerHeight()]);

      FrameShow(Frm, R[0], R[1]);

      return 1;
    }

    $.ajax(
      {
        'type': 'POST',
        'dataType': 'json',
        'timeout' : 20000,
        'url': '/service/tag/list',
        'data': {},
        'success': function(Rtn, TxtSt, JQXHR)
          {
            if (Rtn.Index < 0)
            {
              alert(Rtn.Message);
              return -1;
            }

            var Bx = $('#TgLstBx').children(),
                Lst = Bx.first(),
                Tlt = $('<div><label><input type="checkbox"/><span/></lable></div>');

            for (var i in Rtn.Extend)
            {
              var Info = Rtn.Extend[i],
                  One = Tlt.clone().addClass('OneTg').appendTo(Lst);

              One.children('label').children('input:checkbox').val(Info.ID)
                                                              .end()
                                   .children('span').addClass('Block')
                                                    .text(Info.Nm);
            }

            Bx.eq(1).children('input:button').first().on('click', NoTagFilterList)
                                                     .end()
                                             .eq(1).on('click', TagFilterList);

            Frm = Frame('#Main', 200, 200, function(){ return Bx; }, 'Frm', '標籤過濾', true);

            Frm.attr('id', ID)
               .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

            R = RelatedFrameRectangle(BlogLstFrm, [Frm.outerWidth(), Frm.outerHeight()]);

            FrameShow(Frm, R[0], R[1]);
          }
      });

    return 0;

    function NoTagFilterList(Evt)
    {
      Evt.stopPropagation();

      $(this).closest('div').prev('div').find('input:checkbox').prop('checked', false);

      ItemList('#BlogLstBx', '/service/blog/list', 5, {'TgIDA': []}, OneBlog, ['LstIdxTg', 'LstIdxTgDsb']); // List Recent Blogs.
      FrameHide(Frm);
    }

    function TagFilterList(Evt)
    {
      Evt.stopPropagation();

      var TgIDA = [];

      $(this).closest('div').prev('div').find('input:checkbox:checked').each(function(Idx)
        { TgIDA.push($(this).val()); });

      ItemList('#BlogLstBx', '/service/blog/list', 5, {'TgIDA': TgIDA}, OneBlog, ['LstIdxTg', 'LstIdxTgDsb']); // List Recent Blogs.
      FrameHide(Frm);
    }
  }

  function OneBlogShow(Evt)
  {
    Evt.stopPropagation();

    var This = $(Evt.currentTarget),
        ID = This.attr('id'),
        Ttl = This.children('div:first').text(),
        Pswd = This.data('Pswd'),
        Rdm = This.attr('name') === 'random';

    if (ID.length === 0)
    { return -1; }

    var Frm = $('#Frm_' + ID);

    if (Frm.length > 0)
    {
      var PF = This.closest('.Frm'), // 'PF' = Parent Frame.
          R = RelatedFrameRectangle(PF, [Frm.width(), Frm.height()], [0, This.offset().top - PF.offset().top]);

      FrameShow(Frm, R[0], R[1]);

      return 1;
    }

    BlogOneFrame(ID, Rdm, Ttl, Evt.currentTarget);
  }
}

/*
  'ID' = blog ID.
  'Rdm' = bool to Random a blog. optional, defautl false.
  'Ttl' = Title of blog frame. optional.
  'TrgDOM' = the DOM object which Triggers JQuery Event. optional.
  'Pswd' = Password of blog. optional. */
function BlogOneFrame(ID, Rdm, Ttl, TrgDOM, Pswd)
{
  if (typeof ID !== 'string' || ID.length === 0)
  { return -1; }

  Rdm = typeof Rdm === 'boolean' && Rdm ? 1 : 0;

  if (typeof Pswd !== 'string')
  { Pswd = ''; }

  $.ajax(
    {
      'type': 'POST',
      'dataType': 'json',
      'timeout' : 20000,
      'url': 'service.php',
      'data': {'Cmd': 2, 'ID': ID, 'Rdm': Rdm, 'Pswd': Pswd},
      'success': function(Data, TxtSt, JQXHR)
        {
          if (Data.Index < 0)
          {
            alert(Data.Index + ', ' + Data.Message);

            return -1;
          }
          else if (Data.Index > 0)
          {
            if (Data.Index > 1)
            { alert(Data.Message); }

            PasswordAsk(function(Pswd1){ BlogOneFrame(ID, Rdm, Ttl, TrgDOM, Pswd1); }, Ttl, TrgDOM);

            return -2;
          }

          var PswdFrm = $('#PswdFrm');

          if (PswdFrm.length > 0)
          { FrameHide(PswdFrm); }

          var TgtFrm = null;

          switch (Data.Extend.Tp)
          {
            case 'text':
              TgtFrm = OneTextShow(Data.Extend);
              break;

            case 'zft':
              TgtFrm = OneZftShow(Data.Extend);
              break;

            case 'image':
              TgtFrm = OneImageShow(Data.Extend);
              break;

            case 'images':
              TgtFrm = OneImagesShow(Data.Extend);
              break;

            default:
              alert('working on it.');
              return 0;
          }

          var FrmO = TgtFrm.get(0),
              ExBx = $('<span><input type="checkbox"/><span/></span>');

          FrmO.CommentCountSet = CommentCountSet;
          FrmO.CommentCountGet = CommentCountGet;

          ExBx.addClass('Ftr')
              .appendTo(TgtFrm)
              .children('input:checkbox').attr('title', '進階選項')
                                         .change(ExtraInfoToggle)
                                         .end()
              .children('span').css({'display': 'none'});

          //==== set time info. ====

         var TmBx = $('<div><span/><span></div>');

         TmBx.appendTo(ExBx.children('span:first'))
             .children('span').first().text('建立時間：')
                                      .end()
                              .last().text(Data.Extend.Dt);

         //==== set tags list. ====

          if (Data.Extend.TgA.length > 0)
          {
            var TgBx = $('<div><span/><span/></div>');

            TgBx.appendTo(ExBx.children('span:first'))
                .children('span').first().text('標籤：');

            for (var i in Data.Extend.TgA)
            {
              var Tg = Data.Extend.TgA[i];

              $('<span/>').attr('name', Tg.ID)
                          .text(Tg.Nm)
                          .appendTo(TgBx.children('span:last'));
            }
          }

          //==== set share link URL. ====

          var ShrLnk = $('<div><span/><a/><a/><a/><a/><a/></div>'),
              URL = encodeURIComponent(Data.Extend.URL),
              Facebook = 'https://www.facebook.com/share.php?u=' + URL,
              GooglePlus = 'https://plus.google.com/share?url=' + URL,
              Twitter = 'https://twitter.com/intent/tweet?url=' + URL,
              Plurk = 'https://www.plurk.com/?qualifier=shares&status=' + URL + ' (' + Ttl +')'; // post to Plurk.

          ShrLnk.appendTo(ExBx.children('span:first'))
                .children('span:first').text('分享網址：')
                                       .end()
                .children('a').attr('target', '_blank')
                              .eq(0).addClass('IcoShr IcoLnk')
                                    .attr({'href': Data.Extend.URL, 'title': '直接連結'})
                                    .end()
                              .eq(1).addClass('IcoShr IcoFb')
                                    .attr({'href': Facebook, 'title': '分享至 Facebook'})
                                    .end()
                              .eq(2).addClass('IcoShr IcoGp')
                                    .attr({'href': GooglePlus, 'title': '分享至 Google+'})
                                    .end()
                              .eq(3).addClass('IcoShr IcoTtr')
                                    .attr({'href': Twitter, 'title': '分享至 Twitter'})
                                    .end()
                              .eq(4).addClass('IcoShr IcoPlk')
                                    .attr({'href': Plurk, 'title': '分享至 Plurk'});

          if (Data.Extend.Pswd.length > 0)
          {
            $('<span/>').addClass('IcoBlogTp IcoBlogLck')
                        .attr({'title': '上鎖的文章'})
                        .prependTo(ShrLnk);
          }

          //==== guest response. ====

          var RspBtn = $('<input type="button"/>');

          RspBtn.appendTo(ExBx.children('span:first'))
                .addClass('Btn0')
                .on('click', BlogCommentListFrame);

          if (typeof Data.Extend.CmtCnt !== 'undefined' && Data.Extend.CmtCnt > 0)
          { FrmO.CommentCountSet(parseInt(Data.Extend.CmtCnt, 10)); }
          else
          { FrmO.CommentCountSet(0); }

          //====

          var FrmSz = [TgtFrm.width(), TgtFrm.height()],
              R = [0, 0];

          if (typeof TrgDOM === 'object' && TrgDOM !== null)
          {
            var TE = $(TrgDOM), // 'TE' = Target Element.
                TF = TE.closest('.Frm'); // 'TF' = Target Frame element.

            R = RelatedFrameRectangle(TF, FrmSz, [0, TE.offset().top - TF.offset().top]);
          }
          else
          { R = [Math.max(($(document).width() - FrmSz[0]) / 2, 0), 30]; }

          FrameShow(TgtFrm, R[0], R[1]);
        }
    });

  return 0;

  function OneTextShow(Data)
  {
    var Bx = $('<div><pre/></div>');

    Bx.addClass('Blog Text')
      .children(':first-child').html(TextToHTML(Data.Info.Str));

    var Frm = Frame('#Main', 500 + 15, 400, function(){ return Bx; }, 'Frm', Data.Ttl, true);

    return Frm.attr('id', 'Frm_' + Data.ID);
  }

  function OneZftShow(Data)
  {
    var Bx = $('<div><pre/></div>');

    Bx.addClass('Blog Text')
      .children(':first-child').html(Z.ZFT(Data.Info.Str));

    var Frm = Frame('#Main', 500 + 15, 400, function(){ return Bx; }, 'Frm', Data.Ttl, true);

    return Frm.attr('id', 'Frm_' + Data.ID);
  }

  function OneImageShow(Data)
  {
    var ImgSz = [400, 380],
        Bx = $('<div><img/><pre/><br/></div>');

    Bx.addClass('Blog Img')
      .children('img').attr({'src': Data.Info.ImgURL, 'title': '縮圖/原圖切換'})
                      .css({'maxWidth': ImgSz[0], 'maxHeight': ImgSz[1]})
                      .on('click', [ImgSz[0], ImgSz[1]], ImageSizeSwitch)
                      .on('click', function(){ $(this).closest('.Frm').find('> div:first > span:last > span:eq(2)').click(); })
                      .one('load', ContentPlace)
                      .end()
      .children('pre').html(TextToHTML(Data.Info.Str));

    var Frm = Frame('#Main', 500 + 15, 400, function(){ return Bx; }, 'Frm', Data.Ttl, true);

    Frm.attr('id', 'Frm_' + Data.ID);

    return Frm;

    function ContentPlace(Evt)
    {
      var This = $(this);

      if (This.width() > This.height())
      { This.after('<br/>'); }
    }
  }

  function OneImagesShow(Data)
  {
    var ImgSz = [400, 300],
        Bx = $('<div/>').addClass('Blog Imgs');

    for (var i in Data.Lst)
    {
      var V = Data.Lst[i],
          One = $('<div>' + '<img/>' + '<div><span>▲</span> <span/></div>' + '</div>');

      One.css({'minWidth': ImgSz[0]})
         .children('img').addClass('Unload')
                         .attr('src', V.TbnURL)
                         .data('TglSzURL', V.ImgURL)
                         .css({'maxWidth': ImgSz[0], 'maxHeight': ImgSz[1]})
                         .on('click', [ImgSz[0], ImgSz[1]], ImageSizeSwitch)
                         .on('load', function(){ $(this).removeClass('Unload'); })
                         .end()
         .find('> div:first > span:eq(1)').css({'maxWidth': ImgSz[0] - 10})
                                          .html(TextToHTML(V.Str))
                                          .end()
         .appendTo(Bx);

      if (V.Str.length === 0)
      { One.find('> div > span:first').text(''); }
    }

    var Frm = Frame('#Main', 500 + 15, 400, function(){ return Bx; }, 'Frm', Data.Ttl, true);

    Frm.attr('id', 'Frm_' + Data.ID);

    return Frm;
  }

  function ImageSizeSwitch(Evt)
  {
    Evt.stopPropagation();

    var This = $(Evt.currentTarget),
        Chk = [This.css('maxWidth'), This.css('maxHeight')],
        W = (Chk[0] === 'none' || Chk[0].length === 0) ? Evt.data[0] : '',
        H = (Chk[1] === 'none' || Chk[1].length === 0) ? Evt.data[1] : '',
        TglSzURL = This.data('TglSzURL');

    This.css({'maxWidth': W, 'maxHeight': H});

    if (typeof TglSzURL === 'string' && TglSzURL.length > 0)
    {
      var Src = This.attr('src');

      if (Src !== TglSzURL)
      {
        This.attr('src', TglSzURL)
            .data('TglSzURL', Src);
      }
    }
  }

  function PasswordAsk(ThenF, Ttl, TrgDOM)
  {
    if (typeof ThenF !== 'function')
    { return -1; }

    var ID = 'PswdFrm',
        Frm = $('#' + ID),
        PswdBx = $('#PswdBx'),
        TE = $(TrgDOM), // 'TE' = Triggered Element.
        TF = TE.closest('.Frm'), // 'TF' = Triggered Frame.
        R = null; // 'R' = Rectangle.

    if (Frm.length > 0)
    { R = RelatedFrameRectangle(TF, [Frm.width(), Frm.height()], [0, TE.offset().top - TF.offset().top]); }
    else
    {
      var Mn = $('#Main'); // 'Mn' = Main.

      Frm = Frame(Mn, 280, 100, function(){ return PswdBx; }, 'Frm', '輸入密碼', true);

      Frm.attr({'id': ID})
         .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

      if (TE.length === 0 || TF.length === 0)
      { R = [(Mn.width() - Frm.outerWidth()) / 2, 30]; }
      else
      { R = RelatedFrameRectangle(TF, [Frm.width(), Frm.height()], [0, TE.offset().top - TF.offset().top]); }
    }

    Ttl = (typeof Ttl === 'string' && Ttl.length > 0) ? ('請輸入「' + Ttl + '」的密碼:') : '請輸入密碼:';

    var Pswd = PswdBx.find('> div:first > span.Block:first').text(Ttl)
                                                 .end()
                     .children('input:button:first').off('click')
                                                    .on('click', PasswordSubmit)
                                                    .end()
                     .children('input:password:first').off('keypress')
                                                      .on('keypress', KeyCodeFilter)
                                                      .val('');

    FrameShow(Frm, R[0], R[1]);
    setTimeout(function(){ Pswd.focus(); }, 1000);

    return 0;

    function KeyCodeFilter(Evt)
    {
      if (Evt.keyCode !== 13)
      { return -1; }

      PasswordSubmit(Evt);
    }

    function PasswordSubmit(Evt)
    {
      var Pswd = $(Evt.currentTarget).siblings().addBack().filter('input:password:first').val();

      ThenF(Pswd);
    }
  }

  function ExtraInfoToggle(Evt)
  {
    $(Evt.currentTarget).next('span').toggle();
  }

  function CommentCountSet(Cnt)
  {
    var This = $(this),
        Btn = This.find('> span:last input:button:first');

    if (typeof Cnt !== 'number')
    { Cnt = 0; }

    if (Cnt > 0)
    { Btn.val('訪客回應 (' + Cnt.toString() + ')'); }
    else
    { Btn.val('訪客回應') }

    This.data('CmtCnt', Cnt);
  }

  function CommentCountGet()
  {
    var This = $(this),
        Cnt = This.data('CmtCnt');

    if (typeof Cnt === 'undefined')
    { Cnt = 0; }

    return Cnt;
  }
}

function BlogCommentListFrame(Evt)
{
  Evt.stopPropagation();

  var This = $(this),
      PF = This.closest('.Frm'), // 'PF' = Parent Frame.
      Ttl = PF.find('> div:first > span:first').text() + ' > 訪客留言',
      R = [], // 'R' = Rectangle.
      ID = PF.attr('id').replace('Frm_', ''),
      FrmID = 'BlogCmtLstFrm_' + ID,
      Frm = $('#' + FrmID);

  if (Frm.length > 0)
  {
    R = RelatedFrameRectangle(PF, [Frm.width(), Frm.height()]);

    FrameShow(Frm, R[0], R[1]);

    return 0;
  }

  Frm = Frame('#Main', 360, 320, BlogCommentListFrameSet, 'Frm', Ttl, true);
  R = RelatedFrameRectangle(PF, [Frm.width(), Frm.height()]);

  Frm.attr('id', FrmID);
  FrameShow(Frm, R[0], R[1]);

  return 0;

  function BlogCommentListFrameSet(Evt)
  {
    var Bx = $('#BlogCmtLstBx').clone().removeAttr('id').children(),
        LvBx = $('#LvBx').clone().removeAttr('id');

    Bx.last().children('input:button').on('click', CommentLeaveBoxToggle)
                                      .end()
             .append(LvBx)
             .children('div:last').css({'padding': 5, 'borderWidth': 1, 'borderRadius': 5})
                                  .hide()
                                  .find('input:button').on('click', BlogCommentLeave);

    if (typeof CO.GstNm === 'string') // set cached guest name from cookie.
    {
      Bx.last().find('input:text.Nm').val(CO.GstNm)
                                     .end()
               .find('input:checkbox.RmbMe').prop('checked', true);
    }

    ItemList(Bx.first(), 'service.php', -1, {'Cmd': 8, 'ID': ID}, OneBlogComment, []);

    return Bx;
  }

  function CommentLeaveBoxToggle(Evt)
  {
    var This = $(this),
        LvBx = This.next();

    if (LvBx.css('display') === 'none')
    {
      var Bx = This.parent().prev();

      This.val('取消留言');
      LvBx.show()
          .find('input:text:first').focus();
      Bx.parent().animate({'scrollTop': Bx.height()}, 0);
    }
    else
    {
      This.val('新留言');
      LvBx.hide();
    }
  }

  function BlogCommentLeave(Evt)
  {
    Evt.stopPropagation();

    var This = $(this),
        ID = This.closest('.Frm').attr('id').replace('BlogCmtLstFrm_', ''),
        InfoBx = This.parent(),
        MlJO = InfoBx.find('input:text.Ml'),
        CmtJO = InfoBx.find('textarea:first');

    var SndData = {'Cmd': 9, 'TgtID': ID, 'Nm': InfoBx.find('input:text.Nm').val().trim(),
                   'Ml': MlJO.val().trim(), 'Cmt': CmtJO.val().trim()};

    var RmbMe = InfoBx.find('input:checkbox.RmbMe').prop('checked'),
        ChkStr = '';

    if (typeof SndData.TgtID !== 'string' || SndData.TgtID.length === 0)
    {
      alert('出錯了!!!');

      return -1;
    }

    if (SndData.Nm.length === 0)
    {
      SndData.Nm = '匿名';

      $('#Nm').val(SndData.Nm);
    }

    if (RmbMe) // set cookie. 'GstNm' = Guest Name.
    {
      CookieSet('GstNm', SndData.Nm, CO.LfTm);

      CO.GstNm = SndData.Nm;
    }
    else
    {
      CookieSet('GstNm', SndData.Nm, CO.LfTm * -1);

      CO.GstNm = '';
    }

    if (SndData.Ml.length === 0)
    { ChkStr += "尚未填寫 E-Mail。\n"; }
    else if (!Z.Is.EMail(SndData.Ml))
    { ChkStr += "E-Mail 不符合標準格式。\n"; }

    if (SndData.Cmt.length === 0)
    { ChkStr += "尚未填寫任何留言。\n"; }
    else if (SndData.Cmt.length > 255)
    { ChkStr += "留言請勿超個 255 個字。\n"; }

    if (ChkStr.length > 0)
    {
      alert("請留意以下說明：\n" + ChkStr);
      return 0;
    }

    $.ajax(
      {
        'type': 'POST',
        'dataType': 'json',
        'timeout' : 20000,
        'url': 'service.php',
        'data': SndData,
        'beforeSend': function(JQXHR, Set){ This.get(0).Lock(); },
        'error' : function(JQXHR, TxtSt, ErrThr){ alert('出錯了!!!'); },
        'complete' : function(JQXHR, TxtSt){ This.get(0).Unlock(); },
        'success': function(Rtn, TxtSt, JQXHR)
          {
            if (Rtn.Index < 0)
            {
              alert(Rtn.Index + ', ' + Rtn.Message);

              return 0;
            }

            MlJO.add(CmtJO).val('');

            InfoBx.prev('input:button').click()
                                       .parent().prev().get(0).PageGet(0);

            var RF = $('#Frm_' + ID); // 'RF' = Related Frame.

            if (RF.length > 0)
            {
              var FO = RF.get(0);

              FO.CommentCountSet(FO.CommentCountGet() + 1);
            }
          }
      });
  }

  function OneBlogComment(Data, Idx)
  {
    var Bx = $('#OneMsgCmt').clone().removeAttr('id');

    Idx = parseInt(Idx, 10) + 1;

    Bx.children().first().text(Data.Nm)
                         .end()
                 .eq(1).html(TextToHTML(Data.Cmt))
                       .end()
                 .eq(2).text(Data.Dt)
                       .end()
                 .last().text('#' + Idx.toString());

    return Bx;
  }
}

/*
  Notice: this is a base frame. */
function MessageListFrame(Ttl)
{
  var ID = 'MsgBrdFrm',
      Frm = $('#' + ID),
      LstBx = $('#MsgLstBx'),
      Sz = [320, 520],
      BlgLstFrm = $('#BlgLstFrm'),
      TtlLstFrm = $('#TtlLstFrm');

  if (Frm.length > 0)
  {
    FrameShow(Frm);

    return 0;
  }

  Frm = Frame('#Main', Sz[0], Sz[1], MessageListFrameSet, 'Frm', Ttl, true);

  Frm.attr({'id': ID})
     .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

  FrameShow(Frm, BaseFrameXGet(Frm));

  return 0;

  function MessageListFrameSet()
  {
    ItemList(LstBx, '/service/message/list', 5, null, OneMessage, ['LstIdxTg', 'LstIdxTgDsb']);

    $('#NewMsgBtn').on('click', MessageLeaveFrame);
    $('#RldMsgLstBtn').on('click', MessageListReflash);
    LstBx.on('click', '.OneMsg > input:button:last-child', MessageChainListFrame);

    return LstBx.parent('div');
  }

  function OneMessage(Data, Idx)
  {
    var One = $('#OneMsg').clone().removeAttr('id');

    var ChnBtn = One.attr({'id': Data.ID})
                    .children().first().text(Data.Nm)
                                       .end()
                               .eq(1).html(TextToHTML(Data.Msg))
                                     .end()
                               .eq(2).text(Data.Dt)
                                     .end()
                               .last(); // 'ChnBtn' = Chain Button.

    if (!isNaN(Data.ChnCnt) && Data.ChnCnt > 0)
    {
      ChnBtn.val(Data.ChnCnt)
            .show();
    }
    else
    {
      ChnBtn.val(ChnBtn.attr('title'));
      One.on({'mouseenter': function(Evt){ $(this).children('input:button:last').toggle(); },
              'mouseleave': function(Evt){ $(this).children('input:button:last').toggle(); }});
    }

    return One;
  }

  function MessageLeaveFrame(Evt)
  {
    Evt.stopPropagation();

    var ID = 'MsgLvFrm',
        Frm = $('#' + ID),
        This = $(this),
        RltFrm = This.closest('.Frm'),
        LvBx = null,
        R = null;

    if (Frm.length > 0)
    {
      LvBx = Frm.find('.LvBx');
      R = RelatedFrameRectangle(RltFrm, [Frm.width(), Frm.height()]);

      LvBx.children('input:text.Ml, textarea').val('');

      FrameShow(Frm, R[0], R[1]);
    }
    else
    {
      LvBx = $('#LvBx').clone().removeAttr('id');
      Frm = Frame('#Main', 360, 200, function(){ return LvBx; }, 'Frm', '新留言', true);
      R = RelatedFrameRectangle(RltFrm, [Frm.width(), Frm.height()]);

      LvBx.children('input:button:last').on('click', MessageLeave);
      Frm.attr('id', ID)
         .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

      FrameShow(Frm, R[0], R[1]);
    }

    if (typeof CO.GstNm !== 'string' || CO.GstNm.length === 0) // set cached guest name from cookie.
    {
      LvBx.children('input:text:first').val('')
                                       .focus()
                                       .end()
          .find('> label > input:checkbox:first').prop('checked', false);
    }
    else
    {
      LvBx.children('input:text.Nm').val(CO.GstNm)
                                    .focus()
                                    .end()
          .find('> label > input:checkbox:first').prop('checked', true);
    }

    return 0;
  }

  function MessageListReflash()
  {
    var LstBxDOM = LstBx.get(0),
        MxLmt = parseInt($('#MxLmt').val(), 10);

    LstBxDOM.LimitSet(MxLmt);
    LstBxDOM.Recount(function(){ LstBxDOM.PageGet(0); });
  }

  function MessageChainListFrame(Evt)
  {
    var This = $(Evt.currentTarget),
        HdMsg = This.parent(), // 'HdMsg' = Head Message.
        ID = HdMsg.attr('id'),
        Frm = $('#Msg_' + ID),
        Ttl = HdMsg.children('div:first').text() + ' 的留言串',
        PF = This.closest('.Frm'), // 'PF' = Parent Frame.
        R;

    if (Frm.length > 0)
    {
      R = RelatedFrameRectangle(PF, [Frm.width(), Frm.height()], [0, This.offset().top - PF.offset().top]);

      FrameShow(Frm, R[0], R[1]);

      return 0;
    }

    Frm = Frame('#Main', 360, 320, ChainFrameSet, 'Frm', Ttl, true);
    R = RelatedFrameRectangle(PF, [Frm.width(), Frm.height()], [0, This.offset().top - PF.offset().top]);

    Frm.attr('id', 'Msg_' + ID);

    FrameShow(Frm, R[0], R[1], function(){ Frm.find('> div:first > span:last > span:eq(1)').click().click(); }); // 2 times 'click' is necessary.

    Frm.get(0).ChainReload = function(){ Frm.find('.MsgChnBx > div:eq(1)').get(0).PageGet(0); };

    return 0;

    function ChainFrameSet()
    {
      var MsgChnBx = $('#MsgChnBx').clone().removeAttr('id'),
          LvBx = $('#LvBx').clone().removeAttr('id');

      MsgChnBx.children('div:first').replaceWith(HdMsg.clone().removeAttr('id'))
                                    .end()
              .children('div:first').children('input:button:last').remove()
                                                                  .end()
                                    .end()
              .children('div:last').append(LvBx)
                                   .children('input:button:first').on('click', MessageLeaveBoxToggle)
                                                                  .end()
                                   .children('div:first').hide()
                                                         .css({'padding': 5, 'borderWidth': 1, 'borderRadius': 5})
                                                         .children('input:button:last').on('click', MessageLeave);

      ItemList(MsgChnBx.children('div:eq(1)'), '/service/message/chainlist', -1, {'ID': ID}, OneChain, []);

      return MsgChnBx;
    }

    function MessageLeaveBoxToggle(Evt)
    {
      var This = $(this),
          LvBx = This.next('div');

      if (LvBx.css('display') === 'none')
      {
        var Bx = This.parent().parent();

        This.val('取消留言');
        LvBx.show()
            .children('input:text:first').focus();
        Bx.parent().animate({'scrollTop': Bx.height()}, 0);

        if (typeof CO.GstNm === 'string' && CO.GstNm.length > 0)
        {
          LvBx.children('input:text:first').val(CO.GstNm)
                                           .end()
              .find('> label:first > input:checkbox:first').prop('checked', true);
        }
      }
      else
      {
        This.val('新留言');
        LvBx.hide()
            .children('input:text').val('')
                                   .end()
            .children('textarea').val('');
      }
    }

    function OneChain(Data, Idx)
    {
      var One = $('#OneMsgCmt').clone().removeAttr('id');

      Idx = parseInt(Idx, 10) + 1;

      One.attr({'id': Data.ID})
         .children().first().text(Data.Nm)
                            .end()
                    .eq(1).html(TextToHTML(Data.Msg))
                          .end()
                    .eq(2).text(Data.Dt)
                          .end()
                    .eq(3).text('#' + Idx.toString());

      return One;
    }
  }

  function MessageLeave(Evt)
  {
    var This = $(this),
        TgtID = This.closest('.Frm').attr('id').replace(/^Msg_|^MsgLvFrm/, '');

    var SndData = {'Cmd': 4,
                   'Nm': This.prevAll('input:text.Nm:first').val().trim(),
                   'Ml': This.prevAll('input:text.Ml:first').val().trim(),
                   'Msg': This.prevAll('textarea.Msg:first').val().trim()};

    var RmbMe = This.prev('label').children('input:checkbox').prop('checked'),
        ChkStr = '';

    if (SndData.Nm.length === 0)
    { SndData.Nm = '匿名'; }

    if (RmbMe) // set cookie. 'GstNm' = Guest Name.
    {
      CookieSet('GstNm', SndData.Nm, CO.LfTm);
      CO.GstNm = SndData.Nm;
    }
    else
    {
      CookieSet('GstNm', SndData.Nm, CO.LfTm * -1);
      CO.GstNm = '';
    }

    if (SndData.Ml.length === 0)
    { ChkStr += "尚未填寫 E-Mail。\n"; }
    else if (!Z.Is.EMail(SndData.Ml))
    { ChkStr += "E-Mail 不符合標準格式。\n"; }

    if (SndData.Msg.length === 0)
    { ChkStr += "尚未填寫任何留言。\n"; }
    else if (SndData.Msg.length > 255)
    { ChkStr += "留言請勿超個 255 個字。\n"; }

    if (ChkStr.length > 0)
    {
      alert("請留意以下說明：\n" + ChkStr);

      return 0;
    }

    if (typeof TgtID === 'string' && TgtID.length > 0)
    { SndData.Tgt = TgtID; }

    $.ajax(
      {
        'type': 'POST',
        'dataType': 'json',
        'timeout' : 20000,
        'url': 'service.php',
        'data': SndData,
        'beforeSend': function(JQXHR, Set){ This.get(0).Lock(); },
        'error' : function(JQXHR, TxtSt, ErrThr){ alert('出錯了!!!'); },
        'complete' : function(JQXHR, TxtSt){ This.get(0).Unlock(); },
        'success': function(Rtn, TxtSt, JQXHR)
          {
            if (Rtn.Index < 0)
            {
              alert(Rtn.Index + ', ' + Rtn.Message);

              return 0;
            }

            var ChnFrm = $('#Msg_' + TgtID);

            if (ChnFrm.length > 0)
            { ChnFrm.get(0).ChainReload(); }

            This.parent().prev('input:button').click();
            $('#RldMsgLstBtn').click();

            FrameHide($('#MsgLvFrm'));
          }
      });
  }
}

/*
  Notice: this is a base frame. */
function TutorialListFrame(Ttl)
{
  var ID = 'TtlLstFrm',
      Frm = $('#' + ID);

  if (Frm.length > 0)
  {
    FrameShow(Frm);
    return 0;
  }

  Frm = Frame('#Main', 240, 240, TutorialListSet, 'Frm', Ttl, true);

  Frm.attr({'id': ID})
     .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

  FrameShow(Frm, BaseFrameXGet(Frm));

  return 0;

  function TutorialListSet()
  {
    var Bx = $('<div/>');

    ItemList(Bx, 'service.php', -1, {'Cmd': 10}, OneItem, true);
    Bx.on('click', '> div', OneTextReadFrameSet);

    return Bx;

    function OneItem(Data, Idx)
    {
      var Itm = $('<div/>');

      Itm.addClass('OneItm OneTtrl')
         .data('URL', 'text_read.php?Fl=' + encodeURIComponent(Data))
         .attr('name', 'Tutorial_' + Idx.toString())
         .text(Data);

      return Itm;
    }

    function OneTextReadFrameSet(Evt)
    {
      var This = $(Evt.currentTarget),
          Ttl = This.text(),
          URL = This.data('URL'),
          Sz = [640, 480],
          ID = This.attr('name'),
          Frm = $('#' + ID);

      if (Frm.length === 0)
      {
        Frm = Frame('#Main', Sz[0], Sz[1], TextReadFrameSet, 'Frm', Ttl, true);

        Frm.get(0).ActionExtend('SizeChange', TextReadFrameResize);
      }

      FrameShow(Frm, BaseFrameXGet(Frm));

      return;

      function TextReadFrameSet()
      {
        var Bx = $('<iframe/>');

        Bx.attr('src', URL)
          .css({'width': Sz[0], 'height': Sz[1] - 1, 'border': '0px'});

        return Bx;
      }

      function TextReadFrameResize(FrmDOM)
      {
        var SzBx = Frm.children('div:eq(1)');

        Frm.find('iframe:first').css({'width': SzBx.width(), 'height': SzBx.height() - 1});
      }
    }
  }
}

function CustomFrame(Ttl)
{
  var ID = 'CstURLFrm',
      Frm = $('#' + ID),
      Sz = [320, 100];

  if (Frm.length > 0)
  {
    FrameShow(Frm, null, null, function(){ Frm.find('> div:eq(1) > input:text:first').focus(); });
    return 0;
  }

  Frm = Frame('#Main', Sz[0], Sz[1], CustomURLFrameSet, 'Frm', Ttl, true);

  Frm.attr({'id': ID})
     .get(0).ActionExtend('CloseButtonClick', function(FrmDOM){ FrameHide(Frm); });

  var Bs = $('#Main');

  var Txt = Frm.children('div:eq(1)').css('textAlign', 'center')
                                     .children('input:text:first');

  FrameShow(Frm, (Bs.width() - Frm.outerWidth()) / 2, Bs.offset().top + 5, function(){ Txt.focus(); });

  return 0;

  function CustomURLFrameSet()
  {
    var Ctn = $('<input type="text"/><br/><span/><br/><input type="button"/>');

    Ctn.filter('span:first').text('(部分網站會禁止其它網站的內嵌引用。)')
                            .css('color', '#ff0000')
                            .end()
       .filter('input').css('marginTop', 10)
                       .filter(':text:first').on('keypress', KeyboardTrigger)
                                             .end()
                       .filter(':button:first').val('確定')
                                               .addClass('Btn0')
                                               .on('click', OneCustomFrame);

    return Ctn;
  }

  function KeyboardTrigger(Evt)
  {
    if (Evt.keyCode === 13)
    { $(this).nextAll('input:button:first').click(); }
  }

  function OneCustomFrame(Evt)
  {
    var OneSz = [640, 480],
        URL = $(this).prevAll('input:text').val();

    if (URL.length === 0)
    { return 0; }

    var URLHd = URL.substr(0, 7);

    if (URLHd !== 'http://' && URLHd !== 'https:/')
    { URL = 'http://' + URL; }

    FrameHide(Frm);

    var Bs = $('#Main'),
        CstFrm = Frame('#Main', OneSz[0], OneSz[1], OneCustomFrameSet, 'Frm', URL, true);

    CstFrm.get(0).ActionExtend('SizeChange', OneCustomFrameResize);

    FrameShow(CstFrm, (Bs.width() - CstFrm.outerWidth()) / 2, Bs.offset().top + 5);

    return 0;

    function OneCustomFrameSet()
    {
      var Bx = $('<iframe/>');

      Bx.attr('src', URL)
        .css({'width': OneSz[0], 'height': OneSz[1], 'border': '0px'});

      return Bx;
    }

    function OneCustomFrameResize(FrmDOM)
    {
      var Bx = CstFrm.children('div:eq(1)');

      Bx.children('iframe').width(Bx.width())
                           .height(Bx.height());
    }
  }
}

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

function ArtCornerSet()
{
  var AtCnr = $('#AtCnr'),
      AtCnrChk = $('#AtCnrChk');

  AtCnrChk.on({'mouseenter': function(Evt){ AtCnr.children().show(); },
               'mouseleave': function(Evt){ AtCnr.children().hide(); }});

  RandomOne();

  return AtCnr;

  function RandomOne()
  {
    $.ajax(
      {
        'type': 'POST',
        'dataType': 'json',
        'timeout' : 20000,
        'url': 'service.php',
        'data': {'Cmd': 6},
        'success': function(Data, TxtSt, JQXHR)
          {
            if (Data.Index < 0)
            { return -1; }

            AtCnr.css('backgroundImage', 'url("' + Data.Extend.ImgURL + '")')
                 .children().text(Data.Extend.Ttl + "\n" + Data.Extend.Dt.substr(0, 10) + "\nby " + Data.Extend.Atr);
          }
      });
  }
}

/* for list box using, one by one fade in items of list. */
function OneByOneFadeIn (Cnt)
{
  var Itms = $(this).find('> *:not(:visible)'),
      i = 0;

  OneShow();

  return;

  function OneShow ()
  {
    if (i > Cnt)
    { return; }

    Itms.eq(i).fadeIn();

    i++;

    setTimeout(OneShow, 300);
  }
}