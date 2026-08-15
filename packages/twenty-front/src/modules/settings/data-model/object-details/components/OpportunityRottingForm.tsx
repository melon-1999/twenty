import { useState } from 'react';

import { TextInput } from '@/ui/input/components/TextInput';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type OpportunityRottingFormOption = {
  value: string;
  label: string;
};

type OpportunityRottingFormProps = {
  options: OpportunityRottingFormOption[];
  initialConfig: Record<string, number>;
  onSave: (config: Record<string, number>) => void;
};

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledInputsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledActionsContainer = styled.div`
  display: flex;
`;

export const OpportunityRottingForm = ({
  options,
  initialConfig,
  onSave,
}: OpportunityRottingFormProps) => {
  const [rottingDaysByStage, setRottingDaysByStage] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      options.map((option) => [
        option.value,
        initialConfig[option.value]?.toString() ?? '',
      ]),
    ),
  );

  const handleChange = (optionValue: string, text: string) => {
    setRottingDaysByStage((previous) => ({
      ...previous,
      [optionValue]: text,
    }));
  };

  const handleSave = () => {
    const config: Record<string, number> = {};

    for (const option of options) {
      const rawValue = rottingDaysByStage[option.value];

      if (!isNonEmptyString(rawValue)) {
        continue;
      }

      const parsedValue = Number(rawValue);

      if (!Number.isNaN(parsedValue)) {
        config[option.value] = parsedValue;
      }
    }

    onSave(config);
  };

  return (
    <StyledContainer>
      <StyledInputsContainer>
        {options.map((option) => (
          <TextInput
            key={option.value}
            label={option.label}
            type="number"
            value={rottingDaysByStage[option.value] ?? ''}
            onChange={(text) => handleChange(option.value, text)}
          />
        ))}
      </StyledInputsContainer>
      <StyledActionsContainer>
        <Button
          title={t`Save`}
          variant="primary"
          accent="blue"
          onClick={handleSave}
        />
      </StyledActionsContainer>
    </StyledContainer>
  );
};
