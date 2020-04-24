const Is = require('./RZ-Js-Is');
// const Log = require('./RZ-Js-Log');
const { Blog, Tag, Msg, Ssn, Systm, Wds, ArtCnr } = require('./library');

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

// mixed params.
function ParamsMix (Prm) {
  return Object.assign({}, Prm.Bd || {}, Prm.Url || {});
}

/*
  @ request object.
  @ post, get params.
  @ end callback function. */
module.exports = {
  BlogList: (Rqst, Rspns, Prm, End) => {
    return Blog.List(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  BlogAdminList: (Rqst, Rspns, Prm, End) => {
    return Blog.AdminList(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  BlogUnpublishedList: (Rqst, Rspns, Prm, End) => {
    return Blog.UnpublishedList(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  BlogRead: (Rqst, Rspns, Prm, End) => {
    return Blog.Read(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  BlogUpdate: (Rqst, Rspns, Prm, End) => {
    return Blog.Update(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  BlogUpload: (Rqst, Rspns, Prm, End) => {
    return Blog.Upload(Rqst, Rspns, ParamsMix(Prm), Prm.Fls, PackedEnd(End));
  },
  BlogCreate: (Rqst, Rspns, Prm, End) => {
    return Blog.Create(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  BlogDelete: (Rqst, Rspns, Prm, End) => {
    return Blog.Delete(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  CommentLeave: (Rqst, Rspns, Prm, End) => {
    return Blog.CommentLeave(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  CommentDelete: (Rqst, Rspns, Prm, End) => {
    return Blog.CommentDelete(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  CommentList: (Rqst, Rspns, Prm, End) => {
    return Blog.CommentList(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  TagList: (Rqst, Rspns, Prm, End) => {
    return Tag.List(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  TagAdd: (Rqst, Rspns, Prm, End) => {
    return Tag.Add(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  TagRename: (Rqst, Rspns, Prm, End) => {
    return Tag.Rename(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  TagDelete: (Rqst, Rspns, Prm, End) => {
    return Tag.Delete(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  WordsNowOneGet: (Rqst, Rspns, Prm, End) => {
    return Wds.NowOneGet(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  WordsList: (Rqst, Rspns, Prm, End) => {
    return Wds.List(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  WordsCreate: (Rqst, Rspns, Prm, End) => {
    return Wds.Create(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  WordsUpdate: (Rqst, Rspns, Prm, End) => {
    return Wds.Update(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  WordsDelete: (Rqst, Rspns, Prm, End) => {
    return Wds.Delete(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  FeedPublish: (Rqst, Rspns, Prm, End) => {
    return Blog.FeedPublish(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  MessageList: (Rqst, Rspns, Prm, End) => {
    return Msg.List(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  MessageChainList: (Rqst, Rspns, Prm, End) => {
    return Msg.ChainList(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  MessageLeave: (Rqst, Rspns, Prm, End) => {
    return Msg.Leave(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  MessageAdminList: (Rqst, Rspns, Prm, End) => {
    return Msg.AdminList(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  MessageDelete: (Rqst, Rspns, Prm, End) => {
    return Msg.Delete(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  ArtCornerRandomOneGet: (Rqst, Rspns, Prm, End) => {
    return ArtCnr.RandomOneGet(Rqst, ParamsMix(Prm), PackedEnd(End));
  },
  SystemCacheClean: (Rqst, Rspns, Prm, End) => {
    return Systm.CacheClear(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  SystemDataSize: (Rqst, Rspns, Prm, End) => {
    return Systm.DataSize(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  SessionLogIn: (Rqst, Rspns, Prm, End) => {
    return Ssn.LogIn(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  },
  SessionLogOut: (Rqst, Rspns, Prm, End) => {
    return Ssn.LogOut(Rqst, Rspns, ParamsMix(Prm), PackedEnd(End));
  }
}
