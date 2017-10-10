(function Z_RiotMixin_API () {
  var Srvc = { // service.
        Rprt: {}, // report.
        Sto: {} // data store.
      },
      RM; // 'RM' = RiotMixin.

  /* make a AJAX request.
    @ AJAX Info object, key-value pairs.
    Return: XMLHttpRequest object. or null as error. */
  function AJAX (Info) {
    var DftInfo = {
          URL: '',
          Data: {},
          Files: {},
          Err: function (Sts) {}, // Error callback function. optional. 'Sts' = HTTP Status code.
          OK: function (RpsTxt, Sts) {}}, // OK callback function. optional. 'RpsTxt' = Response Text, 'Sts' = HTTP Status code.
        FmDt, // 'FmDt' = Form Data.
        XHR,
        Kys, // 'Kys' = Keys.
        i;

    if (typeof Info.URL !== 'string' || Info.URL === '') { return null; }

    Info.Data = (typeof Info.Data === 'object' && Info.Data !== null) ? Info.Data : DftInfo.Data;
    Info.Mthd = Info.Mthd === 'POST' ? 'POST' : 'GET'; // Method. can only be 'GET'|'POST'. optional, default 'GET'.
    Info.Bfr = (typeof Info.Bfr === 'function') ? Info.Bfr : function () {}; // Before callback function. optional.
    Info.Err = (typeof Info.Err === 'function') ? Info.Err : DftInfo.Err;
    Info.OK = (typeof Info.OK === 'function') ? Info.OK : DftInfo.OK;
    Info.End = (typeof Info.End === 'function') ? Info.End : function () {};
    Info.Pgs = (typeof Info.Pgs === 'function') ? Info.Pgs : function () {}; // Progress callback function. optional.

    FmDt = new FormData(),
    XHR = new XMLHttpRequest();
    Kys = Object.keys(Info.Data);

    for (var i = 0; i < Kys.length; i++) {
      var Tp = typeof Info.Data[Kys[i]];

      if (Array.isArray(Info.Data[Kys[i]])) {
        var Ky = Kys[i] + '[]',
            Vl = Info.Data[Kys[i]],
            Lth = Vl.length;

        for (var j = 0; j < Lth; j++) { FmDt.append(Ky, Vl[j]); }
      }
      else if (Tp === 'string' || Tp === 'number') { FmDt.append(Kys[i], Info.Data[Kys[i]]); }
    }

    if (typeof Info.File === 'object' && Info.File !== null) {
      Kys = Object.keys(Info.File);

      for (var i = 0; i < Kys.length; i++) { FmDt.append(Kys[i], Info.File[Kys[i]]); }
    }

    XHR.timeout = 5000;
    XHR.onreadystatechange = StateChange;
    XHR.upload.onprogress =  function (Evt) { Info.Pgs(Evt.loaded, Evt.total, Evt); };

    // XHR.overrideMimeType('text/xml');
    XHR.open(Info.Mthd, Info.URL);
    XHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // to use AJAX way.

    if (typeof Info.Hdrs === 'object' && Info.Hdrs !== null) {
      Kys = Object.keys(Info.Hdrs);

      for (var i = 0; i < Kys.length; i++) { XHR.setRequestHeader(Kys[i], Info.Hdrs[Kys[i]]); }
    }

    XHR.send(FmDt);

    return XHR;

    function StateChange () {
      switch (this.readyState) {
        case 0:
          Info.Bfr();

          break;

        case 1:
        case 2:
        case 3:
          break;

        case 4:
          if (this.status === 200) { Info.OK(this.responseText, this.status, this); }
          else { Info.Err(this.status); }

          Info.End();

          break;
      }
    }
  }

  /* do the 'Tsk' function is on the browser environment.
    @ the task function will run on client (browser) side.
    return: bool. */
  function OnBrowser (Tsk) {
    if (typeof window === 'undefined' || typeof Tsk !== 'function') { return false; }

    Tsk();

    return true;
  }

  /* do the 'Tsk' function if on the node environment.
    @ the task function will run on server (node) side.
    return: bool. */
  function OnNode (Tsk) {
    if (typeof module === 'undefined' || typeof Tsk !== 'function') { return false; }

    Tsk();

    return true;
  }

  function Trim (Str) {
    if (typeof Str !== 'string') { return ''; }

    return Str.replace(/^\s+|\s+$/g, '');
  }

  /*
    StoNm = name to locate the store.
    Thn(Sto, Rst) = then, a function when the task done.
      Sto = the store object. */
  function StoreListen (StoNm, Thn) {
    var Clbcks = Srvc.Rprt[StoNm] || null;

    if (!Clbcks || !Array.isArray(Clbcks)) {
      Srvc.Rprt[StoNm] = [];
      Clbcks = Srvc.Rprt[StoNm];
    }

    Srvc.Rprt[StoNm].push(Thn);

    if (Srvc.Sto[StoNm]) { Thn(Srvc.Sto[StoNm], null); } // if the task store is ready, call once first.
  }

  /*
    URL = URL string, the service entry point.
    Prms = params object to call service.
    StoNm = name to locate the store.
    NewStoreGet (Sto, Rst) = the function to get new store, this must return something to replace original store.
      Sto = original store data.
      Rst = result from API.
    PrmsToTsk = params object passing to each task. */
  function ServiceCall (URL, Prms, StoNm, NewStoreGet, PrmsToTsk) {
    if (!URL || typeof URL !== 'string' ||
        !StoNm || typeof StoNm !== 'string' ||
        !NewStoreGet || typeof NewStoreGet !== 'function')
    { return -1; }

    AJAX({
      URL: URL,
      Mthd: 'POST',
      Data: Prms,
      Err: function (Sts) {
        console.log('---- AJAX query fail ----\nURL: ' + URL + '\nparams:');
        console.log(Prms);
        console.log('----\n');

        Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm], '');
      },
      OK: function (RspnsTxt, Sts, XHR) {
        var CntTp = XHR.getResponseHeader('content-type'),
            Rst = RspnsTxt,
            Rprt = Srvc.Rprt[StoNm] || [],
            Lnth = Rprt && Array.isArray(Rprt) && Rprt.length || 0;

        if (Rst && (CntTp.indexOf('application/json') > -1 || CntTp.indexOf('text/json') > -1)) {
          Rst = JSON.parse(Rst);
        }

        Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm], Rst);

        for (var i = 0; i < Lnth; i++) { Rprt[i](Srvc.Sto[StoNm], PrmsToTsk); }
      }
    });

    return 0;
  }

  /*
    StoNm = name to locate the store.
    NewStoreGet (Sto, Rst) = the function to get new store, this must return something to replace original store.
      Sto = original store data.
    PrmsToTsk = params object passing to each task. */
  function StoreSet (StoNm, NewStoreGet, PrmsToTsk) {
    if (!StoNm || typeof StoNm !== 'string' || !NewStoreGet || typeof NewStoreGet !== 'function') { return -1; }

    var Rprt = Srvc.Rprt[StoNm] || [],
        Lnth = Rprt && Array.isArray(Rprt) && Rprt.length || 0;

    Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm]);

    for (var i = 0; i < Lnth; i++) { Rprt[i](Srvc.Sto[StoNm], PrmsToTsk); }

    return 0;
  }

  /* get a store.
    Ky = a string of store key.
    return: store object, or null. */
  function StoreGet (Ky) {
    if (!Ky || typeof Ky !== 'string') { return null; }

    return Srvc.Sto[Ky] || null;
  }

  RM = {
    OnBrowser: OnBrowser,
    OnNode: OnNode,
    Trim: Trim
  };

  if (typeof module !== 'undefined') { module.exports = RM; }
  else if (typeof window !== 'undefined') {
    RM.AJAX = AJAX;
    RM.StoreListen = StoreListen;
    RM.ServiceCall = ServiceCall;
    RM.StoreSet = StoreSet;
    RM.StoreGet = StoreGet;

    if (!window.Z || typeof window.Z !== 'object') { window.Z = {RM: RM}; }
    else { window.Z.RM = RM; }
  }
})();
