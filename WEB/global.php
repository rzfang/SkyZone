<?php
//==== Constant ========================================================================================================

define('RT_PTH', dirname(__FILE__) . '/../');
require(RT_PTH . 'SRC/constants.php');

if (DEV)
{
  // website URL.
  define('WEBSITE_URL', 'http://127.0.0.1/skyzone/');
}
else
{
  // website URL.
  define('WEBSITE_URL', 'http://skyzone.zii.tw/');
}

//==== Initialize ======================================================================================================

require(WEB_PTH . 'keyword.php'); // import keyword values.

ErrorHintHandle(); // this also start session.

//==== Tool Function ===================================================================================================

/* check if the service request Is AJAX.
  Return: true | false. */
function IsAJAX ()
{
  return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'));
}

function IsEMail ($MlStr)
{
  if (empty($MlStr) || !is_string($MlStr))
    return false;

  //==== version 1. ====

  // $Chk = preg_match("/^[\w.]+@.{2,16}\.[0-9a-z]{2,3}$/", $MlStr);

  // return $Chk > 0 ? true : false;

  //==== version 2. ====

  return filter_var($MlStr, FILTER_VALIDATE_EMAIL);
}

/* check if a string is a URL.
    '$Str' = String for checking.
    Return: true | false. */
function IsURL ($Str)
{
    if (!is_string($Str) || empty($Str))
      return false;

    $RERst = preg_match('/^https?:\/\/\S+$/', $Str);

    if ($RERst !== 1)
      return false;

    return true;
}

function IsTimeStamp ($TmStr)
{
  if (empty($TmStr) || !is_string($TmStr))
    return false;

  $Chk = preg_match("/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/", $TmStr);

  return $Chk > 0 ? true : false;
}

/* Check is a string is UUID.
  '$B32' = UUID be 32 bits, without '-' in default 36 bits.
  Return: UUID format string. */
function IsUUID ($IDStr, $B32 = false)
{
  if (empty($IDStr) || !is_string($IDStr))
    return false;

  $Chk = 0;

  if (!is_bool($B32) || !$B32)
    $Chk = preg_match("/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/", $IDStr);
  else
    $Chk = preg_match("/^[0-9a-fA-F]{32}$/", $IDStr);

  return $Chk > 0 ? true : false;
}

/* Create a UUID format string.
  '$B32' = UUID be 32 bits, without '-' in default 36 bits.
  Return: UUID format string. */
function UUID ($B32 = false)
{
  $ID = md5(uniqid(mt_rand(), true));

  if ($B32)
    return $ID;

  return substr($ID, 0, 8) . '-' . substr($ID, 8, 4) . '-' . substr($ID, 12, 4) . '-' . substr($ID, 16, 4) . '-' .
         substr($ID, 20, 12);
}

/* Try to get client IP.
  Return: getting IP. */
function GetIP ()
{
  if (isset($_SERVER['HTTP_CLIENT_IP']))
    return $_SERVER['HTTP_CLIENT_IP'];
  else if (isset($_SERVER['HTTP_X_FORWARDED_FOR']))
    return $_SERVER['HTTP_X_FORWARDED_FOR'];
  else if (isset($_SERVER['REMOTE_ADDR']))
    return $_SERVER['REMOTE_ADDR'];
  else
    return 'none';
}

/* response a XML from ajax request.
  '$Idx' = Index.
  '$Msg' = Message.
  '$Ext' = Extend Array.
  '$ExtNm' = Extend key name.
  Return: JSON format string of result. */
function JSONString ($Idx, $Msg, $Ext = null, $ExtNm = '')
{
  $Arr = array();

  $Arr['Index'] = $Idx;
  $Arr['Message'] = $Msg;

  if ($Ext !== null)
  {
    if (empty($ExtNm) || !is_string($ExtNm))
      $Arr['Extend'] = $Ext;
    else
      $Arr[$ExtNm] = $Ext;
  }

  return json_encode($Arr);
}

/* Pack Return data from server to client, or origin data when asked.
  '$Cd' = Code of result.
  '$Msg' = Message.
  '$Ext' = Extend data. optional, default null.
  '$RtnMd' = Return Mode by manual. optional, 0: default in status, 1: origin data, 2: JSON string, 3: array($Cd, $Msg).
  Return: JSON string of data in AJAX mode | data itself.
  Need: IsAJAX(), JSONString(). */
