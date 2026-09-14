import * as fs from 'fs';
import * as path from 'path';

import { generateMessageId } from '@lingui/message-utils/generateMessageId';

import { messages as germanMessages } from 'src/engine/core-modules/i18n/locales/generated/de-DE';

// Single-company instances use "Unternehmen" wording in the German customer
// UI, and branded error messages must keep the product name instead of the
// upstream brand. Guards the hand-maintained de-DE entries against an i18n
// pipeline revert.
const EXPECTED_TRANSLATIONS: Record<string, string> = {
  'Workspace name is required': 'Unternehmensname ist erforderlich',
};

// Entries with ICU placeholders: compiled values are token arrays, so the
// compiled catalog is asserted by fragment.
const EXPECTED_BRANDED_TRANSLATIONS: Record<
  string,
  { msgstr: string; compiledFragment: string }
> = {
  'System indexes are required for {0} to work and cannot be deleted.': {
    msgstr:
      'Systemindizes sind erforderlich, damit {0} funktioniert, und können nicht gelöscht werden.',
    compiledFragment: 'Systemindizes sind erforderlich',
  },
  'This app requires a newer version of the {0} server. Please upgrade your server or use a compatible app version.':
    {
      msgstr:
        'Diese App erfordert eine neuere Serverversion von {0}. Bitte aktualisieren Sie Ihren Server oder verwenden Sie eine kompatible App-Version.',
      compiledFragment: 'Diese App erfordert eine neuere Serverversion',
    },
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

  it.each(Object.entries(EXPECTED_BRANDED_TRANSLATIONS))(
    'keeps the branded entry %s',
    (msgid, { msgstr, compiledFragment }) => {
      expect(poContent).toContain(`msgid "${msgid}"\nmsgstr "${msgstr}"`);
      expect(
        JSON.stringify(germanMessages[generateMessageId(msgid)]),
      ).toContain(compiledFragment);
    },
  );
});
