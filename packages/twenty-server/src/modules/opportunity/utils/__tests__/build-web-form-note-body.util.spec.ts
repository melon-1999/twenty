import { buildWebFormNoteBody } from 'src/modules/opportunity/utils/build-web-form-note-body.util';

describe('buildWebFormNoteBody', () => {
  it('puts the message verbatim in markdown', () => {
    expect(buildWebFormNoteBody('Hallo Welt').markdown).toBe('Hallo Welt');
  });

  it('wraps the message in a single blocknote paragraph', () => {
    const blocks = JSON.parse(buildWebFormNoteBody('Anfrage: Preise?').blocknote);

    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].content[0].type).toBe('text');
    expect(blocks[0].content[0].text).toBe('Anfrage: Preise?');
    expect(typeof blocks[0].id).toBe('string');
  });
});
