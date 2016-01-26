<?
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require WEB_PTH . 'pdo_db.php';
require WEB_PTH . 'api.php';

$PckTgs = array(); // 'PckTgs' = Picked Tag IDs.

if (Db::Db0Connect() < 0)
{ return header('Location: 500.php'); }

if (!empty($_GET['t']) && is_string($_GET['t']))
{ $PckTgs[] = $_GET['t']; }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? PartView('meta', array('Ttl' => '網誌')); ?>
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
        <div class='Dt'></div>
      </div>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <? PartView('tags', array('Tgs' => Tag::TagList(), 'PckIDs' => $PckTgs)); ?>
        <div id='BlgBx' class='LstBx'>
        </div>
        <div id='ExtBx'>
          <a id='LdMr' href='javascript:void(0);'>載入更多</a>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='text/javascript'>
        <!--
          var BxDOM;

          $(function ()
            {
              BxDOM = ItemList2(
                        '#BlgBx',
                        'service.php',
                        {Cmd: 1, Lmt: 5, Ofst: 0, TgIDA: <?= json_encode($PckTgs); ?>},
                        OneBlogCreate,
                        false,
                        OneByOneFadeIn);

              BxDOM.OnePageGet();

              $('#LdMr').on('click', function () { BxDOM.OnePageGet(); });
              $('#ToTop').on('click', function () { window.scrollTo(0, 0); });

              return;

              function OneBlogCreate (BlgInfo, Idx)
              {
                var TpClsMp = { image: 'icon-image', images: 'icon-images', text: 'icon-text', book: 'icon-book' },
                    Blg = $('#Blg').clone().removeAttr('id').hide(),
                    Tgs = [];

                Blg.children('div').first().children('i').addClass(TpClsMp[BlgInfo.Tp])
                                                         .end()
                                           .children('a').text(BlgInfo.Ttl)
                                                         .attr('href', BlgInfo.Tp + '.php?b=' + BlgInfo.ID)
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
            });
        -->
        </script>
      </footer>
    </div>
  </body>
</html>