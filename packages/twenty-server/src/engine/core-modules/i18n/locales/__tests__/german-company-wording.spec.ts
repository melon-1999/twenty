import * as fs from 'fs';
import * as path from 'path';

import { generateMessageId } from '@lingui/message-utils/generateMessageId';

import { messages as germanMessages } from 'src/engine/core-modules/i18n/locales/generated/de-DE';

// Single-company instances use "Unternehmen" wording in the German customer
// UI; only the de-DE msgstr changes, English msgids stay upstream-identical.
// Guards the hand-maintained entry against an i18n pipeline revert.
const EXPECTED_TRANSLATIONS: Record<string, string> = {
  'Workspace name is required': 'Unternehmensname ist erforderlich',
};

const PO_PATH = path.resolve(__dirname, '../de-DE.po');

describe('German single-company wording (server)', () => {
  const poContent = fs.readFileSync(PO_PATH, 'utf-8');

  it.each(Object.entries(EXPECTED_TRANSLATIONS))(
    'translates %s with Unternehmen',
    (msgid, expectedMsgstr) => {
      expect(poContent).toContain(
        `msgid "${msgid}"\nmsgstr "${expectedMsgstr}"`,
      );
      expect(germanMessages[generateMessageId(msgid)]).toEqual([
        expectedMsgstr,
      ]);
    },
  );
});
