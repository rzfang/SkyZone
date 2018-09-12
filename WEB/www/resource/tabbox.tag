<tabbox>
  <ul class='TabLabelBox'>
    <li each={Tbs} class="Tb {Pckd ? 'Pckd' : ''}" onclick={Switch}>{Nm}</li>
  </ul>
  <context/>
  <script>
    // this.Idx = Z.Is.Number(this.opts.dftidx) ? this.opts.dftidx : 0;
    this.Idx = 0;
    this.Tbs = [];

    this.on(
      'before-mount',
      () => {
        for (let i in this.opts.tbs) {
          const { Nm = '?', Cmpnt = null, Dt = {} } = this.opts.tbs[i];

          this.Tbs.push({ Nm, Cmpnt, Dt, Pckd: false});
        }

        this.Idx = this.opts.idx || 0;
        this.Tbs[this.Idx].Pckd = true;
      });

    this.on(
      'mount',
      () => {
        riot.mount(this.root.querySelector('context'), this.Tbs[this.Idx].Cmpnt, this.Tbs[this.Idx].Dt);
      });

    Switch (Evt) {
      this.Tbs[this.Idx].Pckd = false;
      this.Idx = this.Tbs.indexOf(Evt.item);
      this.Tbs[this.Idx].Pckd = true;

      riot.mount(this.root.querySelector('context'), this.Tbs[this.Idx].Cmpnt, this.Tbs[this.Idx].Dt);
    }
  </script>

  <style scoped>
    .Tb { margin: 3px; border: 1px solid #d0d0ff; border-radius: 3px 3px 0 0; padding: 3px; color: #c0c0c0; }
    .Tb.Pckd { border-bottom: 1px solid #000000; color: #000000; cursor: default; }

    .TabLabelBox:first-child { margin: 0; padding: 0; }
    .TabLabelBox:first-child>li { display: inline-block; cursor: pointer; }

    context { display: block; }
  </style>
</tabbox>
