import { type I18n } from '@lingui/core';
import { Column, Container, Row } from 'react-email';
import { PRODUCT_BRANDING } from 'twenty-shared/constants';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  return (
    <Container style={footerContainerStyle}>
      <Row>
        <Column>
          <ShadowText>
            <Link
              href={PRODUCT_BRANDING.websiteUrl}
              value={i18n._('Website')}
              aria-label={i18n._('Visit our website')}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href={PRODUCT_BRANDING.sourceCodeUrl}
              value={i18n._('Source code')}
              aria-label={i18n._('Visit the source code repository')}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="https://docs.twenty.com/getting-started/introduction"
              value={i18n._('User guide')}
              aria-label={i18n._('Read the user guide')}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="https://docs.twenty.com/"
              value={i18n._('Developers')}
              aria-label={i18n._('Visit the developer documentation')}
            />
          </ShadowText>
        </Column>
      </Row>
      <ShadowText>
        <>
          {PRODUCT_BRANDING.legalEntityLine}
          {PRODUCT_BRANDING.legalEntityLocationLine !== '' && (
            <>
              <br />
              {PRODUCT_BRANDING.legalEntityLocationLine}
            </>
          )}
        </>
      </ShadowText>
    </Container>
  );
};