function ReturnPack ($Cd, $Msg, $Ext = null, $RtnMd = 0)
{
  $Md = (!is_numeric($RtnMd) || $RtnMd < 0 || $RtnMd > 3) ? 0 : $RtnMd;

  switch ($Md)
  {
    case 0:
      if (IsAJAX())
        return JSONString($Cd, $Msg, $Ext);
      return $Ext;

    case 1:
      return $Ext;

    case 2:
      return JSONString($Cd, $Msg, $Ext);

    case 3:
      return array('Idx' => $Cd, 'Msg' => $Msg);
  }
}

/* Encode or Decode a String.
  '$Str' = String to encode / decode.
  '$Ecd' = flag to Encode or decode. optional, default true;
  Return: Encode / Decode string. or empty string as error. */
function StringEnDeCode ($Str, $Ecd = true)
{
  if (!is_string($Str) || empty($Str))
    return '';

  if (!is_bool($Ecd))
    $Ecd = true;

  $EnDeStr = ''; // '$EnDeStr' = Encode / Decode String.

  if ($Ecd)
    $EnDeStr = str_replace('=', '', base64_encode(rawurlencode($Str))); // '$TS' = Temp String.
  else
    $EnDeStr = rawurldecode(base64_decode($Str));

  return $EnDeStr;
}

/* recursive scan and list file / directory by given path.
  '$RtPth' = Root Path to scan.
  '$Tp' = Type, optional, default 0 as file & directory, 1 as file only, 2 as directory only.
  Return: array of file / directory full path, or empty array as error. */
function FileList ($RtPth, $Tp = 0)
{
  if (empty($RtPth) || !is_dir($RtPth))
    return array();

  if (substr($RtPth, -1) != '/')
    $RtPth .= '/';

  if (empty($Tp) || !is_numeric($Tp) || $Tp < 0)
    $Tp = 0;

  $TA = array_slice(scandir($RtPth, 0), 2);
  $FA = array();
  $DA = array();

  foreach($TA as $V)
  {
    $TP = $RtPth . $V;

    if (is_file($TP))
      $FA[] = $TP;
    else if (is_dir($TP))
      $DA[] = $TP . '/';
  }

  $RA = array();

  foreach($DA as $V)
    $RA = array_merge($RA, FileList($V, $Tp));

  if ($Tp == 1)
    $RA = array_merge($FA, $RA);
  else if ($Tp == 2)
    $RA = array_merge($DA, $RA);
  else
    $RA = array_merge($FA, $DA, $RA);

  return $RA;
}

/* get Image Mime Type From file binary stream. this function is found from internet, it's fantastic.
  '$Str' = Stream of file.
  Return: mime type string. */
function ImageMimeTypeFromStream ($Str)
{
  $Ht = 0; // '$Ht' = Hits.

  if (!preg_match('/\A(?:(\xff\xd8\xff)|(GIF8[79]a)|(\x89PNG\x0d\x0a)|(BM)|(\x49\x49(\x2a\x00|\x00\x4a))|(FORM.{4}ILBM))/',
                 $Str, $Ht))
      return 'application/octet-stream';

  $Tp = array(1 => 'image/jpeg',            2 => 'image/gif',   3 => 'image/png',
              4 => 'image/x-windows-bmp',   5 => 'image/tiff',  6 => 'image/x-ilbm');

  return $Tp[count($Ht) - 1];
}

/* print Image File stream to standard Out. the process will be end immediately after this called.
  '$FlPth' = File Path.
  Return: 0 as OK, < 0 as error.
  Need: GD library. */
function ImageFileOut ($FlPth)
{
  $TFP = WEB_PTH . 'www/image/null.png'; // '$TFP' = Temp File Path.

  if (!is_file($FlPth))
  {
    $FlPth = $TFP;

    if (!is_file($FlPth))
    {
      header('HTTP/1.0 404 Not Found');
      exit;
    }
  }

  $FS = file_get_contents($FlPth);
  $MT = ImageMimeTypeFromStream($FS); // '$MT' = Mime Type.
  $I = imagecreatefromstring($FS);

  unset($FS);

  header("Content-Type: $MT");

  switch ($MT)
  {
    case 'image/png':
      // header('Content-Disposition: Attachment; filename=Image.png');
      header('Content-Disposition: Inline; filename=Image.png');
      imagealphablending($I, false); // conside some enviroment out of handle, set it to make sure.
      imagesavealpha($I, true);
      imagepng($I);
      break;

    case 'image/gif':
      header('Content-Disposition: Inline; filename=Image.gif');
      imagegif ($I);
      break;

    case 'image/jpeg':
    default:
      header('Content-Disposition: Inline; filename=Image.jpg');
      imagejpeg($I);
  }
  imagedestroy($I);

  exit;
}

