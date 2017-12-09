(function Z_Log_API () {
  function Log (Info, Lv = 2) {
    switch (Lv) {
      case 0:
      case 'error':
        console.error('\n---- [ERROR] ----');
        console.error(Info);

        break;

      case 1:
      case 'warn':
        console.warn('\n---- [WARN ] ----');
        console.warn(Info);

        break;

      case 2:
      case 'log':
        console.log('\n---- [ LOG ] ----');
        console.log(Info);

        break;

      case 3:
      case 'debug':
        console.log('\n---- [DEBUG] ----');
        console.log(Info);

        break;
    }
  }

  if (typeof module !== 'undefined') { module.exports = Log; }
  else if (typeof window !== 'undefined') {
    if (!window.Z || typeof window.Z !== 'object') { window.Z = { Log: Log }; }
    else { window.Z.Log = Log; }
  }
})();