import { generateMessageId } from '@lingui/message-utils/generateMessageId';
import * as fs from 'fs';
import * as path from 'path';

import { messages as germanMessages } from '../generated/de-DE';

// This fork ships single-company instances with a German customer UI: the
// onboarding/auth strings must say "Unternehmen", not "Arbeitsbereich", and
// hand-maintained branding entries must survive. Wording lives only in the
// de-DE catalog (msgstr); this test keeps a Crowdin/i18n pipeline run from
// silently reverting the hand-maintained entries.
const FRONT_PO_PATH = path.resolve(__dirname, '../de-DE.po');

// Entries whose compiled form contains ICU placeholders: assert the po
// msgstr exactly and the compiled catalog by fragment.
const EXPECTED_BRANDED_TRANSLATIONS: Record<
  string,
  { msgstr: string; compiledFragment: string }
> = {
  '{0} by {1} (version {PRODUCT_VERSION}) is based on software licensed under the GNU AGPL-3.0, with MIT-licensed components. The complete corresponding source code of this version is available for download.':
    {
      msgstr:
        '{0} by {1} (Version {PRODUCT_VERSION}) basiert auf Software unter der GNU AGPL-3.0-Lizenz, mit MIT-lizenzierten Komponenten. Der vollständige zugehörige Quellcode dieser Version steht zum Download bereit.',
      compiledFragment: 'basiert auf Software unter der GNU AGPL-3.0-Lizenz',
    },
};

const EXPECTED_TRANSLATIONS: Record<string, string> = {
  'Create your workspace': 'Ihr Unternehmen erstellen',
  'Create workspace': 'Unternehmen erstellen',
  'Create Workspace': 'Unternehmen erstellen',
  'Create a workspace': 'Unternehmen erstellen',
  'Choose a Workspace': 'Unternehmen auswählen',
  'Welcome to your workspace': 'Willkommen in Ihrem Unternehmen',
  'Creating your <0>workspace</0>...':
    'Ihr <0>Unternehmen</0> wird erstellt...',
  'Prefilling your <0>workspace data</0>...':
    'Ihre <0>Unternehmensdaten</0> werden vorbefüllt...',
  'Workspace creation failed': 'Erstellung des Unternehmens fehlgeschlagen',
  'Workspace logo upload failed': 'Upload des Unternehmenslogos fehlgeschlagen',
  'Something went wrong while creating your workspace. Please try again.':
    'Beim Erstellen Ihres Unternehmens ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.',
  'Get the most out of your workspace by inviting your team.':
    'Holen Sie das Beste aus Ihrem Unternehmen heraus, indem Sie Ihr Team einladen.',
  'Access your workspace data': 'Auf deine Unternehmensdaten zugreifen',
  "Book a 30-minute call and we'll help you get your workspace production-ready.":
    'Buche ein 30-minütiges Gespräch und wir helfen dir, dein Unternehmen einsatzbereit zu machen.',
};

const escapePoString = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const readMsgstr = (poContent: string, msgid: string): string | undefined => {
  const match = poContent.match(
    new RegExp(
      `^msgid "${escapePoString(msgid).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\nmsgstr "(.*)"$`,
      'm',
    ),
  );

  return match?.[1];
};

describe('German single-company wording', () => {
  const frontPo = fs.readFileSync(FRONT_PO_PATH, 'utf-8');

  it.each(Object.entries(EXPECTED_TRANSLATIONS))(
    'translates %s with Unternehmen in the source catalog',
    (msgid, expectedMsgstr) => {
      expect(readMsgstr(frontPo, msgid)).toBe(escapePoString(expectedMsgstr));
    },
  );

  it.each(Object.entries(EXPECTED_TRANSLATIONS))(
    'ships %s translated in the compiled catalog',
    (msgid, expectedMsgstr) => {
      expect(germanMessages[generateMessageId(msgid)]).toEqual([
        expectedMsgstr,
      ]);
    },
  );

  it.each(Object.entries(EXPECTED_BRANDED_TRANSLATIONS))(
    'keeps the hand-maintained branded entry %s',
    (msgid, { msgstr, compiledFragment }) => {
      expect(readMsgstr(frontPo, msgid)).toBe(escapePoString(msgstr));
      expect(
        JSON.stringify(germanMessages[generateMessageId(msgid)]),
      ).toContain(compiledFragment);
    },
  );
});