/* send mail.
  '$Frm' = the E-Mail send from.
  '$To' = the E-Mail send to.
  '$Ttl' = Title of E-Mail.
  '$Ctn' = Content of E-Mail.
  '$FrmNm' = the Name of E-mail send from. optional.
  Return: 0 as OK, < 0 as error. */
function MailSend ($Frm, $To, $Ttl, $Ctn, $FrmNm = '')
{
  if (empty($Frm) || !IsEMail($Frm) || empty($To) || !IsEMail($To) || empty($Ttl) || !is_string($Ttl) ||
     empty($Ctn) || !is_string($Ctn))
    return -1;

  mb_internal_encoding('UTF-8');

  if (!empty($FrmNm) && !is_string($FrmNm))
    $Frm = mb_encode_mimeheader($FrmNm, 'UTF-8') . " <$Frm>";

  $Hd = "Mime-Version: 1.0\n" .
        "Content-Type: text/plain;charset=UTF-8\n" .
        "From: $Frm";

  // $Ttl = mb_encode_mimeheader($Ttl, 'UTF-8');

  if (!mb_send_mail($To, $Ttl, $Ctn, $Hd))
    return -2;

  return 0;
}

/* print a image file stream. call this will end the process immediately.
  Notice: this will register a session value named 'ImgCd'. */
function CodeImage ()
{
  if (session_id() === '')
    session_start();

  $BgClrA = array(0x00ffc0c0, 0x00c0ffc0, 0x00c0c0ff, 0x00ffffc0, 0x00ffc0ff, 0x00c0ffff); // '$BgClrA' = Background Color Array.
  $ClrIdx = array_rand($BgClrA);
  $Str = '';

  $IvtClr = ((255 - (($BgClrA[$ClrIdx] & 0x00ff0000) >> 16)) << 16) +
            ((255 - (($BgClrA[$ClrIdx] & 0x0000ff00) >> 8)) << 8) +
            (255 - ($BgClrA[$ClrIdx] & 0x000000ff));

  $Img = imagecreatetruecolor(100, 20);

  imagefill($Img, 0, 0, $BgClrA[$ClrIdx]); // background color set.

  for ($i = 0; $i < 5; $i++)
  {
    $Chr = chr(mt_rand(65, 90));
    $Str .= $Chr;

    imagestring($Img, 5, $i * 20 + 5, 3, $Chr, $IvtClr);
  }

  $_SESSION['ImgCd'] = $Str;

  for ($i = 0; $i < 100; $i++)
    imagesetpixel($Img, mt_rand(1, 98), rand(1, 18), $IvtClr);

  header('Content-type: image/png');
  imagepng($Img);
  imagedestroy($Img);

  exit;
}

/* parse & replace value to string with number symbol ?*?.
  '$Str' = String to parse.
  '&$VA' = Value Array, which are replaceing for '$Str'. passing by reference for skipping large memory useed.
  Return: result string, or '' as error. */
function SymbolString ($Str, &$VA)
{
  if (empty($Str) || !is_string($Str) || !is_array($VA))
    return '';

  foreach($VA as $K => $V)
  {
    $Tgt = '?' . ($K + 1) . '?';
    $Str = str_replace($Tgt, $V, $Str);
  }

  return $Str;
}

// function UploadINI

// /* Convert body to same encoding as stated
// in Content-Type header above */

// $body = mb_convert_encoding($body, "ISO-2022-JP","AUTO");

// /* Mail, optional paramiters. */
// $sendmail_params  = "-f$from_email";

// mb_language("ja");
// $subject = mb_convert_encoding($subject, "ISO-2022-JP","AUTO");
// $subject = mb_encode_mimeheader($subject);
// $result = mail($to, $subject, $body, $headers, $sendmail_params);

// return $result;

//==== Sky Zone Function  ==============================================================================================

/* handle the error message shown or hidden. this will start the session. */
function ErrorHintHandle ()
{
  if (session_id() === '')
    session_start();

  if (DEV || (isset($_SESSION[SSN_ERR_HNT]) && $_SESSION[SSN_ERR_HNT]))
  {
    ini_set('display_errors', 1);
    ini_set('error_reporting', E_ALL);
  }
  else
  {
    ini_set('display_errors', 0);
    ini_set('error_reporting', E_ERROR);
  }
}

//======================================================================================================================
?>
