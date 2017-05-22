<?php
header('Content-Type: text/html; charset=utf-8');

require '../global.php';

$IsLgn = false;

if (isset($_SESSION[SSN_ADMIN_PSWD]))
{
  if ($_SESSION[SSN_ADMIN_PSWD] == ADMIN_PSWD)
    $IsLgn = true;
  else
    unset($_SESSION[SSN_ADMIN_PSWD]);
}

$IsErrHnt = DEV || (isset($_SESSION[SSN_ERR_HNT]) && $_SESSION[SSN_ERR_HNT]);

$FdPth = DAT_PTH . 'feed.xml';
$FdLstDt = is_file($FdPth) ? date('Y-m-d H:i:s', filemtime($FdPth)) : '????-??-?? ??:??:??';
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title><?= WEBSITE; ?> - 管理員</title>
    <meta http-equiv='content-type' content='text/html; charset=utf-8'/>
    <meta name='description' content='我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。'/>
    <meta name='keywords' content='天空, 空域, RZ, 個人網站'/>
    <meta name='author' content='RZ Fang'/>
    <link rel='icon' href='favicon.ico' type='image/ico'/>
    <link rel='stylesheet' type='text/css' href='resource/base.css'/>
    <style type='text/css'>
    <!--
      .TbBx > ul > li { padding: 2px; }
      .TbBx > .Tb { padding: 5px; }
      .TbBx .PckTb { font-weight: bold; }
      .TbBx > ul > li,
      .TbBx > .Tb
        { border: 1px solid #808080; }

      .Tab:hover { background-color: #c0c0c0; }
      .Icon0 { max-width: 20px; max-height: 20px; vertical-align: middle; }
      .Icon1 { max-width: 28px; max-height: 28px; vertical-align: middle; }
      .Icon2 { max-width: 36px; max-height: 36px; vertical-align: middle; }
      .LstIdxTg { display: inline-block; min-width: 20px; margin: 0px 2px; border: 1px solid; text-align: center;
                  cursor: pointer; }
      .LstIdxTg:hover { color: #ff0000; }
      .LstIdxTgDsb { display: inline-block; min-width: 20px; margin: 0px 2px; border: 1px solid; text-align: center;
                     color: #808080; background-color: #c0c0c0; }

      .OneBlog { margin: 5px 0px; }
      .OneBlog > table { display: inline-block; vertical-align: top; }
      .OneBlog > textarea { width: 250px; height: 85px; vertical-align: top; }

      .OneCmt { margin: 5px 0px 0px 20px; padding: 5px; }
      .OneCmt > * { vertical-align: top; }
      .OneCmt > pre { display: inline-block; width: 400px; min-height: 50px; margin: 0px; padding: 5px;
                      border-width: 1px; border-radius: 5px; }

      .OneMsg { margin: 8px 0px; }
      .OneMsg td:nth-child(odd) { border-right-width: 1px; }

      .OneBlog:hover,
      .OneCmt:hover,
      .OneMsg:hover,
      .OneTg:hover,
      .OneWds:hover
        { background-color: #c0e0ff; }

      .TgChkBx > label { display: inline-block; white-space: nowrap; }

      .OneAbmEdtImg { display: inline-block; margin: 5px; padding: 5px; border-width: 1px; border-radius: 5px; text-align: center; }
      .OneAbmEdtImg > div { text-align: left; }
      .OneAbmEdtImg > img { max-width: 320px; max-height: 240px; }

      #BlogUpldBx td,
      #BlogUpldBx th
        { padding: 5px; border: 1px solid #808080; text-align: left; vertical-align: top; }

      #SysBx > span.Block { padding: 5px; border: 1px solid #808080; border-radius: 5px; }
      #AtCnrMkBx table td:last-child { text-align: left; }
    -->
    </style>
    <script type='text/javascript' src='resource/jquery.min.js'></script>
    <script type='text/javascript' src='resource/api2.min.js'></script>
    <script language='javascript' src='https://cdn.jsdelivr.net/riot/3.4/riot+compiler.min.js'></script>
    <script type='riot/tag' src='resource/admin.tag'></script>
    <script type='text/javascript'>
    <!--
<?php if (!$IsLgn){ ?>

      $(function()
        {
          $('#LgnBtn').prev().focus();
        });

      function Login(Evt)
      {
        if (typeof Evt !== 'undefined' && Evt.keyCode != 13)
        { return 0; }

        var Pswd = $('#Pswd').val();

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 102, 'Pswd': Pswd},
            'success': function(Rtn, TxtSt, JQXHR)
              {
                alert(Rtn.Message);

                if (Rtn.Index == 0)
                { PageTurn(''); }
              }
          });
      }

<?php } else{ ?>

      $(function()
        {
          TabBox('#TbBx', '#TbBx > .Tb', 0, DataTabSwitch); // main tab switch.
          TabBox('#BlogTb', '#BlogTb > .Tb', 0, BlogTabSwitch);
          BlogUploadSet();
          FeedManageSet();

          riot.mixin('Z.RM', Z.RM);
          riot.mount('tags');
          riot.mount('blogs');

          GoodWordsMakeSet();
          ArtCornerMakeSet();
          CacheImageManageSet();

          $('#FlSttBx > input:button').click(SystemUsedView);
        });

      function Logout()
      {
        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 101, 'Lgt': 1},
            'success': function(Rtn, TxtSt, JQXHR)
              {
                if (Rtn.Index == 0)
                { PageTurn(''); }
                else
                { alert(Rtn.Message); }
              }
          });
      }

      function DataTabSwitch(OO, NO)
      {
        switch (NO.index())
        {
          case 1:
            MessageList($('#MsgTb'));
            break;

          case 2:
            GoodWordsList($('#GdWdsLstBx'));
            break;
        }
      }

      function BlogTabSwitch(OO, NO)
      {
        var Idx = NO.index(),
            TbBx = $('#BlogTb > .Tb:eq(' + Idx + ') > div:first-child');

        if (Idx == 2)
        { BlogList(TbBx); }
      }

      function BlogList(JO)
      {
        if (JO.children().length === 0)
        {
          ItemList(JO, 'service.php', 7, {'Cmd': 103}, OneBlog, ['GJ']);

          JO.on('click', '.OneBlog > span:nth-child(5) > input:nth-child(1)', OneBlogCreate)
            .on('click', '.OneBlog > span:nth-child(5) > input:nth-child(2)', OneBlogUpdate)
            .on('click', '.OneBlog > span:nth-child(5) > input:nth-child(4)', OneBlogDelete)
            .on('click', '.OneBlog > span:nth-child(5) > input:nth-child(6)', BlogCommentList)
            .on('click', '.OneBlog > div > .OneCmt > input', CommentDelete);
        }

        return 0;

        function OneBlog(Data)
        {
          var One = $('#OneBlog').clone().removeAttr('id');

          One.children('textarea:first').val(Data.Smry)
                                        .end()
             .children('table').first().find('td:odd').first().children('input:text').val(Data.Fl)
                                                                                     .end()
                                                              .end()
                                                      .eq(1).text(Data.ID)
                                                            .end()
                                                      .end()
                                       .end()
                               .eq(1).find('td:odd > input:text').first().val(Data.Ttl)
                                                                         .end()
                                                                 .eq(1).val(Data.Dt.length > 0 ? Data.Dt : '00:00:00')
                                                                       .end()
                                                                 .eq(2).val(Data.Pswd);

          switch (Data.Tp)
          {
            case 'image':
              One.find('> table:first tr:eq(2) > td option:eq(1)').prop('selected', true);
              break;

            case 'images':
              One.find('> table:first tr:eq(2) > td option:eq(2)').prop('selected', true);
              break;

            case 'html':
              One.find('> table:first tr:eq(2) > td option:eq(3)').prop('selected', true);
              break;

            case 'text':
            default:
          }

          var TgChk = $('#TgChkBx').clone().removeAttr('id');

          One.children('span:first').replaceWith(TgChk);

          TgChk.find('input:checkbox').each(function(Idx)
            {
              if (Data.Tg.length === 0)
              { return 0; }

              var This = $(this);

              for (var i = 0; i < Data.Tg.length; i++)
              {
                if ($(this).val() === Data.Tg[i].ID)
                {
                  This.prop('checked', true);

                  break;
                }
              }
            });

          var BtnA = One.find('> span:last > input:button');

          if (Data.CmtCnt > 0)
          { BtnA.eq(3).show(); }
          else
          { BtnA.eq(3).hide(); }

          if (Data.ID.length > 0)
          {
            BtnA.first().hide()
                        .end()
                .filter(':eq(1), :eq(2)').show();
          }

          return One;
        }

        function OneBlogUpdate(Evt)
        {
          var Bx = $(Evt.currentTarget).closest('.OneBlog'),
              ID = Bx.find('> table:first tr:eq(1) > td:eq(1)').text(),
              Ttl = Bx.find('> table:eq(1) tr:first > td:eq(1) > input:text').val(),
              Dt = Bx.find('> table:eq(1) tr:eq(1) > td:eq(1) > input:text').val(),
              Pswd = Bx.find('> table:eq(1) tr:eq(2) > td:eq(1) > input:text').val(),
              Tp = Bx.find('> table:first tr:eq(2) > td:eq(1) > select > option:selected').val(),
              Smry = Trim(Bx.children('textarea:first').val()),
              TgIDA = [],
              ChkStr = '';

          Bx.find('> span:first > label > input:checkbox:checked').each(function(Idx){ TgIDA.push($(this).val()); });

          if (Ttl.length === 0)
          { ChkStr += "標題不能為空。\n"; }
          if (Dt.length === 0)
          { ChkStr += "日期不能為空。\n"; }
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
              'data': {'Cmd': 105, 'ID': ID, 'Ttl': Ttl, 'Dt': Dt, 'Tp': Tp, 'Pswd': Pswd, 'Smry': Smry, 'TgIDA': TgIDA},
              'success': function(Rtn, TxtSt, JQXHR){ alert(Rtn.Message); }
            });
        }

        function OneBlogDelete(Evt)
        {
          var This = $(Evt.currentTarget),
              Bx = This.closest('.OneBlog'),
              ID = Bx.find('> table:first tr:eq(1) > td:eq(1)').text();

          if (ID.length < 13)
          {
            alert('找不到正確的 Blog ID。');

            return 0;
          }

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'JSON',
              'timeout': 20000,
              'url': 'service.php',
              'data': {'Cmd': 110, 'ID': ID},
              'success': function(Rtn, TxtSt, JQXHR)
                {
                  if (Rtn.Index < 0)
                  {
                    alert(Rtn.Message);

                    return 0;
                  }

                  Bx.find('> table:first tr:eq(1) > td:eq(1)').text('')
                                                              .end()
                    .find('> span:last > input:button').not(':eq(3)').toggle()
                                                                     .end()
                                                       .eq(3).hide();

                  alert(Rtn.Message);
                }
            });
        }

        function OneBlogCreate(Evt)
        {
          var This = $(Evt.currentTarget),
              Bx = This.closest('.OneBlog'),
              Fl = Bx.find('> table:first tr:first > td:eq(1) > input:text').val(),
              Ttl = Bx.find('> table:eq(1) tr:first > td:eq(1) > input:text').val(),
              Dt = Bx.find('> table:eq(1) tr:eq(1) > td:eq(1) > input:text').val(),
              Pswd = Bx.find('> table:eq(1) tr:eq(2) > td:eq(1) > input:text').val(),
              Tp = Bx.find('> table:first tr:eq(2) > td:eq(1) > select > option:selected').val(),
              Smry = Trim(Bx.children('textarea:first').val()),
              TgIDA = [],
              ChkStr = '';

          Bx.find('> span:first > label > input:checkbox:checked').each(function(Idx){ TgIDA.push($(this).val()); });

          if (Ttl.length === 0)
          { ChkStr += "尚未設定標題。\n"; }
          if (Dt.length === 0)
          { ChkStr += "尚未設定日期。\n"; }
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
              'data': {'Cmd': 104, 'Fl': Fl, 'Ttl': Ttl, 'Dt': Dt, 'Tp': Tp, 'Pswd': Pswd, 'Smry': Smry, 'TgIDA': TgIDA},
              'success': function(Rtn, TxtSt, JQXHR)
                {
                  if (Rtn.Index < 0)
                  {
                    alert(Rtn.Message);

                    return 0;
                  }

                  Bx.find('> table:first tr:eq(1) > td:eq(1)').text(Rtn.Extend)
                                                              .end()
                    .find('> span:last > input:button').not(':eq(3)').toggle();

                  alert(Rtn.Message);
                }
            });
        }
      }

      function BlogCommentList(Evt)
      {
        var This = $(this),
            Bx = This.closest('.OneBlog'),
            ID = Bx.find('> table:first tr:eq(1) > td:eq(1)').text(),
            Lst = Bx.children('div:first');

        if (Lst.css('display') !== 'none')
        {
          Lst.hide();

          return 0;
        }

        Lst.show();

        if (typeof Lst.get(0).PageGet !== 'function')
        { ItemList(Lst, 'service.php', -1, {'Cmd': 8, 'ID': ID}, OneComment, []); }

        return 0;

        function OneComment(Data)
        {
          var One = $('#OneCmt').clone().attr('id', Data.ID);

          One.children('span:first').children('span:first').text(Data.Nm)
                                                           .end()
                                    .children('span:eq(1)').text(Data.Dt)
                                                           .end()
                                    .end()
             .children('pre').text(Data.Cmt);

          return One;
        }
      }

      function CommentDelete(Evt)
      {
        var This = $(this),
            ID = This.parent().attr('id');

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 109, 'ID': ID},
            'success': function(Rtn, TxtSt, JQXHR)
              {
                if (Rtn.Index < 0)
                {
                  alert(Rtn.Message);

                  return 0;
                }

                var Lst = This.parent().parent();

                This.parent().remove();

                if (Lst.children('.OneCmt').length === 0)
                {
                  Lst.hide();
                  Lst.prev('span:first').children('input:button:last').hide();
                }

                alert(Rtn.Message);
              }
          });
      }

      function MessageList(JO)
      {
        if (JO.children().length === 0)
        { ItemList(JO, 'service.php', 8, {'Cmd': 106}, OneMsg, ['GJ']); }

        return 0;

        function OneMsg(Data)
        {
          var One = $('#OneMsg').clone().removeAttr('id');

          One.find('> span td:odd').first().text(Data.ID)
                                           .end()
                                   .eq(1).text(Data.Dt)
                                         .end()
                                   .eq(2).text(Data.Tgt)
                                         .end()
                                   .end()
             .children('textarea').val(Data.Msg)
                                  .end()
             .children('input:button:first').click(OneMessageDelete);

          if (Data.Tgt === null || Data.Tgt.length === 0)
          {
            One.append('<span/>')
               .children('span:last').css('verticalAlign', 'top')
                                     .text('(刪除整個留言串)');
          }

          return One;
        }

        function OneMessageDelete(Evt)
        {
          var This = $(Evt.currentTarget),
              ID = This.siblings('span:first').find('td:eq(1)').text();

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 107, 'ID': ID},
              'success': function(Rtn, TxtSt, JQXHR)
                {
                  JO.get(0).PageGet();

                  alert(Rtn.Message);
                }
            });
        }
      }

      function GoodWordsList(JO)
      {
        if (JO.children().length === 0)
        { ItemList(JO, 'service.php', 8, {'Cmd': 119}, OneWds, ['GJ']); }

        JO.on('click', '> .OneWds input:button:even', null, OneGoodWordsUpdateSet)
          .on('click', '> .OneWds input:button:odd', null, OneGoodWordsDeleteSet);

        return 0;

        function OneWds(Data)
        {
          var One = $('#OneWds').clone().removeAttr('id');

          One.children('textarea').val(Data.Wds)
                                  .end()
             .children('div').children('span').text(Data.ID);

          return One;
        }

        function OneGoodWordsUpdateSet(Evt)
        {
          var This = $(this),
              ID = This.prevAll('span:first').text(),
              Wds = This.parent().prev('textarea').val();

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 122, 'ID': ID, 'Wds': Wds},
              'success': function(Rtn, TxtSt, JQXHR){ alert(Rtn.Message); }
            });
        }

        function OneGoodWordsDeleteSet(Evt)
        {
          var This = $(this),
              ID = This.prevAll('span:first').text();

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 121, 'ID': ID},
              'success': function(Rtn, TxtSt, JQXHR)
                {
                  alert(Rtn.Message);

                  if (Rtn.Index == 0)
                  { JO.get(0).PageGet(); }
                }
            });
        }
      }

      function GoodWordsMakeSet()
      {
        $('#GdWdsMkBx > input:button:first').on('click', function(Evt)
          {
            var This = $(this),
                Txt = This.prev(),
                Wds = Txt.val();

            if (Trim(Wds) === '')
            {
              alert('尚未填寫佳言。');
              return -1;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 120, 'Wds': Wds},
                'success': function(Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index == 0)
                    {
                      Txt.val('');
                      This.parent().nextAll('div#GdWdsLstBx').get(0).PageGet();
                    }
                  }
              });
          });
      }

      function ArtCornerMakeSet()
      {
        var AtCnrMkBx = $('#AtCnrMkBx');

        AtCnrMkBx.find('tr:eq(3) input').filter(':text').val(NowTimeStamp())
                                                        .end()
                                        .filter(':button').on('click', function(Evt){ $(Evt.currentTarget).prev().val(NowTimeStamp); })
                                                          .end()
                                        .end()
                 .find('tr:eq(4) input:file').on('change', Preview)
                                             .end()
                 .children('input:button:last').on('click', Pack);

        return 0;

        function NowTimeStamp()
        {
          var Dt = new Date();

          return Second2Datetime(Dt.getTime() / 1000, 0).substr(0, 19);
        }

        function Preview(Evt)
        {
          var This = $(this),
              FN = This.val(),
              Ext = FN.substr(FN.lastIndexOf('.')).toLowerCase(),
              Fl = Evt.currentTarget.files[0];

          if (Ext !== '.jpg' && Ext !== '.png' && Fl.type !== 'image/jpeg' && Fl.type !== 'image/png')
          {
            alert('僅支援 JPEG 或是 PNG 格式的圖片。');

            This.val('');

            return -1;
          }

          if (Fl.size > 1048576)
          {
            alert('檔案超過 1mb，太大了。');

            This.val('');

            return -2;
          }

          var FR = new FileReader();

          FR.onloadend = function(){ AtCnrMkBx.children('img').attr('src', this.result); };
          FR.readAsDataURL(Fl);
        }

        function Pack(Evt)
        {
          var IA = AtCnrMkBx.find('td > input:text'),
              Pgs = AtCnrMkBx.children('progress').val(0),
              Ttl = Trim(IA.first().val()),
              Atr = Trim(IA.eq(1).val()),
              Ml = Trim(IA.eq(2).val()),
              Dt = Trim(IA.eq(3).val()),
              Fl = AtCnrMkBx.find('td > input:file'),
              Cmt = Trim(AtCnrMkBx.find('td > textarea').val());
              Hnt = '';

          if (Atr.length === 0)
          { Hnt += "尚未填寫作者。\n"; }
          if (Ml.length === 0)
          { Hnt += "尚未填寫 E-Mail。\n"; }
          else if (!Z.Is.EMail(Ml))
          { Hnt += "E-Mail 格式不正確。\n";  }
          if (Dt.length === 0)
          { Hnt += "尚未填寫時間。\n"; }
          else if (!IsTimeStamp(Dt))
          { Hnt += "日期格式不正確。\n"; }
          if (Fl.val().length === 0)
          { Hnt += "尚未選擇圖檔。\n"; }
          if (Cmt.length > 256)
          { Hnt += "註解超過最大值 256 個字。\n"; }

          if (Hnt.length > 0)
          {
            alert(Hnt);

            return 0;
          }

          var FmData = new FormData();

          FmData.append('Cmd', 108);
          FmData.append('Ttl', Ttl);
          FmData.append('Atr', Atr);
          FmData.append('Ml', Ml);
          FmData.append('Dt', Dt);
          FmData.append('Cmt', Cmt);
          FmData.append('Img', Fl.get(0).files[0]);

          var XHR = new XMLHttpRequest();

          XHR.onreadystatechange = Then;
          XHR.upload.onprogress = function(Evt){ Pgs.val(Evt.loaded / Evt.total * 100); };
          XHR.open('POST', 'service.php');
          XHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // to use AJAX way.
          XHR.send(FmData);

          return 0;

          function Then()
          {
            if (this.readyState !== 4)
            { return 0; }

            if (this.status !== 200)
            {
              alert('上載發生錯誤。');
              return 0;
            }

            var Data = $.parseJSON(this.responseText);

            alert(Data.Message);

            if (Data.Index == 0)
            {
              Fl.val('');
              AtCnrMkBx.children('img').attr('src', '#');
              Pgs.val(0);
            }
          }
        }
      }

      function CacheImageManageSet()
      {
        var CchImgBx = $('#CchImgBx');

        CchImgBx.data('Scd', 0)
                .children('input:text').blur(DatetimeCheck)
                                       .end()
                .children('select').change(DatetimeCheck)
                                   .change()
                                   .end()
                .children('input:button').click(Clear);

        return 0;

        function DatetimeCheck(Evt)
        {
          var This = $(this),
              Nbr = parseInt(This.siblings().addBack().filter('input:text:first').val(), 10),
              Unt = parseInt(This.siblings().addBack().filter('select:first').children('option:selected').val(), 10),
              Dt = new Date(),
              Scd = 0;

          if (isNaN(Nbr) || Nbr <= 0)
          {
            CchImgBx.children('span').text('???');

            return -1;
          }

          Scd = Nbr * Unt;

          CchImgBx.data('Scd', Scd)
                  .children('span').text(Second2Datetime((Dt.getTime() - (Scd * 1000)) / 1000, 1));

          return 0;
        }

        function Clear(Evt)
        {
          var This = $(this),
              Nbr = parseInt(This.siblings().addBack().filter('input:text:first').val(), 10);

          if (isNaN(Nbr) || Nbr < 1)
          {
            alert("參數錯誤。\n請重新設定日期。");
            return;
          }

          CchImgBx.children('select').change();

          var Scd = CchImgBx.data('Scd');

          if (typeof Scd !== 'number' || Scd < 1)
          {
            alert("參數錯誤。\n請重新設定日期。");
            return;
          }

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 111, 'Scd': Scd},
              'success': function(Rtn, TxtSt, JQXHR){ alert(Rtn.Message + "\n共 " + Rtn.Extend + ' 個檔案被刪除。'); }
            });
        }
      }

      function SystemUsedView(Evt)
      {
        var Bx = $(this).nextAll('div:first').empty();

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 112},
            'success': function(Rtn, TxtSt, JQXHR)
              {
                if (Rtn.Index < 0)
                {
                  alert(Rtn.Message);

                  return -1;
                }

                var TBdy = $('<table><tbody/></table>').appendTo(Bx)
                                                       .children();

                for (var i in Rtn.Extend)
                {
                  var Row = $('<tr><td/><td/></tr>');

                  Row.appendTo(TBdy)
                     .children().first().text(Rtn.Extend[i][0])
                                        .end()
                                .eq(1).text(FileSizeNormalize(Rtn.Extend[i][1]));
                }
              }
          });
      }

      function BlogUploadSet()
      {
        var Btn = $('#BlogUpldBtn');

        Btn.on('click', FileUpload);

        return 0;

        function FileUpload(Evt)
        {
          var Fl = $('#BlogFl'),
              Pgs = Btn.next('progress');

          if (Fl.val().length === 0)
          {
            alert('尚未選擇網誌檔案。');

            return -1;
          }

          var FlTp = Fl.get(0).files[0].type;

          if (FlTp !== 'text/plain' && FlTp !== 'application/x-tar')
          {
            alert("檔案格式不符。\n請參考左側檔案格式說明表。");

            return -2;
          }

          var FmData = new FormData(),
              XHR = new XMLHttpRequest();

          FmData.append('Cmd', 117);
          FmData.append('Fl', Fl.get(0).files[0]);

          XHR.onreadystatechange = Then;
          XHR.upload.onprogress = function(Evt){ Pgs.val(Evt.loaded / Evt.total * 100); };
          XHR.open('POST', 'service.php');
          XHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // to use AJAX way.
          XHR.send(FmData);

          Btn.add(Fl).prop('disabled', true);

          return 0;

          function Then()
          {
            if (this.readyState !== 4)
            { return 0; }

            Btn.add(Fl).prop('disabled', false);

            if (this.status !== 200)
            {
              alert('上載發生錯誤。');

              return 0;
            }

            var Data = $.parseJSON(this.responseText);

            alert(Data.Message);

            if (Data.Index == 0)
            {
              Fl.val('');
              Pgs.val(0);
            }
          }
        }
      }

      function FeedManageSet()
      {
        var FdUpdBtn = $('#FdUpdBtn');

        FdUpdBtn.on('click', FeedUpdate);

        return 0;

        function FeedUpdate(Evt)
        {
          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 115},
              'success': function(Rtn, TxtSt, JQXHR)
                {
                  alert(Rtn.Message);

                  if (Rtn.Extend.length > 0)
                  { FdUpdBtn.prevAll('span:first').text(Rtn.Extend); }
                }
            });
        }
      }

      function ErrorHintSwitch()
      {
        var Bx = $('#ErrHntCtrlBx'),
            NowFlg = Bx.children('span:first');

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 116, 'Flg': NowFlg.attr('name')},
            'success': function(Rtn, TxtSt, JQXHR)
              {
                alert(Rtn.Message);

                if (Rtn.Index < 0)
                { return 0; }

                NowFlg.attr('name', Rtn.Extend)
                      .text(Rtn.Extend == 1 ? '開啟' : '關閉');
              }
          });
      }

      function BlogAlbumContentView(Obj)
      {
        var FlsBx = $(Obj).prev('input:file')[0],
            Fls = FlsBx.files,
            AbmImgsBx = $('#AbmCtnEdtBx > div:eq(1) > div:last').empty(),
            Hnt = '';

        if (Fls.length === 0)
        {
          alert('尚未選擇圖檔。');

          return -1;
        }

        for (var i = 0; i < Fls.length; i++)
        {
          if (Fls[i].type !== 'image/jpeg' && Fls[i].type !== 'image/png')
          {
            Hnt += "檔案 " + Fls[i].name + " 不是允許的圖檔，將被忽略。\n";

            continue;
          }

          var ID = 'AbmImg_' + i,
              AbmImg = $('#OneAbmEdtImg').clone().removeAttr('id'),
              FR = new FileReader();

          AbmImg.appendTo(AbmImgsBx)
                .attr('id', ID)
                .find('> div > span').first().text(Fls[i].name)
                                             .end()
                                     .last().text(Second2Datetime(Fls[i].lastModifiedDate.getTime() / 1000, 2));

          FR.targetID = ID;
          FR.onloadend = function(){ $('#' + this.targetID + ' > img').attr('src', this.result); };
          FR.readAsDataURL(Fls[i]);
        }

        if (Hnt.length > 0)
        { alert(Hnt); }
      }

      function BlogAlbumContentPrint(Obj)
      {
        var This = $(Obj),
            Fls = This.parent().prevAll('div:first').find('> div:last > .OneAbmEdtImg'),
            FlsInfo = [];

        console.log(Fls);

        Fls.each(function(Idx)
          {
            var This = $(this);

            FlsInfo.push({'Fl': This.find('> div > span:first').text(),
                          'Cmt': This.children('textarea').val()});
          });

        This.nextAll('textarea').val(JSON.stringify(FlsInfo).replace(/,/g, ",\n").replace(/\[/g, "[\n"));
      }
<?php } ?>
    -->
    </script>
  </head>
  <body>
    <div id='Template'> <!-- Template -->
      <div id='OneBlog' class='OneBlog'>
        <table>
          <tr><td>檔名</td><td><input type='text' readonly='true' style='width: 330px;'/></td></tr>
          <tr><td>ID</td><td style='display: inline-block; width: 330px; height: 19px; padding: 3px; border-width: 1px; border-radius: 4px;'></td></tr>
          <tr>
            <td>類型</td>
            <td>
              <select>
                <option value='text'>text</option>
                <option value='image'>image</option>
                <option value='images'>images</option>
                <option value='html'>html</option>
              </select>
            </td>
          </tr>
        </table>
        <table>
          <tr><td>標題</td><td><input type='text' placeholder='尚未輸入標題。'/></td></tr>
          <tr><td>日期</td><td><input type='text' placeholder='請輸入日期時間。'/></td></tr>
          <tr><td>密碼</td><td><input type='text' placeholder='未設定瀏覽密碼。'/></td></tr>
        </table>
        <textarea placeholder='未輸入副標文字。'></textarea>
        <span class='Block'></span>
        <span class='Block'>
          <input type='button' value='建立'/>
          <input type='button' style='display: none;' value='更新'/><br/>
          <input type='button' style='display: none;' value='刪除'/><br/>
          <input type='button' value='留言'/><br/>
        </span>
        <div style='display: none; background-color: #ffffff;'></div>
      </div>
      <div id='OneCmt' class='OneCmt'>
        <span class='Block'>
          <span></span><br/>
          <span></span>
        </span>
        <pre></pre>
        <input type='button' value='刪除'/>
      </div>
      <div id='OneMsg' class='OneMsg'>
        <span class='Block'>
          <table>
            <tr><td>ID</td><td></td></tr>
            <tr><td>建立時間</td><td></td></tr>
            <tr><td>源訊息 ID</td><td></td></tr>
          </table>
        </span>
        <textarea cols='30' rows='3' readonly='true'></textarea>
        <input type='button' style='vertical-align: top;' value='刪除'/>
      </div>
      <div id='OneTg' class='OneTg' style='margin: 5px 0px;'>
        <span style='display: inline-block; min-width: 330px; padding: 3px;'></span>
        <input type='text' placeholder='請輸入標籤名稱。' style='width: 150px;'/>
        <input type='button' value='更名'/>
        <input type='button' value='刪除'/>
      </div>
      <div id='OneWds' class='OneWds'>
      	<textarea rows='3'></textarea>
      	<div class='Block'>
          <span></span><br/>
      		<input type='button' value='更新'/><br/>
      		<input type='button' value='刪除'/>
      	</div>
      </div>
      <span id='TgChkBx' class='TgChkBx' style='display: inline-block; max-width: 300px;'>
      </span>
      <div id='OneAbmEdtImg' class='OneAbmEdtImg'>
        <div>
          <span></span><br/>
          <span></span>
        </div>
        <img src='#'/><br>
        <textarea cols='20' rows='3' placeholder='輸入文字或保留空白。'></textarea>
      </div>
    </div>
    <div id='Base'> <!-- Base -->
      <div id='Main'>
