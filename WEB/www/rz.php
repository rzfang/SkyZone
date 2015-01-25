<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');

$IsLgn = false;

if (isset($_SESSION['RZPswd']))
{
  if ($_SESSION['RZPswd'] == RZ_PSWD)
    $IsLgn = true;
  else
    unset($_SESSION['RZPswd']);
}
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title><?= WEBSITE; ?></title>
    <meta http-equiv='content-type' content='text/html; charset=utf-8'/>
    <meta name='description' content='我的天空，我在其中，在我這裡，自由放空。 RZ 的個人網站。'/>
    <meta name='keywords' content='天空, 空域, RZ, 個人網站'/>
    <meta name='author' content='RZ Fang'/>
    <link rel='icon' href='favicon.ico' type='image/ico'/>
    <link rel='stylesheet' type='text/css' href='resource/base.css'/>
    <style type='text/css'>
    <!--
      .TbBx > .Tb { padding: 5px; }
      .TbBx > ul > li, .TbBx > .Tb { border-color: #808080; }

      .OneShr:hover { background-color: #c0e0ff; }

      .OneFdBx { position: relative; max-width: 1000px; margin: 5px 0px; padding: 5px; border: 1px solid #808080; border-radius: 5px; text-align: left; }
      .OneFdBx > div:first-child > a { font-size: 16px; }
      .OneFdBx > div:first-child > span { font-size: 10px; }
      .OneFdBx > div:last-child { visibility: hidden; position: absolute; right: 0px; top: 0px; text-align: right; }

      .OneFd { margin: 5px 0px; }
      .OneFd > span { margin: 5px 0px; }
      .OneFd > span:first-child { font-size: 10px; color: #808080; }
      .OneFd > span:nth-child(3) { display: inline-block; max-width: 700px; vertical-align: middle; }
      .OneFd > span:nth-child(3):hover { cursor: pointer; text-decoration: underline; }
      .OneFd > div { display: none; max-height: 400px; overflow: auto; }
    -->
    </style>
    <script type='text/javascript' src='resource/jquery.min.js'></script>
    <script type='text/javascript' src='https://www.google.com/jsapi'></script>
    <script type='text/javascript' src='resource/include.<?= DEV ? 'js' : 'min.js'; ?>'></script>
    <script type='text/javascript'>
<?php if (!$IsLgn){ ?>

      $(function ()
        {
          $('#LgnBtn').prev().focus();
        });

      function Login (Evt)
      {
        var EvtTp = typeof Evt;

        if (EvtTp !== 'undefined' && Evt.keyCode != 13)
        { return 0; }

        var This = EvtTp === 'undefined' ? $('#LgnBtn') : $(Evt.currentTarget),
            Pswd = $('#Pswd').val();

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 202, 'Pswd': Pswd},
            'beforeSend': function (JQXHR, St) { This.siblings('input').addBack().prop('disabled', true); },
            'complete': function (JQXHR, TxtSt) { This.siblings('input').addBack().prop('disabled', false); },
            'success': function (Rtn, TxtSt, JQXHR)
              {
                alert(Rtn.Message);

                if (Rtn.Index == 0)
                { PageTurn(''); }
              }
          });
      }

<?php } else { ?>

      var GoogleAPIRdy = false;

      google.load('feeds', '1');
      google.setOnLoadCallback(function () { GoogleAPIRdy = true; });

      $(function ()
        {
          TabBox('#TbBx', '#TbBx > .Tb', 0, TabSwitch);
          NoteSet();
        });

      function Logout ()
      {
        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 201, 'Lgt': 1},
            'success': function (Rtn, TxtSt, JQXHR)
              {
                if (Rtn.Index == 0)
                { PageTurn(''); }
                else
                { alert(Rtn.Message); }
              }
          });
      }

      function TabSwitch (OO, NO)
      {
        var Idx = NO.index(),
            TbBx = $('#TbBx > .Tb:eq(' + Idx + ')');

        switch (Idx)
        {
          case 1:
            FeedSet(TbBx);
            break;

          case 2:
            FileSet(TbBx);
            break;

          case 0:
          default:
            $('#NtBx > textarea:first').focus();
        }
      }

      function NoteSet ()
      {
        var NtBx = $('#NtBx'),
            NtTxt = NtBx.children('textarea:first'),
            CmdIpt = NtBx.find('#CmdIpt'),
            BtnA = NtBx.find('> span > input:button'),
            ChkA = NtBx.find('> span > input:checkbox');
            TmOutClk = null;

        CmdIpt.on({'focus': function (Evt) { CmdIpt.val('輸入指令…'); },  'keyup': KeyCommand});

        BtnA.first().on('click', NoteLoad)
                    .end()
            .eq(1).on('click', DatetimeInsert)
                  .end()
            .eq(2).on('click', LineInsert)
                  .end()
            .last().on('click', NoteSave);

        return 0;

        function KeyCommand (Evt)
        {
          switch (Evt.keyCode)
          {
            case 76: // l.
              BtnA.first().click();
              CmdIpt.val(BtnA.first().val());
              NtTxt.focus();
              break;

            case 68: // d.
              BtnA.eq(1).click();
              CmdIpt.val(BtnA.eq(1).val());
              break;

            case 82: // r.
              BtnA.eq(2).click();
              CmdIpt.val(BtnA.eq(2).val());
              break;

            case 84: // t.
              ChkA.first().click();
              CmdIpt.val(ChkA.first().next().text());
              NtTxt.focus();
              break;

            case 83:
              BtnA.last().click();
              CmdIpt.val(BtnA.last().val());
              NtTxt.focus();
              break;

            case 9: // Tab.
              break;

            case 27: // Esc.
              NtTxt.focus();
              break;

            default:
              CmdIpt.val('無效指令');
          }
        }

        function NoteLoad (Evt)
        {
          var NdStr = NtTxt.val();

          if (NdStr.length > 0 && !confirm("載入筆記將放棄目前的筆記內容。\n是否繼續？"))
          { return 0; }

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 203},
              'beforeSend': function (JQXHR, St) { $(Evt.currentTarget).prop('disabled', true); },
              'complete': function (JQXHR, TxtSt) { $(Evt.currentTarget).prop('disabled', false); },
              'success': function (Rtn, TxtSt, JQXHR)
                {
                  if (Rtn.Index < 0)
                  { alert(Rtn.Message); }

                  NtStr = Rtn.Extend.replace(/%22/g, '"').replace(/%27/g, '\'').replace(/%5C/g, '\\'); // decode special case words.

                  NtTxt.val(NtStr);
                  BtnA.not(':first').prop('disabled', false);
                }
            });
        }

        function NoteSave (Evt)
        {
          var NtStr = NtTxt.val();

          if (ChkA.first().prop('checked')) // trim the blank word of each line tail.
          { NtStr = NtStr.replace(/[ \t\v\r\f　]+\n/g, "\n"); }

          NtStr = NtStr.replace(/"/g, '%22').replace(/'/g, '%27').replace(/\\/g, '%5C'); // encode special case words.

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 204, 'NtStr': NtStr},
              'beforeSend': function (JQXHR, St) { $(Evt.currentTarget).prop('disabled', true); },
              'complete': function (JQXHR, TxtSt) { $(Evt.currentTarget).prop('disabled', false); },
              'success': function (Rtn, TxtSt, JQXHR) { alert(Rtn.Message); }
            });
        }

        function DatetimeInsert (Evt)
        {
          var DtO = new Date();

          StringInsert(Second2Datetime(DtO.getTime() / 1000, 2));
        }

        function LineInsert (Evt)
        {
          var SetA = $(this).nextAll('input:text'),
              Wd = SetA.first().val(),
              Lth = SetA.eq(1).val(),
              LnStr = "\n";

          for (var i = 0; i < Lth; i++)
          { LnStr += Wd; }

          StringInsert(LnStr + "\n");
        }

        function StringInsert (DtStr)
        {
          if (typeof DtStr !== 'string' || DtStr.length === 0)
          { return 0; }

          var Txtara = NtBx.children('textarea'),
              Str = Txtara.val(),
              LctStt = Txtara.prop('selectionStart'),
              LctEnd = Txtara.prop('selectionEnd');

          Txtara.val(Str.substring(0, LctStt) + DtStr + Str.substring(LctEnd))
                .focus();

          Txtara.get(0).setSelectionRange(LctStt, LctStt + DtStr.length);
        }
      }

      function FeedSet (JO)
      {
        var FdBx = JO.find('#FdBx'),
            GrpFctnBx = $('#FdGrpFctnBx'),
            FdGrpBx = $('#FdGrpBx');

        if (FdBx.children().length > 0)
        { return 0; }

        if (!GoogleAPIRdy)
        {
          alert('Google Feed API load failed.');

          return -1;
        }

        $.ajax(
          {
            'type': 'POST',
            'dataType': 'json',
            'timeout' : 20000,
            'url': 'service.php',
            'data': {'Cmd': 206},
            'success': function (Rtn, TxtSt, JQXHR)
              {
                if (Rtn.Index < 0)
                {
                  alert(Rtn.Message);

                  return 0;
                }

                if (typeof Rtn.Extend.Grp === 'object')
                { FunctionSet(Rtn.Extend.Grp); }

                if (typeof Rtn.Extend.FdLst === 'object')
                { FeedListSet(Rtn.Extend.FdLst); }

                return 0;
              }
          });

        return 0;

        function FunctionSet (Grp)
        {
          var FdFctnBx = $('#FdFctnBx'),
              GrpLst = GrpFctnBx.children('select:first');

          if (typeof Grp.length !== 'number' && Grp.length === 0)
          { return -1; }

          for (var i = 0; i < Grp.length; i++) // list group items.
          {
            $('<option/>').text(Grp[i].Nm)
                          .val(Grp[i].ID)
                          .appendTo(GrpLst);
          }

          GrpLst.on('change', FeedGroupFilter);
          GrpFctnBx.children('input:button').first().on('click', FeedGroupRename)
                                                    .end()
                                            .eq(1).on('click', FeedGroupAdd)
                                                  .end()
                                            .last().on('click', FeedGroupDel);
          FdFctnBx.children('input:button:first').on('click', FeedAdd);

          FeedGroupBoxBuild();

          return 0;

          function FeedGroupFilter (Evt)
          {
            var This = $(this),
                GrpID = This.children('option:selected').attr('value');

            FdGrpBx.css('visibility', 'hidden');

            if (GrpID === undefined || GrpID.length === 0)
            {
              FdBx.children('.OneFdBx').show();

              return;
            }

            FdBx.children('.OneFdBx').each(function (Idx)
              {
                var This = $(this);

                if (This.attr('name') == GrpID)
                { This.show(); }
                else
                { This.hide(); }
              });
          }

          function FeedGroupRename (Evt)
          {
            var This = $(this),
                Grps = GrpLst.children('option'), // 'Grps' = Groups.
                NowGrp = Grps.filter(':selected'),
                NewNm = Trim(This.prevAll('input:text:first').val()),
                Hnt = '';

            if (NowGrp.text() === '全部')
            { Hnt += "「全部」不能更改。\n"; }

            if (NewNm.length === 0)
            { Hnt += "尚未設定新群組名稱。\n"; }

            for (var i = 0; i < Grps.length; i++)
            {
              if (Grps.eq(i).text() === NewNm)
              {
                Hnt += "此群組名稱已經在使用了。\n";

                break;
              }
            }

            if (Hnt.length > 0)
            {
              alert(Hnt);

              return;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 211, 'GrpID': NowGrp.val(), 'NewNm': NewNm},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { return -1; }

                    NowGrp.text(NewNm);

                    FeedGroupBoxBuild();

                    return 0;
                  }
              });
          }

          function FeedGroupAdd (Evt)
          {
            var Grps = GrpLst.children('option'), // 'Grps' = Groups.
                Nm = $(this).prevAll('input:text:first').val(), // 'Nm' = Name.
                Rpt = false; // 'Rpt' = Repeat Flag.

            Grps.each(function (Idx)
              {
                if ($(this).text() === Nm)
                {
                  Rpt = true;

                  return false;
                }
              });

            if (Rpt)
            {
              alert('群組名稱重複了。');

              return -1;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 212, 'Nm': Nm},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { return -1; }

                    $('<option>').val(Rtn.Extend.ID)
                                 .text(Nm)
                                 .appendTo(GrpLst);

                    FeedGroupBoxBuild();

                    return 0;
                  }
              });
          }

          function FeedGroupDel (Evt)
          {
            if (!confirm('是否刪除'))
            { return -1; }

            var Grps = GrpLst.children('option'), // 'Grps' = Groups.
                NowGrp = Grps.filter(':selected:first');

            if (NowGrp.text() === '全部')
            {
              alert('「全部」不能刪除。');

              return -2;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 213, 'ID': NowGrp.val()},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { return -1; }

                    NowGrp.remove();

                    FeedGroupBoxBuild();

                    return 0;
                  }
              });
          }

          function FeedAdd (Evt)
          {
            var URL = $(this).prev('input[type=url]').val();

            if (URL.length === 0)
            {
              alert('尚未填寫 Feed 來源網址。');

              return -1;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 207, 'URL': URL},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { return -1; }

                    OneFeedPut(Rtn.Extend, URL, '');

                    return 0;
                  }
              });
          }

          function FeedGroupBoxBuild ()
          {
            var FdGrpFctnBx = $('#FdGrpFctnBx');

            FdGrpBx.children('select').empty()
                                      .append(FdGrpFctnBx.find('> select > option').clone());
          }
        }

        function FeedListSet (FdLst)
        {
          if (typeof FdLst.length !== 'number' && FdLst.length === 0)
          { return -1; }

          for (var i = 0; i < FdLst.length; i++)
          {
            if (typeof FdLst[i].URL !== 'string' || FdLst[i].URL.length === 0)
            { continue; }

            OneFeedPut(FdLst[i].ID, FdLst[i].URL, FdLst[i].GrpID);
          }

          FdBx.on('click', '.OneFd > span:nth-child(3)', FeedToggle)
              .on('mouseenter', '.OneFdBx', function (Evt) { $(this).children('div:last').css('visibility', 'visible'); })
              .on('mouseleave', '.OneFdBx', function (Evt) { $(this).children('div:last').css('visibility', 'hidden'); })
              .on('click', '.OneFdBx > div:last-child > input:button:last-child', OneFeedDel)
              .on('click', '.OneFdBx > div:last-child > input:button:first-child', GroupBoxShow);

          FdGrpBx.on('change', '> select', FeedGroupChange)
                 .on('click', '> input[type=button]', function (Evt) { FdGrpBx.css('visibility', 'hidden'); });

          return 0;

          function OneFeedDel (Evt)
          {
            if (!confirm('是否刪除'))
            { return -1; }

            var FdBx = $(this).closest('.OneFdBx'),
                ID = FdBx.attr('id');

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 208, 'ID': ID},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { return -1; }

                    FdBx.hide('normal', function () { FdBx.remove(); });

                    return 0;
                  }
              });
          }

          function GroupBoxShow (Evt)
          {
            var This = $(this),
                FdBx = This.closest('.OneFdBx'),
                FdID = FdBx.attr('id'),
                GrpID = FdBx.attr('name'),
                offset = This.offset();

            FdGrpBx.attr('name', FdID)
                   .css({'visibility': 'visible', 'left': offset.left, 'top': offset.top - 5});

            if (GrpID.length === 0)
            { FdGrpBx.find('> select > option:first').prop('selected', true); }
            else
            { FdGrpBx.find('> select > option[value=' + GrpID + ']').prop('selected', true); }
          }

          function FeedGroupChange (Evt)
          {
            var FdID = FdGrpBx.attr('name'),
                FdBx = $('#' + FdID),
                OldGrpID = FdBx.attr('name'),
                NewGrpID = FdGrpBx.find('> select > option:selected').attr('value');

            NewGrpID = NewGrpID ? NewGrpID : '';

            if (OldGrpID === NewGrpID)
            {
              alert('新、舊群組相同，沒必要更新。');

              return -1;
            }

            $.ajax(
              {
                'type': 'POST',
                'dataType': 'json',
                'timeout' : 20000,
                'url': 'service.php',
                'data': {'Cmd': 214, 'ID': FdID, 'NewGrpID': NewGrpID},
                'success': function (Rtn, TxtSt, JQXHR)
                  {
                    alert(Rtn.Message);

                    if (Rtn.Index < 0)
                    { FdGrpBx.find('> select > option[value=' + OldGrpID + ']').prop('selected', true); }
                    else
                    { FdBx.attr('name', NewGrpID); }
                  }
              });
          }
        }

        /*
          'ID' = ID of feed.
          'URL' = feed URL string.
          'GrpID' = Group ID. */
        function OneFeedPut (ID, URL, GrpID)
        {
          if (typeof URL !== 'string' || URL.length === 0)
          { return -1; }

          if (typeof GrpID !== 'string')
          { GrpID = ''; }

          var Fd = new google.feeds.Feed(decodeURIComponent(URL));

          var One = $('#OneFdBx').clone().removeAttr('id')
                                         .attr({'id': ID, 'name': GrpID})
                                         .appendTo(FdBx);

          Fd.load(function (Rst)
            {
              if (!Rst.error)
              {
                var FdBx = One.children('div:first').children('a').text(HTMLSpecialCharsEnDeCode(Rst.feed.title, false))
                                                                  .attr({'href': Rst.feed.link})
                                                                  .end()
                                                    .children('span').text(HTMLSpecialCharsEnDeCode(Rst.feed.description, false))
                                                                     .end()
                                                    .end()
                              .children('div:eq(1)');

                for (var j = 0; j < Rst.feed.entries.length; j++)
                {
                  var Ety = Rst.feed.entries[j],
                      OneFd = $('#OneFd').clone().removeAttr('id');

                  OneFd.appendTo(FdBx)
                       .children('div').text(Ety.content)
                                       .end()
                       .children('span').first().text(FeedDatetimeTransform(Ety.publishedDate))
                                                .end()
                                        .eq(2).html(Ety.title)
                                              .end()
                                        .eq(1).children('a').attr('href', Ety.link);
                }
              }
            });
        }

        function FeedDatetimeTransform (DtStr)
        {
          if (typeof DtStr !== 'string' || DtStr.length === 0)
          { return '????-??-?? ??:??:?? (?)'; }

          var WkDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
              Mth = ['???', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              W = DtStr.substr(0, 3),
              M = DtStr.substr(8, 3);

          for (var i in WkDay)
          {
            if (W === WkDay[i])
            {
              W = i.toString(10);
              break;
            }
          }

          for (var i in Mth)
          {
            if (M === Mth[i])
            {
              M = CharPad(i.toString(10), 2, '0');
              break;
            }
          }

          return RstStr = DtStr.substr(12, 4) + '-' + M + '-' + DtStr.substr(5, 2) +
                 DtStr.substr(16, 9) + ' (' + W + ')';
        }

        function FeedToggle (Evt)
        {
          var Tgt = $(this).siblings('div').toggle();

          if (Tgt.children().length > 0)
          { return 0; }

          var Ctn = Tgt.text();

          Tgt.html(Ctn);
        }
      }

      function FileSet (JO)
      {
        if (!JO.data('IsInit'))
        {
          TabBox('#FlTbBx', '#FlTbBx > .Tb', 0, FileTabSwitch);

          $('#CdMpSvBtn').on('click', CodeMapSave);

          JO.data('IsInit', true);
        }

        return 0;

        function FileTabSwitch (OO, NO)
        {
          var Idx = NO.index(),
              TbBx = $('#FlTbBx > .Tb:eq(' + Idx.toString() + ')');

          switch (Idx)
          {
            case 0:
              PackageFileList(TbBx);
              break;

            case 1:
              UploadFileManage(TbBx);
              break;
          }
        }

        function CodeMapSave (Evt)
        {
          var CdMpStr = Trim($(this).prev('textarea').val());

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 210, 'CdMp': CdMpStr},
              'beforeSend': function (JQXHR, St) { $(Evt.currentTarget).prop('disabled', true); },
              'complete': function (JQXHR, TxtSt) { $(Evt.currentTarget).prop('disabled', false); },
              'success': function (Rtn, TxtSt, JQXHR)
                {
                  if (Rtn.Index < 0)
                  { alert(Rtn.Message); }
                }
            });
        }

        function UploadFileManage (JO)
        {
          var LstBx = JO.children('div:first');

          if (LstBx.children().length > 0)
          { return 0; }

          $.ajax(
            {
              'type': 'POST',
              'dataType': 'json',
              'timeout' : 20000,
              'url': 'service.php',
              'data': {'Cmd': 209},
              'success': function (Rtn, TxtSt, JQXHR)
                {
                  if (Rtn.Index < 0)
                  { alert(Rtn.Message); }

                  JO.children('textarea:first').val(Rtn.Extend.CdMp);

                  for (var i in Rtn.Extend.FlA)
                  {
                    $('<a/><br/>').first().attr('href', 'file.php?U=' + Rtn.Extend.FlA[i])
                                          .text(Rtn.Extend.FlA[i])
                                          .end()
                                  .appendTo(LstBx);
                  }
                }
            });
        }

        function PackageFileList (JO)
        {
          if (JO.children().length > 0)
          { return 0; }

          var Tlt = $('#OneShr'),
              LstBx = ItemList(JO, 'service.php', 15, {'Cmd': 205}, OneShare, ['GJ'], TitleBuild);

          return 0;

          function OneShare (Data, Idx)
          {
            var One = Tlt.clone().removeAttr('id');

            One.children('span').first().text(Data.Fl)
                                        .end()
                                .eq(1).text((Math.round(Data.Sz / 1048576 * 10) / 10) + ' MB')
                                      .end()
                                .eq(2).children('a').attr({'href': Data.URL, 'target': '_blank'})
                                                    .text(Data.URL);

            return One;
          }

          function TitleBuild (Cnt, Data)
          {
            var Ttl = LstBx.children('div.OneShr:first').clone();

            Ttl.prependTo(LstBx)
               .removeClass('OneShr')
               .children('span').first().text('檔名')
                                        .end()
                                .eq(1).text('大小(MB)')
                                      .end()
                                .eq(2).text('網址');
          }
        }
      }
