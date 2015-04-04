<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');

$PckTg = ''; // 'PckTg' = Picked Tag.
$Tgs = array(); // '$Tgs' = Tags.

if (!empty($_GET['t']) && is_string($_GET['t']))
{ $PckTg = $_GET['t']; }

if (Db::Db0Connect() === 0)
{ $Tgs = Tag::TagList(); }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? require(WEB_PTH . 'meta.php'); ?>
  </head>
  <body id='BlgsPg'>
    <div id='Template'>
      <div id='Blg' class='Blg'>
        <div>
          <i class='icon'></i>
          <a href=''></a>
        </div>
        <pre></pre>
        <div></div>
        <div></div>
      </div>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? require(WEB_PTH . 'header.php'); ?>
      </header>
      <main id='Main'>
        <div id='TgBx'>
          <span id='TgTtl'>分類標籤</span>
          <?
            if (!empty($PckTg))
              echo "<a href='blogs.php'>取消</a>\n";

            echo '<br/>';

            foreach ($Tgs as $V)
            {
              if ($V['ID'] === $PckTg)
                echo "<span class='Tg Pckd'>{$V['Nm']}</span>\n";
              else
                echo "<a class='Tg' href='blogs.php?t={$V['ID']}'>{$V['Nm']}</a>\n";
            }
          ?>
        </div>
        <div id='BlgBx'>
        </div>
        <div id='ExtBx'>
          <a id='LdMr' href='javascript:void(0);'>載入更多</a>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? require(WEB_PTH . 'footer.php'); ?>
        <script type='text/javascript'>
        <!--
          var BxDOM;

          $(function ()
            {
              BxDOM = ItemList2(
                        '#BlgBx',
                        'service.php',
                        { Cmd: 1, Lmt: 6, Ofst: 0, TgIDA: ['<?= $PckTg; ?>'] },
                        OneBlogCreate,
                        false,
                        AfterBlogsCreate);

              BxDOM.PageGet();

              $('#LdMr').on('click', function () { BxDOM.PageGet(); });
              $('#ToTop').on('click', function () { window.scrollTo(0, 0); });
            });

          function OneBlogCreate (BlgInfo, Idx)
          {
            var TpClsMp = { image: 'icon-image', images: 'icon-images', text: 'icon-text', book: 'icon-book' },
                Blg = $('#Blg').clone().removeAttr('id').hide(),
                Tgs = [];

            Blg.children('div').first().children('i').addClass(TpClsMp[BlgInfo.Tp])
                                                     .end()
                                       .children('a').text(BlgInfo.Ttl)
                                                     .attr('href', 'zone.php?Blog=' + BlgInfo.ID)
                                                     .end()
                                       .end()
                               .last().text(BlgInfo.Dt)
                                      .end()
                               .end()
               .children('pre:first').text(BlgInfo.Smry);

            for (var i = 0; i < BlgInfo.Tg.length; i++)
            { Tgs.push($('<span/>').text(BlgInfo.Tg[i].Nm)); }

            Blg.children('div:eq(1)').append(Tgs);

            return Blg;
          }

          function AfterBlogsCreate (Cnt)
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
        -->
        </script>
      </footer>
    </div>
  </body>
</html>