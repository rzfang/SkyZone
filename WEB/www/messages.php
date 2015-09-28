<?
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');

$PckTgs = array(); // 'PckTgs' = Picked Tag IDs.

if (Db::Db0Connect() < 0)
{ return header('Location: 500.php'); }

if (!empty($_GET['t']) && is_string($_GET['t']))
{ $PckTgs[] = $_GET['t']; }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? PartView('meta', array('Ttl' => '留言')); ?>
  </head>
  <body id='MsgsPg'>
    <div id='Template'>
      <div id='Msg' class='Msg'>
        <div class='Nm'></div>
        <pre></pre>
        <span class='Dt'></span><br/>
        <a href='javascript:void(0);'>回應</a><br/>
        <div class='RplBx'>
          <div class='LstBx'></div>
          <a href='javascript:void(0);'>我要回應</a>
        </div>
      </div>
      <div id='Rpl' class='Rpl'>
        <div class='Nm'></div>
        <pre></pre>
        <span class='Dt'></span>
      </div>
      <form id='RplFm' class='RplFm'>
        <input type='text' maxlength='10' placeholder='匿名'/><br/>
        <input type='email' required='true' placeholder='E-Mail (不會公開)'/><br/>
        <textarea rows="1" maxlength='255' required='true'></textarea><br/>
        <label>
          記住我 <input type='checkbox'/>
        <label>
        <a href="javascript:void(0);">回應</a>
      </form>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <div id='MsgBx' class='LstBx'></div>
        <div id='ExtBx' class='ExtBx'>
          <a id='LdMr' href='javascript:void(0);'>載入更多</a>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='text/javascript'>
        <!--
          $(function ()
            {
              var BxDOM = ItemList2(
                            '#MsgBx',
                            'service.php',
                            {Cmd: 3, Lmt: 5},
                            OneMessageCreate,
                            false,
                            OneByOneFadeIn);

              BxDOM.OnePageGet();

              $(BxDOM).on('click', '.Msg>a', RepliesToggle);
              $(BxDOM).on('click', '.Msg .RplBx>a', ReplyFormToggle);
              $(BxDOM).on('click', '.Msg .RplFm a', Reply);
              $('#LdMr').on('click', function (Evt) { BxDOM.OnePageGet(); });
              $('#ToTop').on('click', function (Evt) { window.scrollTo(0, 0); });

              return;

              function OneMessageCreate (Info, Idx)
              {
                var Msg = $('#Msg').clone().attr('id', Info.ID).hide(),
                    RplyBtn = Msg.children('a');

                Msg.children('.Nm').text(Info.Nm + ' :')
                                   .end()
                   .children('.Dt').text(Info.Dt)
                                   .end()
                   .children('pre').text(Info.Msg)
                                   .end()
                   .children('.RplBx').hide();

                if (Info.ChnCnt > 0) {
                  RplyBtn.text(RplyBtn.text() + '(' + Info.ChnCnt + ')');
                }

                return Msg;
              }
            });

          function RepliesToggle (Evt)
          {
            var This = $(this),
                Msg = This.parent('.Msg'),
                RplBx = Msg.children('.RplBx'),
                LstBx = Msg.find('.LstBx'),
                ID,
                LstBxDOM;

            if (LstBx.data('IsLoaded'))
            {
              RplBx.fadeToggle();

              return;
            }

            ID = Msg.attr('id')
            LstBxDOM = ItemList2(LstBx, 'service.php', {Cmd: 5, ID: ID}, OneReplyCreate, true, CountUpdate);

            LstBxDOM.Get(-1, 0);
            LstBx.data('IsLoaded', true);
            RplBx.fadeIn();

            return;

            function OneReplyCreate (Info, Idx) {
              var Rpl = $('#Rpl').clone().attr('id', Info.ID);

              Rpl.children('.Nm').text(Info.Nm + ' :')
                                 .end()
                 .children('.Dt').text(Info.Dt)
                                 .end()
                 .children('pre').text(Info.Msg);

              return Rpl;
            }

            function CountUpdate (Lth, Lst)
            {
              if (This.text() === '回應')
              {
                if (Lth > 0)
                { This.text('回應(' + Lth.toString() + ')'); }
              }
              else
              { This.text('回應(' + LstBxDOM.NowCount().toString() + ')'); }
            }
          }

          function ReplyFormToggle (Evt)
          {
            var This = $(this),
                Fm = This.next('.RplFm');

            if (Fm.length > 0)
            {
              Fm.fadeToggle(FormDefaultSet);

              return 1;
            }

            $('#RplFm').clone().removeAttr('id')
                               .hide()
                               .insertAfter(This)
                               .fadeIn(FormDefaultSet);
          }

          function Reply (Evt)
          {
            var This = $(this),
                Fm = This.parents('.RplFm');
                Msg = Fm.parents('.Msg:first'),
                TgtID = Msg.attr('id'),
                Nm = Trim(Fm.children('input[type=text]').val()) || '匿名',
                Ml = Trim(Fm.children('input[type=email]').val()),
                Rpl = Trim(Fm.children('textarea').val()),
                IsRmb = Fm.find('input[type=checkbox]').prop('checked'), // 'IsRmb' = Is Remembered.
                Hnt = '';

            if (!TgtID)
            {
              alert('出錯了，請重新載入頁面。');

              return -1;
            }

            if (!IsFormGood(Nm, Ml, Rpl))
            { return -2; }

            $.ajax({
                type: 'POST',
                dataType: 'json',
                timeout : 20000,
                url: 'service.php',
                data: {Cmd: 4, Tgt: TgtID, Nm: Nm, Ml: Ml, Msg: Rpl},
                beforeSend: function (JQXHR, Set)
                  {
                    FormLock(Fm);
                    CookieSet('Usr', Nm + ' ' + Ml, IsRmb ? 2592000 : -1); // 2592000 = 30 days.
                  },
                error : function (JQXHR, TxtSt, ErrThr) { alert('出錯了!!!'); },
                complete : function (JQXHR, TxtSt) { FormUnlock(Fm); },
                success: function (Rtn, TxtSt, JQXHR)
                  {
                    var LstBx = Msg.find('.LstBx')[0];

                    if (Rtn.Index < 0)
                    {
                      alert(Rtn.Index + ', ' + Rtn.Message);

                      return 0;
                    }

                    Fm.find('textarea').val('');
                    LstBx.Get(-1, LstBx.NowCount(), false);
                  }
              });
          }

          function IsFormGood (Nm, Ml, Msg)
          {
            var Hnt = '';

            if (!Nm || !Is.String(Nm) || Nm.length === 0)
            { Hnt += '尚未填寫暱稱。\n'; }

            if (!Ml || !Is.String(Ml) || Ml.length === 0)
            { Hnt += '尚未填寫 E-Mail。\n'; }
            else if (!IsEMail(Ml))
            { Hnt += 'E-Mail 不符合標準格式。\n'; }

            if (!Msg || !Is.String(Msg) || Msg.length === 0)
            { Hnt += '尚未填寫任何留言。\n'; }
            else if (Msg.length > 255)
            { Hnt += '留言請勿超個 255 個字。\n'; }

            if (Hnt.length > 0)
            {
              alert('請留意以下說明：\n' + Hnt);

              return false;
            }

            return true;
          }

          function FormLock (Fm)
          {
            if (!Fm || !Is.jQuery(Fm))
            { return -1; }

            Fm.addClass('Lck')
                .find('input,textarea').prop('disabled', true);
          }

          function FormUnlock (Fm)
          {
            if (!Fm || !Is.jQuery(Fm))
            { return -1; }

            Fm.removeClass('Lck')
                .find('input,textarea').prop('disabled', false);
          }

          function FormDefaultSet ()
          {
            var Fm = $(this),
                Usr = (CookieParam('Usr') || '').split(' ');

            if (Usr.length === 2)
            {
              Fm.children('input[type=text]').val(Usr[0])
                                             .end()
                .children('input[type=email]').val(Usr[1])
                                              .end()
                .find('input[type=checkbox]').prop('checked', true)
                                             .end()
                .children('textarea').focus();
            }
            else
            {
              Fm.children('input[type=email]').val('')
                                              .end()
                .find('input[type=checkbox]').prop('checked', false)
                                             .end()
                .children('input[type=text]').val('')
                                             .focus();
            }
          }
        -->
        </script>
      </footer>
    </div>
  </body>
</html>