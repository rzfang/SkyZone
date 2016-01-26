<?php
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require RSC_PTH . 'vendor/autoload.php';
require WEB_PTH . 'api.php';

ini_set('memory_limit', '32M');

$FP = WEB_PTH . 'www/image/null.png';

if(empty($_GET))
  ImageFileOut($FP);
else if(!empty($_GET['B'])) // 'B' = Blog.
{
  if(empty($_GET['FN']))
  {
    ImageFileOut($FP);
    exit;
  }

  $BlgFN = StringEnDeCode($_GET['B'], false); // '$BlgFN' = Blog File Name.
  $ImgFN = StringEnDeCode($_GET['FN'], false); // '$ImgFN' = Image File Name in tar file.
  $CchFP = CCH_PTH . substr($BlgFN, 0, -4) . '-' . $ImgFN; // '$CchFP' = Cache File Path.
  $TarFP = DAT_PTH . "blog/$BlgFN"; // '$TarFP' = Tar File Path.

  if(isset($_GET['Tbn']))
  {
    $CTFP = CCH_PTH . substr($BlgFN, 0, -4) . '-' . str_replace('.', '_T.', $ImgFN); // '$CTFP' = Cache Thumbnail File Path.

    if(is_file($CTFP))
    {
      ImageFileOut($CTFP);
      exit;
    }
  }

  if(is_file($CchFP))
  {
    ImageFileOut($CchFP);
    exit;
  }

  System::TarImageOut($TarFP, $ImgFN);
}
else if(!empty($_GET['A'])) // 'A' = ArtCorner.
{
  if(empty($_GET['FN']))
  {
    ImageFileOut($FP);
    exit;
  }

  $AtCnrFN = StringEnDeCode($_GET['A'], false);
  $ImgFN = StringEnDeCode($_GET['FN'], false);
  $CchFP = CCH_PTH . substr($AtCnrFN, 0, -4) . '-' . $ImgFN;
  $TarFP = DAT_PTH . "artcorner/$AtCnrFN";

  if(is_file($CchFP))
  {
    ImageFileOut($CchFP);
    exit;
  }

  System::TarImageOut($TarFP, $ImgFN);
}

exit;

//======================================================================================================================
?>
