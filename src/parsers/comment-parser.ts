import type { RawCommentData, CommentOutput } from '../types/index.js';

function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

export function parseComment(raw: RawCommentData): CommentOutput {
  return {
    commentId: raw.cid,
    text: raw.text ?? '',
    author: {
      userId: raw.user?.uid ?? '',
      username: raw.user?.unique_id ?? '',
      nickname: raw.user?.nickname ?? '',
      avatarUrl: raw.user?.avatar_larger ?? '',
    },
    likeCount: raw.digg_count ?? 0,
    replyCount: raw.reply_comment_total ?? 0,
    createTime: raw.create_time,
    createTimeISO: unixToISO(raw.create_time),
    isAuthorLiked: raw.is_author_digged ?? false,
    scrapedAt: new Date().toISOString(),
  };
}
