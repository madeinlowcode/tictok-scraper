import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseComment } from '../../../src/parsers/comment-parser.js';
import type { RawCommentData } from '../../../src/types/index.js';

function loadCommentFixture(): RawCommentData[] {
  const path = join(import.meta.dirname, '../../fixtures/api-comment-list.json');
  const fixture = JSON.parse(readFileSync(path, 'utf-8'));
  return fixture.comments;
}

describe('parseComment', () => {
  it('should parse comment with replies', () => {
    const comments = loadCommentFixture();
    const result = parseComment(comments[0]!);

    expect(result.commentId).toBe('7300000000000000001');
    expect(result.text).toContain('Great video');
    expect(result.likeCount).toBe(50);
    expect(result.replyCount).toBe(3);
    expect(result.isAuthorLiked).toBe(true);
    expect(result.author.username).toBe('commenter1');
    expect(result.createTimeISO).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should parse comment without replies', () => {
    const comments = loadCommentFixture();
    const result = parseComment(comments[1]!);

    expect(result.replyCount).toBe(0);
    expect(result.isAuthorLiked).toBe(false);
  });
});
