<?php
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require WEB_PTH . 'api.php';

$FP = DAT_PTH . Admin::$WbstFdFlNm;

if(!is_file($FP))
  return 0;

$FS = filesize($FP); // '$FS' = File Size.

header("Content-Length: $FS");
header('Content-Type: application/xml');

readfile($FP);

return 0;

//======================================================================================================================
?>
