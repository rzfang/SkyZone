<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');
require(WEB_PTH . 'resource/Tar.php');

$ID = $_GET['b'] ? $_GET['b'] : '';

if (!$ID)
{ return header('Location: 404.php'); }

if (Db::Db0Connect() < 0)
{ return header('Location: 500.php'); }

$Blog = Blog::OneRead(array('ID' => $ID));

if (empty($Blog))
{ return header('location: 500.php'); }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <?
      $VwData = array('Ttl' => $Blog['Ttl'], 'Smry' => $Blog['Smry'], 'URL' => $Blog['URL'],
                      'ImgURL' => WEBSITE_URL . $Blog['Lst'][0]['TbnURL']);

      require(VW_PTH . 'meta.php');
    ?>
  </head>
  <body id='ImgsPg'>
    <div id='Template'></div>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? require(VW_PTH . 'navigation.php'); ?>
      </header>
      <main id='Main'>
        <h1><?= $Blog['Ttl']; ?></h1>
        <div id='InfoBx'>
          <?
            $VwData = array('Tgs' => $Blog['TgA']);

            require(VW_PTH . 'tags.php');
          ?>
          <div>
            <i class='icon icon-calendar' title='發佈時間'></i>
            <?= $Blog['Dt']; ?>
          </div>
        </div>
        <div id='ImgsBx'>
          <?
            foreach ($Blog['Lst'] as $K => $V)
            {
              echo <<<Block
                <div>
                  <a href='javascript:void(0);' data-image-url={$V['ImgURL']}>載入圖片</a>
                  <div>
                    <pre>{$V['Str']}</pre>
                  </div>
                </div>
Block;
            }
          ?>
        </div>
        <?
          $VwData = array('URL' => $Blog['URL']);

          require(VW_PTH . 'share.php');
        ?>
        <div id='ExtBx'>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? require(VW_PTH . 'footer.php'); ?>
        <script type='text/javascript'>
          $(function ()
            {
              var Win = $(window),
                  Win3_4H = Win.height() / 4 * 3,
                  IsOn = false;

              $('#ToTop').on('click', function (Evt) { window.scrollTo(0, 0); });
              Win.on(
                'scroll',
                function (Evt)
                {
                  var DOMs, // 'DOMs' = DOM array.
                      ScrlY = Win.scrollTop(); // 'ScrlY' = Scroll Y;

                  if (IsOn)
                  { return; }

                  DOMs = $('#ImgsBx a').slice(0, 3);
                  IsOn = true;

                  if (DOMs.length === 0)
                  {
                    IsOn = false;

                    Win.off('scroll');

                    return;
                  }

                  if (ScrlY > ($(DOMs[0]).offset().top - Win3_4H))
                  { SomeImagesLoad(DOMs); }

                  IsOn = false;
                });

              SomeImagesLoad($('#ImgsBx a').slice(0, 3));
            });

          function SomeImagesLoad (DOMs)
          {
            for (var i = 0; i < DOMs.length; i++)
            {
              var JO = $(DOMs[i]), // 'JO' = JQuery Object.
                  Img = $('<img src="' + JO.data('imageUrl') + '"/>');

              Img.on('load', function () { $(this).addClass('Show'); });
              JO.replaceWith(Img);
            }
          }
        </script>
      </footer>
    </div>
  </body>
</html>