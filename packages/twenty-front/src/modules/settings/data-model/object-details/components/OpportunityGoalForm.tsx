import { useState } from 'react';

import { TextInput } from '@/ui/input/components/TextInput';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  max-width: 320px;
`;

type OpportunityGoalFormProps = {
  initialTargetAmount: number | null;
  onSave: (targetAmount: number) => void;
};

export const OpportunityGoalForm = ({
  initialTargetAmount,
  onSave,
}: OpportunityGoalFormProps) => {
  const [value, setValue] = useState<string>(
    initialTargetAmount ? String(initialTargetAmount) : '',
  );

  const handleSave = () => {
    const parsed = Number(value);
    onSave(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  };

  return (
    <StyledContainer>
      <TextInput
        label={t`Monatsziel (Umsatz)`}
        type="number"
        value={value}
        onChange={(text) => setValue(text)}
      />
      <Button
        title={t`Speichern`}
        variant="primary"
        accent="blue"
        onClick={handleSave}
      />
    </StyledContainer>
  );
};
