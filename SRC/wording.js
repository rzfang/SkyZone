(function Wording () {
  const Wording = {
    DbCrash:         "資料庫異常。",
    DuplicateData:   "資料重複了。",
    HasLoggedIn:     "已經登入。",
    LoadDataFail:    "讀取資料發生問題。",
    NoSuchData:      "查無資料。",
    NotLogin:        "尚未登入。",
    PasswordNeed:    "需要密碼。",
    StrangeValue:    "資訊参數錯誤。",
    SystemError:     "系統錯誤。",
    UploadFail:      "上傳檔案失敗。",
    Working:         "處理中，請稍候。",
    WrongFileFormat: "不支援的檔案格式。",
    WrongPassword:   "密碼錯誤。",

    StepTest:        "Step Test.",
    Done:            "完成。"
  };

  if (typeof module !== 'undefined') { module.exports = Wording; }
  else if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { Wording }; }
    else { window.Z.Wording = Wording; }
  }
})();
