import { styled } from '@linaria/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

type PublicWebForm = {
  title: string;
  description: string;
  thankYouText: string;
};

type PublicWebFormPageStatus =
  | 'loading'
  | 'form'
  | 'submitting'
  | 'done'
  | 'notFound'
  | 'error';

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StyledPage = styled.div`
  align-items: center;
  background: #f5f5f7;
  display: flex;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  width: 100%;
`;

const StyledCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  max-width: 480px;
  padding: 32px;
  width: 100%;
`;

const StyledTitle = styled.h1`
  color: #1c1c1c;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
`;

const StyledDescription = styled.p`
  color: #5c5c5c;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 24px;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StyledLabel = styled.label`
  color: #1c1c1c;
  font-size: 13px;
  font-weight: 500;
`;

const StyledInput = styled.input`
  border: 1px solid #d1d1d6;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
  padding: 10px 12px;
  width: 100%;

  &:focus {
    border-color: #4a90e2;
    outline: none;
  }
`;

const StyledTextarea = styled.textarea`
  border: 1px solid #d1d1d6;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  padding: 10px 12px;
  resize: vertical;
  width: 100%;

  &:focus {
    border-color: #4a90e2;
    outline: none;
  }
`;

const StyledHoneypotWrapper = styled.div`
  left: -9999px;
  position: absolute;
`;

const StyledSubmitButton = styled.button`
  background: #1c1c1c;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  padding: 12px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const StyledErrorText = styled.p`
  color: #d92d20;
  font-size: 13px;
  margin: 0;
`;

const StyledCenteredMessage = styled.div`
  color: #1c1c1c;
  font-size: 16px;
  text-align: center;
`;

export const PublicWebFormPage = () => {
  const { workspaceId = '', formId = '' } = useParams();

  const [status, setStatus] = useState<PublicWebFormPageStatus>('loading');
  const [form, setForm] = useState<PublicWebForm>({
    title: '',
    description: '',
    thankYouText: '',
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(
          `${REACT_APP_SERVER_BASE_URL}/web-forms/${workspaceId}/${formId}`,
        );

        if (!res.ok) {
          setStatus('notFound');
          return;
        }

        const data = (await res.json()) as Partial<PublicWebForm>;

        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          thankYouText: data.thankYouText ?? '',
        });
        setStatus('form');
      } catch {
        setStatus('notFound');
      }
    };

    fetchForm();
  }, [workspaceId, formId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!EMAIL_REGEXP.test(email)) {
      setIsEmailInvalid(true);
      return;
    }

    setIsEmailInvalid(false);
    setStatus('submitting');

    try {
      const res = await fetch(
        `${REACT_APP_SERVER_BASE_URL}/web-forms/${workspaceId}/${formId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            jobTitle,
            company,
            message,
            _hp: hp,
          }),
        },
      );

      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <StyledPage>
        <StyledCenteredMessage>Wird geladen...</StyledCenteredMessage>
      </StyledPage>
    );
  }

  if (status === 'notFound') {
    return (
      <StyledPage>
        <StyledCenteredMessage>
          Formular nicht gefunden
        </StyledCenteredMessage>
      </StyledPage>
    );
  }

  if (status === 'done') {
    return (
      <StyledPage>
        <StyledCenteredMessage>{form.thankYouText}</StyledCenteredMessage>
      </StyledPage>
    );
  }

  return (
    <StyledPage>
      <StyledCard>
        <StyledTitle>{form.title}</StyledTitle>
        {form.description ? (
          <StyledDescription>{form.description}</StyledDescription>
        ) : null}
        <StyledForm onSubmit={handleSubmit}>
          <StyledField>
            <StyledLabel htmlFor="firstName">Vorname</StyledLabel>
            <StyledInput
              id="firstName"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="lastName">Nachname</StyledLabel>
            <StyledInput
              id="lastName"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="email">E-Mail</StyledLabel>
            <StyledInput
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setIsEmailInvalid(false);
              }}
            />
            {isEmailInvalid ? (
              <StyledErrorText>
                Bitte gib eine gültige E-Mail-Adresse ein.
              </StyledErrorText>
            ) : null}
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="phone">Telefon</StyledLabel>
            <StyledInput
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="jobTitle">Jobtitel</StyledLabel>
            <StyledInput
              id="jobTitle"
              type="text"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="company">Firma</StyledLabel>
            <StyledInput
              id="company"
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </StyledField>
          <StyledField>
            <StyledLabel htmlFor="message">Nachricht</StyledLabel>
            <StyledTextarea
              id="message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </StyledField>
          <StyledHoneypotWrapper aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(event) => setHp(event.target.value)}
            />
          </StyledHoneypotWrapper>
          {status === 'error' ? (
            <StyledErrorText>
              Etwas ist schiefgelaufen. Bitte versuche es erneut.
            </StyledErrorText>
          ) : null}
          <StyledSubmitButton type="submit" disabled={status === 'submitting'}>
            Absenden
          </StyledSubmitButton>
        </StyledForm>
      </StyledCard>
    </StyledPage>
  );
};
