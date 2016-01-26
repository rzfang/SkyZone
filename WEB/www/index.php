<?php
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title><?= WEBSITE; ?></title>
    <meta http-equiv='content-type' content='text/html; charset=utf-8'/>
    <meta name='description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta name='keywords' content='空域, RZ, 個人網站'/>
    <meta name='author' content='RZ Fang'/>
    <meta property='og:title' content='<?= WEBSITE; ?>'/>
    <meta property='og:description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta property='og:url' content='<?= WEBSITE_URL; ?>'/>
    <meta property='og:type' content='website'/>
    <meta property='og:image' content='<?= WEBSITE_URL; ?>image/logo.jpg'/>
    <meta name='twitter:title' content='<?= WEBSITE; ?>'/>
    <meta name='twitter:description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta name='twitter:url' content='<?= WEBSITE_URL; ?>'/>
    <meta name='twitter:card' content='summary'/>
    <meta name='twitter:image' content='<?= WEBSITE_URL; ?>image/logo.jpg'/>
    <link rel='icon' href='favicon.ico' type='image/ico'/>
    <link rel='alternate' type='application/atom+xml' title='atom' href='feed.php'/>
    <style type='text/css'>
    <!--
      body { margin: 0px; padding: 0px; font-size: 16px; font-family: monospace; color: #202020;  }
      a, input, option, button { font-size: 16px; }
      a, a:visited { text-decoration: none; color: #0000ff; }
      a:hover { text-decoration: underline; color: #ff0000; }
      #Base { width: 1000px; min-height: 625px; margin: 10px auto; text-align: center; }
      #Head nav a { display: inline-block; min-width: 100px; font-size: 20px; }
      #Main { padding: 10px; }
    -->
    </style>
    <script type='text/javascript' src='resource/jquery.min.js'></script>
    <script type='text/javascript' src='resource/include.min.js'></script>
    <script type='text/javascript' src='resource/api.min.js'></script>
    <script type='text/javascript'>
    <!--
      var Clk = null;

      EmbedDeny();

      $(function()
        {
          var URLPrms = URLParameters(),
              AnmNbr = 2;

          var AnmIdx = (URLPrms.length === 0 || typeof URLPrms.Anm !== 'string') ?
                       Math.round(Math.random()) :
                       parseInt(URLPrms.Anm, 10) % AnmNbr;

          KeyboardCommand(PageNameGet());

          switch (AnmIdx)
          {
            case 1:
              CityView();
              break;

            case 0:
            default:
              CloudWalk();
          }
        });

      function CityView()
      {
        var VctA = [[1, 0], [0, 1], [1, 0], [0, -1]], // 'VctA' = Vector Array.
            Logo = new Image(),
            Anm = new Animation($('#Entry').get(0), []);

        var Blds0 = BuildingsInitialize(
              Anm,
              [160, 160, 192, 1],
              {'X': 0, 'Y': 150, 'W': Anm.ScnSz.W, 'H': 100},
              {'XMn': 3, 'XMx': 8, 'YMn': 5, 'YMx': 15},
              0.2); // 'Blds0' = Buildings 0.

        var Blds1 = BuildingsInitialize(
              Anm,
              [128, 128, 160, 1],
              {'X': 0, 'Y': 170, 'W': Anm.ScnSz.W, 'H': 100},
              {'XMn': 5, 'XMx': 20, 'YMn': 5, 'YMx': 30},
              0.5);

        var Blds2 = BuildingsInitialize(
              Anm,
              [96, 96, 128, 1],
              {'X': 0, 'Y': 180, 'W': Anm.ScnSz.W, 'H': 120},
              {'XMn': 15, 'XMx': 35, 'YMn': 10, 'YMx': 40},
              0.8);

        var Blds3 = BuildingsInitialize(
              Anm,
              [64, 64, 96, 1],
              {'X': 0, 'Y': 200, 'W': Anm.ScnSz.W, 'H': 180},
              {'XMn': 35, 'XMx': 60, 'YMn': 20, 'YMx': 80},
              1.3);

        Logo.src = 'image/logo_bg_b.png';

        Anm.ItemDrawAdd(function(Ctx, ScnSz)
          {
            BuildingsMove(Ctx, Blds0);
            BuildingsMove(Ctx, Blds1);
            BuildingsMove(Ctx, Blds2);
            BuildingsMove(Ctx, Blds3);
            BuildingFly(Ctx);
            Ctx.drawImage(Logo, (ScnSz.W - Logo.width) / 2, (ScnSz.H - Logo.height) / 2);
          });

        Anm.Start();

        return;

        /*
          'Anm' = Animation object.
          'LnrClr' = Linear Color object.
          'Rng' = Range object.
          'RdmRng' = Random Range object.
          'Spd' = Speed. */
        function BuildingsInitialize(Anm, LnrClr, Rng, RdmRng, Spd)
        {
          if (typeof Anm !== 'object' || Anm === null ||
             typeof Anm.Ctx !== 'object' || Anm.Ctx === null || typeof Anm.ScnSz !== 'object' || Anm.ScnSz === null ||
             typeof LnrClr !== 'object' || LnrClr === null ||
             typeof Rng !== 'object' || Rng === null ||
             typeof RdmRng !== 'object' || RdmRng === null ||
             typeof Spd !== 'number')
          { return {}; }

          var Cdnt = {'X': 0, 'Y': Rng.Y + (Rng.H / 2)}// 'Cdnt'  = Coordinate.

          var Blds = {'Rng': Rng,
                      'RdmRng': RdmRng,
                      'LnrGrdn': Anm.Ctx.createLinearGradient(Rng.X, Rng.Y, Rng.X, Rng.Y + Rng.H),
                      'PtA': [{'X': Cdnt.X, 'Y': Cdnt.Y, 'VctIdx': 3}],
                      'Spd': Spd};

          Blds.LnrGrdn.addColorStop(0, 'rgba(' + LnrClr.join(', ') + ')');
          Blds.LnrGrdn.addColorStop(1, 'rgba(255, 255, 255, 1)');

          for (var i = 0; Cdnt.X < Anm.ScnSz.W; i++)
          {
            var VctIdx = i % VctA.length,
                Vct = VctA[VctIdx];

            Cdnt.X += RandomRange(RdmRng.XMn, RdmRng.XMx) * Vct[0];
            Cdnt.Y += RandomRange(RdmRng.YMn, RdmRng.YMx) * Vct[1];

            if (Cdnt.Y < Blds.Rng.Y)
            { Cdnt.Y = Blds.Rng.Y; }
            else if (Cdnt.Y > Blds.Rng.Y + Blds.Rng.H)
            { Cdnt.Y = Blds.Rng.Y + Blds.Rng.H; }

            Blds.PtA.push({'X': Cdnt.X, 'Y': Cdnt.Y, 'VctIdx': VctIdx});
          }

          return Blds;
        }

        function BuildingsMove(Ctx, Blds)
        {
          Ctx.fillStyle = Blds.LnrGrdn;

          Ctx.beginPath();
          Ctx.moveTo(0, Blds.PtA[0].Y);

          for (var i = 0; i < Blds.PtA.length; i++)
          {
            Ctx.lineTo(Blds.PtA[i].X, Blds.PtA[i].Y);

            Blds.PtA[i].X += Blds.Spd;
          }

          if (Blds.PtA[Blds.PtA.length - 2].X > Blds.Rng.W)
          { Blds.PtA.pop(); }

          if (Blds.PtA[1].X > 0)
          {
            var Pt = {'X': 0, 'Y': 0, 'VctIdx': (Blds.PtA[0].VctIdx - 1 + VctA.length) % VctA.length},
                Vct = VctA[Pt.VctIdx];

            Pt.X = Blds.PtA[0].X - RandomRange(Blds.RdmRng.XMn, Blds.RdmRng.XMx) * Vct[0];
            Pt.Y = Blds.PtA[0].Y - RandomRange(Blds.RdmRng.YMn, Blds.RdmRng.YMx) * Vct[1];

            if (Pt.Y < Blds.Rng.Y)
            { Pt.Y = Blds.Rng.Y; }
            else if (Pt.Y > Blds.Rng.Y + Blds.Rng.H)
            { Pt.Y = Blds.Rng.Y + Blds.Rng.H; }

            Blds.PtA.unshift(Pt);
          }

          Ctx.lineTo(Blds.Rng.W, Blds.Rng.Y + Blds.Rng.H);
          Ctx.lineTo(Blds.Rng.X, Blds.Rng.Y + Blds.Rng.H);
          Ctx.fill();
        }

        function BuildingFly()
        {
        }
      }

      function CloudWalk()
      {
        var Anm = new Animation($('#Entry').get(0), [], BaseSceneryDraw),
            ImgA = [new Image(), new Image(), new Image()], // 'ImgA' = Image Array.
            Logo = new Image(),
            Clds = new Array(30), // 'Clds' = Cloud.
            LdCnt = 0, // 'LdCnt' = Load Count.
            BsLnrClr = BaseSceneryInitialize(Anm);

        CloudInitialize(function(){ Anm.Start(); });

        Anm.ItemDrawAdd(function(Ctx, ScnSz)
          {
            CloudFly(Ctx, ScnSz);
            Ctx.drawImage(Logo, (ScnSz.W - Logo.width) / 2, (ScnSz.H - Logo.height) / 2);
          });

        return;

        function BaseSceneryInitialize(Anm)
        {
          var BsClr = Anm.Ctx.createLinearGradient(0, 0, 0, Anm.ScnSz.H),
              Dt = new Date(),
              Hr = Dt.getHours();

          if (Hr > 6 && Hr < 18)
          {
            BsClr.addColorStop(0, '#80c0ff');
            BsClr.addColorStop(1, '#f0f0f0');
          }
          else
          {
            BsClr.addColorStop(0, '#000000');
            BsClr.addColorStop(1, '#00257d');
          }

          return BsClr;
        }

        function BaseSceneryDraw(Ctx, ScnSz)
        {
          Ctx.fillStyle = BsLnrClr;
          Ctx.fillRect (0, 0, ScnSz.W, ScnSz.H);
        }

        /*
          'SttF' = Start Function. */
        function CloudInitialize(SttF)
        {
          ImgA[0].onload = function(){ LdCnt++; };
          ImgA[0].src = 'image/animate/cloud_01.png';
          ImgA[1].onload = function(){ LdCnt++; };
          ImgA[1].src = 'image/animate/cloud_02.png';
          ImgA[2].onload = function(){ LdCnt++; };
          ImgA[2].src = 'image/animate/cloud_03.png';
          Logo.src = 'image/logo_bg.png';

          ReadyAndStart();

          return;

          function ReadyAndStart()
          {
            setTimeout(function()
              {
                if (LdCnt !== ImgA.length)
                { return ReadyAndStart(); }

                for (var i = 0; i < Clds.length; i++)
                {
                  var ImgIdx = RandomRange(0, ImgA.length - 1),
                      Rt = RandomRange(1, 10) * 5 * (1 / Clds.length);

                  Clds[i] = {'ImgURL': ImgA[ImgIdx],
                             'Lct': {'X': RandomRange(0, Anm.ScnSz.W),
                                     'Y': RandomRange(0, Anm.ScnSz.H)},
                             'Sz': {'W': ImgA[ImgIdx].width * Rt,
                                    'H': ImgA[ImgIdx].height * Rt},
                             'Vct': [RandomRange(0.5, Rt * 5 + 1, 1), 1]};
                }

                Clds.sort(function(A, B)
                  {
                    if (B.Vct[0] < A.Vct[0])
                    { return -1; }
                  });

                Anm.Start();
              },
              100);
          }
        }

        function CloudFly(Ctx, ScnSz)
        {
          for (var i = 0; i < Clds.length; i++)
          {
            var Cld = Clds[i];

            Ctx.drawImage(Cld.ImgURL, Cld.Lct.X, Cld.Lct.Y, Cld.Sz.W, Cld.Sz.H);

            Cld.Lct.X += Cld.Vct[0];

            if (Cld.Lct.X > ScnSz.W)
            {
              Cld.Lct.X = Cld.Sz.W * -1;
              Cld.Lct.Y = RandomRange(0, Anm.ScnSz.H);
            }
          }
        }
      }
    -->
    </script>
  </head>
  <body>
    <div id='Template'> <!-- Template -->
    </div>
    <div id='Base'>
      <header id='Head'> <!-- Head -->
        <nav>
          <a href='http://webtool.zii.tw'>線上程式工具</a>
          <a href='zone.php'>空域</a>
          <!-- <a href='http://mrname.zii.tw'>單機程式工具</a> -->
          <!-- <a href='zakool.zii.php'>雜酷-舊物交流網</a> -->
        </nav>
      </header>
      <div id='Main'> <!-- Main -->
        <a href='zone.php'>
          <canvas id='Entry' width='640' height='480' style='box-shadow: 0px 0px 5px;'>您的瀏覽器不支援動畫。</canvas>
        </a>
        <div>
          首頁動畫：
          <a href='?Anm=0'>飄雲</a>
          <a href='?Anm=1'>城市</a>
          <a href='?'>隨機</a>
        </div>
      </div>
      <footer id='Tail'> <!-- Tail -->
        <?= $Kw['Hnt']['TailHint'] . ' ' . $Kw['Hnt']['Copyright']; ?>
      </footer>
    </div>
  </body>
</html>
