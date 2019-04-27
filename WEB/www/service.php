<?php
header('Content-Type: text/json; charset=utf-8');

require '../global.php';
require RSC_PTH . 'vendor/autoload.php';
require WEB_PTH . 'pdo_db.php';
require WEB_PTH . 'api.php';

if(empty($_POST) || !isset($_POST['Cmd']) || !filter_input(INPUT_POST, 'Cmd', FILTER_VALIDATE_INT))
{
  echo JSONString(-1, 'strange value.');
  return -1;
}

Db::Db0Connect();

switch($_POST['Cmd']) // 0~100: for SkyZone normal; 101~200: for Admin; 201~300: for RZ.
{
  case 1:
    echo Blog::BlogList($_POST); // migrated.
    break;

  case 2:
    echo Blog::OneRead($_POST); // migrated.
    break;

  case 3:
    echo Message::MessageList($_POST); // migrated.
    break;

  case 4:
    echo Message::Leave($_POST); // migrated.
    break;

  case 5:
    echo Message::ChainList($_POST); // migrated.
    break;

  case 6:
    echo ArtCorner::RandomOneGet(); // migrated.
    break;

  case 7:
    echo Tag::TagList($_POST); // migrated.
    break;

  case 8:
    echo Blog::CommentList($_POST); // migrated.
    break;

  case 9:
    echo Blog::CommentLeave($_POST); // migrated.
    break;

  case 10:
    echo System::TutorialList($_POST);
    break;

  case 11:
    echo GoodWords::NowOneGet(); // migrated.
    break;

  //==== 100+ are Admin functions. ====

  case 101:
    unset($_SESSION[SSN_ERR_HNT]);
    echo System::SessionLogout($_POST, Admin::$PswdSsnNm); // migrated.
    break;

  case 102:
    echo System::SessionLogin($_POST, Admin::$Pswd, Admin::$PswdSsnNm); // migrated.
    break;

  case 103:
    echo Blog::AdminList($_POST); // migrated, but doesn't handle files.
    break;

  case 104:
    echo Blog::Create($_POST);
    break;

  case 105:
    echo Blog::Update($_POST);
    break;

  case 106:
    echo Message::AdminList($_POST);
    break;

  case 107:
    echo Message::Delete($_POST);
    break;

  case 108:
    echo ArtCorner::Create($_POST, $_FILES);
    break;

  case 109:
    echo Blog::CommentDelete($_POST);
    break;

  case 110:
    echo Blog::Delete($_POST);
    break;

  case 111:
    echo Admin::CacheClear($_POST); // migrated.
    break;

  case 112:
    echo Admin::SizeUsedList($_POST); // migrated.
    break;

  case 113:
    echo Tag::Create($_POST); // migrated.
    break;

  case 114:
    echo Tag::Delete($_POST); // migrated.
    break;

  case 115:
    echo Admin::FeedPublish($_POST); // migrated.
    break;

  case 116:
    echo Admin::ErrorHintSwitch($_POST);
    break;

  case 117:
    echo Blog::FileUpload($_POST, $_FILES);
    break;

  case 118:
    echo Tag::Rename($_POST); // migrated.
    break;

  case 119:
    echo GoodWords::WordsList($_POST); // migrated.
    break;

  case 120:
    echo GoodWords::Create($_POST); // migrated.
    break;

  case 121:
    echo GoodWords::Delete($_POST); // migrated.
    break;

  case 122:
    echo GoodWords::Update($_POST); // migrated.
    break;

  case 0:
  default:
    echo JSONString(-2, 'unhandle request.');
}

return 0;
?>
