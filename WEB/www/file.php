<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'api.php');

$WrnMsg = '此檔案不存在 或是 已經不再提供下載了。';
$FP = '';

if(empty($_GET))
{
  echo $WrnMsg;
  exit;
}
else if(!empty($_GET['S'])) // 'S' = Share.
{
  $FP = DAT_PTH . 'share/' . $_GET['S'];

  if(!is_file($FP))
  {
    echo $WrnMsg;
    exit;
  }
}
else if(!empty($_GET['U'])) // 'U' = Upload.
{
  $FP = DAT_PTH . 'upload/' . $_GET['U'];

  if(!is_file($FP))
  {
    echo $WrnMsg;
    exit;
  }
}

header('Content-Length: ' . filesize($FP));
header('Content-Disposition: Attachment; filename=' . basename($FP));
header('Content-Type: application/octet-stream');
ob_end_flush();
readfile($FP);

exit;
//======================================================================================================================
?>
