const Is = require('./RZ-Js-Is');
// const Log = require('./RZ-Js-Log');
const { Blog, Tag, Msg, Wds } = require('./library');


/* extend original callback function to be packed.
  @ original callback function.
  < new callback function. */
function PackedEnd (End) {
  return function (Cd, Msg, Ext) {
    let Rst = { Index: Is.Number(Cd) ? Cd : 0, Message: Is.String(Msg) ? Msg : '' };

    if (Ext !== undefined) { Rst.Extend = Ext; }

    End(0, Rst);
  }
}

/*
  @ request object.
  @ post, get params.
  @ end callback function. */
module.exports = {
  BlogList: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Blog.List(Rqst, MxPrm, PckEnd);
  },
  TagList: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Tag.List(Rqst, MxPrm, PckEnd);
  },
  WordsNowOneGet: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Wds.NowOneGet(Rqst, MxPrm, PckEnd);
  },
  CommentList: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Blog.CommentList(Rqst, MxPrm, PckEnd);
  },
  MessageList: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Msg.List(Rqst, MxPrm, PckEnd);
  },
  MessageChainList: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          PckEnd = PackedEnd(End); // packed end callback function.

    return Msg.ChainList(Rqst, MxPrm, PckEnd);
  },
  DefaultCall: (Rqst, Prm, End) => {
    const MxPrm = Object.assign(Prm.Bd || {}, Prm.Url || {}), // mixed params.
          Cmd = MxPrm.Cmd && parseInt(MxPrm.Cmd, 10) || -1, // command.
          PckEnd = PackedEnd(End); // packed end callback function.

    if (Cmd < 0) { return End(-1, null); }

    switch (Cmd) {
      case 9:
        return Blog.CommentLeave(Rqst, MxPrm, PckEnd);
    }

    End(0, 'GJ');
  }
}
