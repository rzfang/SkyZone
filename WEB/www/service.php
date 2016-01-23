<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(RSC_PTH . 'vendor/autoload.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');


if(empty($_POST) || !isset($_POST['Cmd']) || !filter_input(INPUT_POST, 'Cmd', FILTER_VALIDATE_INT))
{
  echo JSONString(-1, 'strange value.');
  return -1;
}

Db::Db0Connect();

switch($_POST['Cmd']) // 0~100: for SkyZone normal; 101~200: for Admin; 201~300: for RZ.
{
  case 1:
    echo Blog::BlogList($_POST);
    break;

  case 2:
    echo Blog::OneRead($_POST);
    break;

  case 3:
    echo Message::MessageList($_POST);
    break;

  case 4:
    echo Message::Leave($_POST);
    break;

  case 5:
    echo Message::ChainList($_POST);
    break;

  case 6:
    echo ArtCorner::RandomOneGet();
    break;

  case 7:
    echo Tag::TagList($_POST);
    break;

  case 8:
    echo Blog::CommentList($_POST);
    break;

  case 9:
    echo Blog::CommentLeave($_POST);
    break;

  case 10:
    echo System::TutorialList($_POST);
    break;

  case 11:
    echo GoodWords::NowOneGet();
    break;

  //==== 100+ are Admin functions. ====

  case 101:
    unset($_SESSION[SSN_ERR_HNT]);
    echo System::SessionLogout($_POST, Admin::$PswdSsnNm);
    break;

  case 102:
    echo System::SessionLogin($_POST, Admin::$Pswd, Admin::$PswdSsnNm);
    break;

  case 103:
    echo Blog::AdminList($_POST);
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
    echo Admin::CacheClear($_POST);
    break;

  case 112:
    echo Admin::SizeUsedList($_POST);
    break;

  case 113:
    echo Tag::Create($_POST);
    break;

  case 114:
    echo Tag::Delete($_POST);
    break;

  case 115:
    echo Admin::FeedPublish($_POST);
    break;

  case 116:
    echo Admin::ErrorHintSwitch($_POST);
    break;

  case 117:
    echo Blog::FileUpload($_POST, $_FILES);
    break;

  case 118:
    echo Tag::Rename($_POST);
    break;

  case 119:
    echo GoodWords::WordsList($_POST);
    break;

  case 120:
    echo GoodWords::Create($_POST);
    break;

  case 121:
    echo GoodWords::Delete($_POST);
    break;

  case 122:
    echo GoodWords::Update($_POST);
    break;

  //==== 200+ are RZ tool functions. ====

  case 201:
    echo System::SessionLogout($_POST, RZTool::$PswdSsnNm);
    break;

  case 202:
    echo System::SessionLogin($_POST, RZTool::$Pswd, RZTool::$PswdSsnNm);
    break;

  case 203:
    echo RZTool::NoteLoad();
    break;

  case 204:
    echo RZTool::NoteSave($_POST);
    break;

  // case 205 RZTool::ShareFileList is sunset.

  case 206:
    echo RZTool::FeedList($_POST);
    break;

  case 207:
    echo RZTool::FeedAdd($_POST);
    break;

  case 208:
    echo RZTool::FeedDel($_POST);
    break;

  case 209:
    echo RZTool::UploadCodeMapLoad($_POST);
    break;

  case 210:
    echo RZTool::UploadCodeMapSave($_POST);
    break;

  case 211:
    echo RZTool::FeedGroupRename($_POST);
    break;

  case 212:
    echo RZTool::FeedGroupAdd($_POST);
    break;

  case 213:
    echo RZTool::FeedGroupDel($_POST);
    break;

  case 214:
    echo RZTool::FeedroupChange($_POST);
    break;

  case 0:
  default:
    echo JSONString(-2, 'unhandle request.');
}

return 0;
?>
