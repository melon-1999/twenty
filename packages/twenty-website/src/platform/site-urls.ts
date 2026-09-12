// Every external destination the site links to, in one place. Sections and
// data files never inline these. Values derive from the central product
// branding; placeholders are blocked from production by the branding guard
// and the customer leak scan.
export const SITE_URLS: Record<'appWelcome' | 'docsApi' | 'docsMcp', string> = {
  appWelcome: 'https://app.example.com/welcome',
  docsApi: 'https://docs.example.com/api',
  docsMcp: 'https://docs.example.com/mcp',
};
