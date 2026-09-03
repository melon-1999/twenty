import { v4 } from 'uuid';

export const buildWebFormNoteBody = (
  message: string,
): { markdown: string; blocknote: string } => {
  const blocknote = JSON.stringify([
    {
      id: v4(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left',
      },
      content: [{ type: 'text', text: message, styles: {} }],
      children: [],
    },
  ]);

  return { markdown: message, blocknote };
};
