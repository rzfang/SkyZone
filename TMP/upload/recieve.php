<?php
header('Content-Type: text/html; charset=utf-8');

require '../../global.php';

// ini_set('memory_limit', '55M');
// ini_set('upload_max_filesize', '50M');
// ini_set('post_max_size', '51M');
// ini_set('max_execution_time', '3600');
// ini_set('max_input_time', '3600');

global $Kw;

$DirPth = DAT_PTH . 'upload/';
$CdMpFl = 'codemap.txt';

if(empty($_FILES) || empty($_FILES['Fl']) || !is_array($_FILES['Fl']) ||
   !isset($_FILES['Fl']['error']) || $_FILES['Fl']['error'] != 0 ||
   empty($_POST) || empty($_POST['Cd']) || !is_string($_POST['Cd']))
{
  echo ReturnPack(-1, '上傳檔案失敗。');
  exit;
}

if(!is_dir($DirPth))
{
  if(!mkdir($DirPth, FILE_MOD))
  {
    echo ReturnPack(-2, $Kw['RM']['SystemError']);
    exit;
  }
}

$FlPth = $DirPth . $CdMpFl;

if(!is_file($FlPth))
{
  if(file_put_contents($FlPth, '') === false)
  {
    echo ReturnPack(-3, $Kw['RM']['SystemError']);
    exit;
  }
}

$TS = file_get_contents($FlPth);

if($TS === false || empty($TS))
{
  echo ReturnPack(-4, '上傳檔案功能關閉中。');
  exit;
}

$CdA = explode("\n", $TS);

foreach($CdA as $K => $V)
{
  $TA = explode('//', $V);
  $CdA[$K] = trim($TA[0]);
}

if(!in_array($_POST['Cd'], $CdA))
{
  echo ReturnPack(-5, '驗證碼錯誤，或是此驗證碼已不可使用。');
  exit;
}

$Ext = strrpos($_FILES['Fl']['name'], '.');
$SvFlNm = date('YmdHis') . '-' . $_POST['Cd'];

if($Ext !== false)
  $SvFlNm .= substr($_FILES['Fl']['name'], $Ext);

if(!move_uploaded_file($_FILES['Fl']['tmp_name'], $DirPth . $SvFlNm))
{
  echo ReturnPack(-6, $Kw['RM']['SystemError']);
  exit;
}

echo ReturnPack(0, $Kw['RM']['Done']);

//======================================================================================================================
?>
