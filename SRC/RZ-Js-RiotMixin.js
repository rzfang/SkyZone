(function Z_RiotMixin_API () {
  let Srvc = { // service.
        Rprt: {}, // report.
        Sto: {} // data store.
      };

  /* make a AJAX request.
    @ AJAX Info object, key-value pairs.
    < XMLHttpRequest object. or null as error. */
  function AJAX (Info) {
    let DftInfo = {
          URL: '',
          Data: {},
          Files: {},
          Err: Sts => {}, // Error callback function. optional. 'Sts' = HTTP Status code.
          OK: (RpsTxt, Sts) => {}}, // OK callback function. optional. 'RpsTxt' = Response Text, 'Sts' = HTTP Status code.
        FmDt, // 'FmDt' = Form Data.
        XHR,
        Kys, // 'Kys' = Keys.
        i;

    if (typeof Info.URL !== 'string' || Info.URL === '') { return null; }

    Info.Data = (typeof Info.Data === 'object' && Info.Data !== null) ? Info.Data : DftInfo.Data;
    Info.Mthd = Info.Mthd === 'POST' ? 'POST' : 'GET'; // Method. can only be 'GET'|'POST'. optional, default 'GET'.
    Info.Bfr = (typeof Info.Bfr === 'function') ? Info.Bfr : () => {}; // Before callback function. optional.
    Info.Err = (typeof Info.Err === 'function') ? Info.Err : DftInfo.Err;
    Info.OK = (typeof Info.OK === 'function') ? Info.OK : DftInfo.OK;
    Info.End = (typeof Info.End === 'function') ? Info.End : () => {};
    Info.Pgs = (typeof Info.Pgs === 'function') ? Info.Pgs : () => {}; // Progress callback function. optional.

    FmDt = new FormData(),
    XHR = new XMLHttpRequest();
    Kys = Object.keys(Info.Data);

    for (let i = 0; i < Kys.length; i++) {
      let Tp = typeof Info.Data[Kys[i]];

      if (Array.isArray(Info.Data[Kys[i]])) {
        let Ky = Kys[i] + '[]',
            Vl = Info.Data[Kys[i]],
            Lth = Vl.length;

        for (let j = 0; j < Lth; j++) { FmDt.append(Ky, Vl[j]); }
      }
      else if (Tp === 'string' || Tp === 'number') { FmDt.append(Kys[i], Info.Data[Kys[i]]); }
    }

    if (typeof Info.File === 'object' && Info.File !== null) {
      Kys = Object.keys(Info.File);

      for (let i = 0; i < Kys.length; i++) { FmDt.append(Kys[i], Info.File[Kys[i]]); }
    }

    XHR.timeout = 5000;
    XHR.onreadystatechange = StateChange;
    XHR.upload.onprogress =  Evt => { Info.Pgs(Evt.loaded, Evt.total, Evt); };

    // XHR.overrideMimeType('text/xml');
    XHR.open(Info.Mthd, Info.URL);
    XHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // to use AJAX way.

    if (typeof Info.Hdrs === 'object' && Info.Hdrs !== null) {
      Kys = Object.keys(Info.Hdrs);

      for (let i = 0; i < Kys.length; i++) { XHR.setRequestHeader(Kys[i], Info.Hdrs[Kys[i]]); }
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
    < bool. */
  function OnBrowser (Tsk) {
    if (typeof module !== 'undefined') { return false; }

    if (typeof Tsk === 'function') { Tsk(); }

    return true;
  }

  /* do the 'Tsk' function if on the node environment.
    @ the task function will run on server (node) side.
    @ the request object, this needs node.js code help to provide, optional.
    < bool. */
  function OnNode (Tsk, Rqst) {
    if (typeof module === 'undefined') { return false; }

    if (typeof Tsk === 'function') { Tsk(Rqst); }

    return true;
  }

  function Trim (Str) {
    if (typeof Str !== 'string') { return ''; }

    return Str.replace(/^\s+|\s+$/g, '');
  }

  /*
    @ name to locate the store.
    @ Then(Sto, Rst) = then, a function when the task done.
      @ the store object. */
  function StoreListen (StoNm, Then) {
    let Clbcks = this.Srvc.Rprt[StoNm] || null;

    if (!Clbcks || !Array.isArray(Clbcks)) {
      this.Srvc.Rprt[StoNm] = [];
      Clbcks = this.Srvc.Rprt[StoNm];
    }

    this.Srvc.Rprt[StoNm].push(Then);

    if (this.Srvc.Sto[StoNm]) { Then(this.Srvc.Sto[StoNm], null); } // if the task store is ready, call once first.
  }

  /*
    @ URL string, the service entry point.
    @ params object to call service.
    @ name to locate the store.
    @ NewStoreGet (Sto, Rst) = the function to get new store, this must return something to replace original store.
      @ original store data.
      @ result from API.
    @ params object passing to each task. */
  function ServiceCall (Url, Prms, StoNm, NewStoreGet, PrmsToTsk) {
    let Mthd = 'POST';

    if (typeof Url === 'object' && Url.Mthd) {
      Url = Url.Url;
      Mthd = Url.Mthd;
    }
    else if (typeof Url !== 'string') {
      return -1;
    }

    if (!StoNm || typeof StoNm !== 'string' ||
        !NewStoreGet || typeof NewStoreGet !== 'function')
    { return -2; }

    let Srvc = this.Srvc;

    AJAX({
      URL: Url,
      Mthd,
      Data: Prms,
      Err: Sts => {
        console.log('---- AJAX query fail ----\nUrl: ' + Url + '\nparams:');
        console.log(Prms);
        console.log('----\n');

        Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm], '');
      },
      OK: (RspnsTxt, Sts, XHR) => {
        let CntTp = XHR.getResponseHeader('content-type'),
            Rst = RspnsTxt,
            Rprt = Srvc.Rprt[StoNm] || [],
            Lnth = Rprt && Array.isArray(Rprt) && Rprt.length || 0;

        if (Rst && (CntTp === 'application/json' || CntTp === 'text/json')) { Rst = JSON.parse(Rst); }

        Srvc.Sto[StoNm] = NewStoreGet(Srvc.Sto[StoNm], Rst);

        for (let i = 0; i < Lnth; i++) { Rprt[i](Srvc.Sto[StoNm], PrmsToTsk); }
      }
    });

    return 0;
  }

  /*
    @ name to locate the store.
    @ NewStoreGet (Sto, Rst) = the function to get new store, this must return something to replace original store.
      @ original store data.
    @ params object passing to each task. */
  function StoreSet (StoNm, NewStoreGet, PrmsToTsk) {
    if (!StoNm || typeof StoNm !== 'string' || !NewStoreGet || typeof NewStoreGet !== 'function') { return -1; }

    let Rprt = this.Srvc.Rprt[StoNm] || [],
        Lnth = Rprt && Array.isArray(Rprt) && Rprt.length || 0;

    this.Srvc.Sto[StoNm] = NewStoreGet(this.Srvc.Sto[StoNm]);

    for (let i = 0; i < Lnth; i++) { Rprt[i](this.Srvc.Sto[StoNm], PrmsToTsk); }

    return 0;
  }

  /* get a store.
    @ a string of store key.
    < store object, or null. */
  function StoreGet (Ky) {
    if (!Ky || typeof Ky !== 'string') { return null; }

    return this.Srvc.Sto[Ky] || null;
  }

  function StorePrint () {
    return '<script>\nwindow.Z.RM.StoreInject(\'' + JSON.stringify(this.Srvc.Sto) + '\');\n</script>\n';
  }

  function StoreInject (StoStr) {
    try {
      this.Srvc.Sto = JSON.parse(StoStr);
    }
    catch (Err) {
      console.log(Err);
    }
  }

  /* for working with independent riot service/store instance in each environment. */
  function ServiceInstance () {
    this.Srvc = { Rprt: {}, Sto: {}}; // service, report, store.
    this.OnBrowser = OnBrowser;
    this.OnNode = OnNode;
    this.StoreSet = StoreSet;
    this.Trim = Trim;
  }

  if (typeof module !== 'undefined') {
    module.exports = {
      InstanceCreate: Rqst => {
        Rqst.RM = new ServiceInstance();
        Rqst.RM.StorePrint = StorePrint;
      }
    };
  }
  else if (typeof window !== 'undefined') {
    let RM = new ServiceInstance();

    RM.AJAX = AJAX;
    RM.ServiceCall = ServiceCall.bind(RM);
    RM.StoreGet = StoreGet;
    RM.StoreInject = StoreInject;
    RM.StoreListen = StoreListen;

    if (!window.Z || typeof window.Z !== 'object') { window.Z = { RM: RM }; }
    else { window.Z.RM = RM; }
  }
})();