<?php if (!$IsLgn){ ?>
        <div style='text-align: center;'>
          管理員工具<br/>
          密碼： <input type='password' id='Pswd' maxlength='16' placeholder='請輸入密碼。' onkeypress='Login(event);'/>
          <input type='button' id='LgnBtn' value='登入' onclick='Login();'/>
        </div>
<?php } else{ ?>
        <div id='TbBx' class='TbBx' style='padding: 5px;'>
          <div id='BlogTb' class='TbBx Tb' data-tab-name='網誌管理'>
            <div id='BlogUpldBx' class='Tb' style='text-align: center;' data-tab-name='網誌上傳'>
              <span class='Block' style='border-width: 1px;'>
                檔案格式說明
                <table>
                  <tbody>
                    <tr><th>類型</th><th>檔案格式</th><th>說明</th></tr>
                    <tr>
                      <td>Text</td>
                      <td>文字檔</td>
                      <td>任意檔名的純文字檔, *.txt</td>
                    </tr>
                    <tr>
                      <td>Image</td>
                      <td>Tar 打包檔<br/>├ 圖片檔<br/>└ comment.txt</td>
                      <td>
                        打包檔名稱不限。<br/>
                        圖片檔名稱不限。<br/>
                        comment.txt 內容為對圖片檔的說明。
                      </td>
                    </tr>
                    <tr>
                      <td>Images</td>
                      <td>
                        Tar 打包檔<br/>
                        ├ 001.*<br/>
                        ...<br/>
                        ├ 999.*<br/>
                        └ comment.txt<br/>
                        ---- or ----<br/>
                        Tar 打包檔<br/>
                        ├ [圖檔名].*<br/>
                        ...<br/>
                        ├ [圖檔名].*<br/>
                        └ comment.json<br/>
                      </td>
                      <td>
                        打包檔名稱不限。<br/>
                        001.* ~ 999.* 為圖片檔，呈現時將依檔名排序。<br/>comment.txt 內容為對圖片檔的說明。<br/>其中以 \n====\n 做為每張圖片說明的分隔。<br/>
                        或是<br/>
                        透過「相簿型網誌內容編輯器」產生說明文，<br/>存入名為 comment.json 的文字檔。<br/>然後將圖檔與文字檔一同打包。
                      </td>
                    </tr>
                    <tr>
                      <td>HTML</td>
                      <td>(還在規畫)</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </span>
              <span class='Block' style='text-align: left;'>
                注意事項：
                <ul>
                  <li>檔案最大限制 <?= ini_get('upload_max_filesize'); ?></li>
                  <li>若檔名一樣，會直接覆蓋。</li>
                  <li>上傳過程，請不要進行其它操作或是離開本頁。</li>
                </ul>
                <span class='TextTitle'>檔案</span>
                <input type='file' id='BlogFl'/><br/>
                <input type='button' id='BlogUpldBtn' value='上傳'/>
                <progress value='0' max='100'></progress><br/>
              </span>
            </div>
            <div id='FeedBx' class='Tb' style='text-align: center;' data-tab-name='訂閱消息'>
              最後一次發佈消是在： <span><?= $FdLstDt; ?></span><br/>
              <input type='button' id='FdUpdBtn' value='更新網誌消息'/>
            </div>
            <div id='BlogLstBx' class='Tb' data-tab-name='網誌列表'>
              <div></div>
              <blogs></blogs>
            </div>
            <div class='Tb' data-tab-name='標籤管理'>
              <tags></tags>
            </div>
            <div id='AbmCtnEdtBx' class='Tb' data-tab-name='相簿型網誌內容編輯器'>
              <div style='text-align: center;'>
                挑選圖檔 <input type='file' multiple='true'/>
                <input type='button' value='檢視檔案' onclick='BlogAlbumContentView(this);'/>
              </div><hr/>
              <div>
                <div style='text-align: center;'>
                  整體排序 (還沒實作)
                  <input type='button' value='時間 新 > 舊'/>
                  <input type='button' value='時間 舊 > 新'/>
                  <input type='button' value='名稱 A > Z'/>
                  <input type='button' value='名稱 Z > A'/>
                </div>
                <div></div>
              </div><hr/>
              <div style='text-align: center;'>
                <input type='button' value='輸出內容' onclick='BlogAlbumContentPrint(this);'/><br/>
                <textarea cols='30' rows='5'></textarea>
              </div>
            </div>
          </div>
          <div id='MsgTb' class='Tb' data-tab-name='留言板管理'>
          </div>
          <div id='GdWdsTb' class='Tb' data-tab-name='佳言錄'>
            <div id='GdWdsMkBx'>
              新增佳言<br/>
              <textarea rows='3'></textarea>
              <input type='button' value='新增'/>
            </div><br/>
            <div id='GdWdsLstBx'></div>
          </div>
          <div id='ArtCnrTb' class='Tb' data-tab-name='角落藝廊管理'>
            <div id='AtCnrMkBx' class='Tb' name='建立新的角落藝廊' style='text-align: center;'>
              <table class='Block'>
                <tbody>
                  <tr><td>標題</td><td><input type='text' maxlength='32' placeholder='請輸入標題。'/></td></tr>
                  <tr><td>作者</td><td><input type='text' maxlength='32' placeholder='請輸入作者。'/></td></tr>
                  <tr><td>E-Mail</td><td><input type='text' maxlength='64' placeholder='請輸入作者 E-Mail。'/></td></tr>
                  <tr><td>建立時間</td><td><input type='text' maxlength='19' placeholder='請輸入建立時間。'/><input type='button' value='現在時間'/></td></tr>
                  <tr><td>圖檔</td><td><input type='file'/><br/><span></span></td></tr>
                  <tr><td>註解</td><td><textarea cols='21' rows='3' placeholder='請填入註解文字說明。'></textarea></td></tr>
                </tbody>
              </table><br/>
              <progress value='0' max='100'></progress>
              <input type='button' value='送出'/><br/>
              <img src='#' style='max-width: 256px; max-height: 256px;'/>
            </div>
          </div>
          <div id='SysBx' class='Tb' data-tab-name='系統管理'>
            <span id='CchImgBx' class='Block'>
              清理圖片 cache 舊資料
              <hr/>
              <input type='text' value='1' style='width: 80px;' placeholder='請輸入數字。'/>
              <select>
                <option value='60'>分</option>
                <option value='3600'>時</option>
                <option value='86400'>日</option>
                <option value='604800'>週</option>
                <option value='2592000' selected='true'>月(30日)</option>
              </select><br/>
              <span style='display: inline-block; margin: 5px 0px;'>???</span> 以前<br/>
              <input type='button' value='清理'/>
            </span>
            <span id='FlSttBx' class='Block'>
              系統資料夾結構使用量
              <hr/>
              <input type='button' value='檢視'/><br/>
              <div></div>
            </span>
            <span id='ErrHntCtrlBx' class='Block'>
              系統錯誤訊息開關
              <hr/>
              目前狀態：<?= $IsErrHnt ? '<span name="1">開啟</span>' : '<span name="0">關閉</span>'; ?><br/>
              <input type='button' value='切換' onclick='ErrorHintSwitch()'/>
            </span>
            <input type='button' id='LgtBtn' value='登出' onclick='Logout();'/>
          </div>
        </div>
<?php } ?>
      </div>
    </div>
  </body>
</html>
<!--=================================================================================================================-->
