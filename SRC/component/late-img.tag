<late-img>
  <img class={Cls} src={Src} alt={opts.alt}/>
  <style>
    @keyframes LateImgShow {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
  <style scoped>
    :scope>img { opacity: 0; }
    :scope>img.show {
      animation-name: LateImgShow;
      animation-fill-mode: forwards;
      animation-duration: 1s;
    }
  </style>
  <script>
    this.Src = '#';
    this.Cls = '';

    this.CheckAndLoad = () => {
      const {
        innerHeight: H = 0,
        scrollY: Y = 0 } = window;

      if (this.root.offsetTop < (Y + H)) {
        window.requestAnimationFrame(() => {
          this.update({ Cls: 'show', Src: this.opts.riotSrc }); // src is converted to riotSrc.
          window.removeEventListener('scroll', this.CheckAndLoad);
        });
      }
    };

    this.mixin('Z.RM');

    this.on(
      'mount',
      () => {
        if (!this.OnBrowser()) { return; }

        window.addEventListener('scroll', this.CheckAndLoad);
      });
  </script>
</late-img>
