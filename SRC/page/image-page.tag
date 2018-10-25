<image-page>
  <h1>{Ttl}</h1>
  <div>
    <tags tgs={Tgs}/>
    <icon title='發佈時間' nm='calendar'/> {Dt}
  </div>
  <div>
    <img src={ImgUrl}/>
    <pre>{Str}</pre>
  </div>
  <share-box ecdurl={Url}/>
  <style scoped>
    :scope { display: block; }
    :scope>div:first-of-type { margin: 20px 0; }
    :scope>div:last-of-type { text-align: center; }
    :scope>div:last-of-type>pre { display: inline-block; margin-top: 20px; line-height: 2rem; text-align: initial; }
  </style>
  <script>
    this.Ttl = '';
    this.Tgs = [];
    this.Dt = '';
    this.Str = '';
    this.ImgUrl = '#';
    this.Url = '';

    this.mixin('Z.RM');

    this.StoreListen(
      'BLOG',
      (Sto, Prms) => {
        this.update({
          Ttl: Sto.Ttl,
          Tgs: Sto.Tgs,
          Dt: Sto.Dt,
          Str: Sto.Info.Str,
          ImgUrl: Sto.Info.ImgUrl,
          Url: encodeURI(Sto.Url)
        });
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
</image-page>
