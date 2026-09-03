import { Trans } from '@lingui/react';
import { BaseEmail } from 'src/components/BaseEmail';
import { MainText } from 'src/components/MainText';
import { Title } from 'src/components/Title';
import { createI18nInstance } from 'src/utils/i18n.utils';
import { type APP_LOCALES } from 'twenty-shared/translations';

export type TaskReminderLine = {
  title: string;
  due: string;
  linkedRecordName: string | null;
};

type TaskReminderEmailProps = {
  userName: string;
  overdue: TaskReminderLine[];
  today: TaskReminderLine[];
  locale: keyof typeof APP_LOCALES;
};

const renderLine = (line: TaskReminderLine) => {
  const suffix = line.linkedRecordName ? ` (${line.linkedRecordName})` : '';

  return (
    <span key={`${line.title}-${line.due}`}>
      • {line.title}
      {suffix} — {line.due}
      <br />
    </span>
  );
};

export const TaskReminderEmail = ({
  userName,
  overdue,
  today,
  locale,
}: TaskReminderEmailProps) => {
  const i18n = createI18nInstance(locale);

  return (
    <BaseEmail width={333} locale={locale}>
      <Title value={i18n._('Deine fälligen Aktivitäten')} />
      <MainText>
        {userName.length > 1 ? (
          <Trans id="Hi {userName}," values={{ userName }} />
        ) : (
          <Trans id="Hallo," />
        )}
        <br />
        <br />
        {overdue.length > 0 ? (
          <>
            <b>{i18n._('Überfällig')}</b>
            <br />
            {overdue.map(renderLine)}
            <br />
          </>
        ) : (
          <></>
        )}
        {today.length > 0 ? (
          <>
            <b>{i18n._('Heute fällig')}</b>
            <br />
            {today.map(renderLine)}
          </>
        ) : (
          <></>
        )}
      </MainText>
      <br />
      <br />
    </BaseEmail>
  );
};

TaskReminderEmail.PreviewProps = {
  userName: 'Tim Apple',
  overdue: [
    {
      title: 'Angebot nachfassen',
      due: '01.09.2026',
      linkedRecordName: 'Acme GmbH',
    },
  ],
  today: [
    { title: 'Demo vorbereiten', due: '03.09.2026', linkedRecordName: null },
  ],
  locale: 'de',
};

export default TaskReminderEmail;
