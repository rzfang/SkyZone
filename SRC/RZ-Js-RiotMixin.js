'use strict';

(function Z_RiotMixin_API () {
  let Srvc = { // service.
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

      if (Array.isArray(Info.Data[Kys[i]])) { // array type data handle.
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

    // if (Info.Mthd === 'POST') { XHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded'); } // header for POST.

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
    @ the task function will run on client (browser) side. optional.
    return: bool. */
  function OnBrowser (Tsk) {
    if (typeof window === 'undefined') { return false; }

    if (typeof Tsk === 'function') { Tsk(); }

    return true;
  }

  /* do the 'Tsk' function if on the node environment.
    @ the task function will run on server (node) side. optional.
    return: bool. */
  function OnNode (Tsk) {
    if (typeof module === 'undefined') { return false; }

    if (typeof Tsk === 'function') { Tsk(); }

    return true;
  }

  /*
    StoNm = name to locate the store.
    Then(Sto, Rst) = then, a function when the task done.
      Sto = the store object. */
  function StoreListen (StoNm, Then) {
    if (!this.StoLsnr) { this.StoLsnr = {}; }

    if (this.StoLsnr[StoNm]) {
      return console.log('---- RiotMixin error ----\nthe listener to the store "' + StoNm + '" has been registered.');
    }

    this.StoLsnr[StoNm] = Then;

    if (!Srvc.Rprt[StoNm]) { Srvc.Rprt[StoNm] = []; }

    let Rprt = Srvc.Rprt[StoNm]; // report.

    if (Rprt.indexOf(Then) < 0) { Rprt.push(Then); }

    if (Srvc.Sto[StoNm]) { Then(Srvc.Sto[StoNm], null); } // if the task store is ready, call once first.
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
        const CntTp = XHR.getResponseHeader('content-type');

        let Rst = RspnsTxt;

        if (Rst && (CntTp.indexOf('application/json') > -1 || CntTp.indexOf('text/json') > -1)) {
          Rst = JSON.parse(Rst);
        }

        Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm], Rst);

        //==== pass result to every store listeners. ====

        if (!Srvc.Rprt[StoNm] || !Array.isArray(Srvc.Rprt[StoNm])) { return; }

        const Rprt = Srvc.Rprt[StoNm];

        for (let i = 0; i < Rprt.length; i++) {
          Rprt[i](Srvc.Sto[StoNm], PrmsToTsk);
        }
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

    let Rprt = Srvc.Rprt[StoNm] || [];

    Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm]);

    for (let i = 0; i < Rprt.length; i++) {
      Rprt[i](Srvc.Sto[StoNm], PrmsToTsk);
    }

    return 0;
  }

  /* get a store.
    Ky = a string of store key.
    return: store object, or null. */
  function StoreGet (Ky) {
    if (!Ky || typeof Ky !== 'string') { return null; }

    return Srvc.Sto[Ky] || null;
  }

  /* get RZ-Nd-HTTPServer keyword feature if support.
    @ key.
    < keyword. */
  function Keyword (Ky) {
    return window.Z && window.Z.Kwd && window.Z.Kwd[Ky] || '';
  }

  RM = {
    OnBrowser: OnBrowser,
    OnNode: OnNode
  };

  if (typeof module !== 'undefined') { module.exports = RM; }
  else if (typeof window !== 'undefined') {
    RM.Debug = () => { console.log(Srvc); };

    RM.AJAX = AJAX;
    RM.Keyword = Keyword;
    RM.ServiceCall = ServiceCall;
    RM.StoreGet = StoreGet;
    RM.StoreListen = StoreListen;
    RM.StoreSet = StoreSet;
    RM.init = function (opts) {
      this.on(
        'unmount',
        function () {
          const StoNms = Object.keys(this.StoLsnr || {});

          for (let i = 0; i < StoNms.length; i++) {
            const StoLsnr = this.StoLsnr[StoNms[i]];
            let Rprt = Srvc.Rprt[StoNms[i]];

            for (let j = 0; j < Rprt.length; j++) {
              if (StoLsnr === Rprt[j]) {
                Rprt.splice(j, 1);

                break;
              }
            }
          }
        });
    };

    if (!window.Z || typeof window.Z !== 'object') { window.Z = { RM }; }
    else { window.Z.RM = RM; }
  }
})();
