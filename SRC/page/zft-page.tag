<zft-page>
  <h1>{Ttl}</h1>
  <div>
    <tags tgs={Tgs}/>
    <icon title='發佈時間' nm='calendar'/> {Dt}
  </div>
  <pre>{Str}</pre>
  <share-box ecdurl={Url}/>
  <style scoped>
    :scope { display: block; }
    :scope>div { margin: 20px 0; }
    :scope>pre { line-height: 2rem; }
  </style>
  <script>
    this.Ttl = '';
    this.Tgs = [];
    this.Dt = '';
    this.Str = '';
    this.Url = '';

    this.mixin('Z.RM');

    this.StoreListen(
      'BLOG',
      (Sto, Prms) => {
        this.update({ Ttl: Sto.Ttl, Tgs: Sto.Tgs, Dt: Sto.Dt, Str: Sto.Info, Url: encodeURI(Sto.Url) });
        this.root.querySelector('pre').innerHTML = Z.ZFT(Sto.Info);
      });

    this.on(
      'mount',
      () => {
        if (!this.OnBrowser()) { return; }

        const Id = window.location.search.replace('?b=', '');

        if (!Id) {
          window.location = '/404';

          return;
        }

        this.ServiceCall(
          '/service/blog',
          { Id },
          'BLOG',
          (Sto, Rst) => {
            if (!Rst) { return alert(window.Z.Kwd.SystemError); }

            if (Rst.Index < 0) { return alert(Rst.Message); }

            return Rst.Extend;
          });
      });
  </script>
</zft-page>