<?php } ?>
    </script>
  </head>
  <body>
    <div id='Template'> <!-- Template -->
      <div id='OneShr' class='OneShr' style='margin: 10px 0px; padding: 5px; border-radius: 5px;'>
        <span class='Block' style='min-width: 230px; vertical-align: middle;'></span>
        <span class='Block' style='min-width: 50px; vertical-align: middle;'></span>
        <span class='Block' style='min-width: 600px; vertical-align: middle;'><a></a></span>
      </div>
      <div id='OneFdBx' class='OneFdBx'>
        <div>
          <a href='#' target='_blank'>讀取中…</a>
          <span></span>
        </div>
        <div></div>
        <div>
          <input type='button' value='設定群組'/>
        	<input type='button' value='刪除'/>
        </div>
      </div>
      <div id='OneFd' class='OneFd'>
        <span>Time</span>
        <span><a href='#' target='_blank'>[閱讀]</a></span>
        <span>Title</span>
        <div>Content</div>
      </div>
    </div>
    <div id='Base'> <!-- Base -->
      <div id='Main'>
<?php if (!$IsLgn){ ?>
	      <div style='text-align: center;'>
	        RZ 個人工具<br/>
	        密碼： <input type='password' id='Pswd' maxlength='16' onkeypress='Login(event);' placeholder='請輸入密碼'/>
	        <input type='button' id='LgnBtn' value='登入' onclick='Login();'/>
	      </div>
<?php } else { ?>
	      <div id='TbBx' class='TbBx'>
	        <div class='Tb' style='text-align: center;' data-tab-name='線上記事本'>
	          <span id='NtBx' class='Block'>
	            <textarea cols='80' rows='25' placeholder='尚未載入/寫入筆記。'></textarea>
	            <span style='display: inline-block; text-align: left; vertical-align: bottom;'>
	              <input type='text' id='CmdIpt' value='輸入指令…' style='width: 180px; color: #808080;'/><br/><br/>
	              <input type='button' value='(L) 載入'/><br/><br/>
	              插入文字：<br/>
	              <input type='button' value='(D) 時間戳'/><br/>
	              <input type='button' value='(R) 分隔線'/>
	              符號<input type='text' value='=' maxlength='1' style='width: 18px;'/>
	              長度<input type='text' value='80' maxlength='3' style='width: 30px;'/><br/><br/>
	              其它選項：<br/>
	              <input type='checkbox' checked='true'/><span>(T) 存檔時去除行尾空白</span><br/><br/>
	            	<input type='button' value='(S) 儲存' disabled='true'/>
	            </span>
	          </span>
	        </div>
	        <div class='Tb' data-tab-name='Feeds 消息'>
	          <div style='text-align: center;'>
	            <div style='display: inline-block; padding: 5px; border-width: 1px; border-radius: 5px; text-align: left;'>
	              <div id='FdGrpFctnBx'>
	                群組
	                <select autocomplete='off'>
	                  <option>全部</option>
	                </select>
	                <input type='text' style='width: 100px;'/>
	                <input type='button' value='更命'/>
	                <input type='button' value='新增'/>
	                <input type='button' value='刪除'/>
	              </div>
	              <div id='FdFctnBx'>
	                來源
	                <input type='url' style='width: 300px;'/>
	                <input type='button' id='FdAddBtn' value='新增'/>
	              </div>
	            </div>
	          </div>
	          <div id='FdBx' style='width: 1000px; margin: 0px auto;'>
	          </div>
	          <div id='FdGrpBx' style='display: inline-block; position: absolute; visibility: hidden; min-width: 150px; padding: 5px; border-width: 1px; border-radius: 5px; background: #ffffff;'>
	            <select></select>
	            <input type='button' value='取消'/>
	          </div>
	        </div>
	        <div id='FlTbBx' class='TbBx Tb' data-tab-name='檔案管理'>
	          <div class='Tb' data-tab-name='分享檔案列表'></div>
	          <div class='Tb' style='padding: 10px 5px;' data-tab-name='上傳檔案管理'>
	            Code Map 格式： [驗證碼(索引)] // [註解]<br/><br/>
	            <textarea rows='7' style='width: 400px;' placeholder='請輸入驗證碼。一行一組。//後可寫註解。'></textarea>
	            <input type='button' id='CdMpSvBtn' value='儲存'><br/><br/>
	            檔案格式： [上傳時間]-[索引].[原副檔名]
	            <div></div>
	          </div>
	        </div>
	        <div class='Tb' data-tab-name='系統'>
	          <input type='button' id='LgtBtn' value='登出' onclick='Logout();'/>
	        </div>
	      </div>
	<?php } ?>
      </div>
    </div>
  </body>
</html>
<!--=================================================================================================================-->
