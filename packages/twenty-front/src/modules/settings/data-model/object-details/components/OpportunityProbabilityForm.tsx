import { useState } from 'react';

import { TextInput } from '@/ui/input/components/TextInput';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Button } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export type OpportunityProbabilityFormOption = {
  value: string;
  label: string;
};

type OpportunityProbabilityFormProps = {
  options: OpportunityProbabilityFormOption[];
  initialConfig: Record<string, number>;
  onSave: (config: Record<string, number>) => void;
};

const MIN_PROBABILITY = 0;
const MAX_PROBABILITY = 100;

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

export const OpportunityProbabilityForm = ({
  options,
  initialConfig,
  onSave,
}: OpportunityProbabilityFormProps) => {
  const [probabilityByStage, setProbabilityByStage] = useState<
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
    setProbabilityByStage((previous) => ({
      ...previous,
      [optionValue]: text,
    }));
  };

  const handleSave = () => {
    const config: Record<string, number> = {};

    for (const option of options) {
      const rawValue = probabilityByStage[option.value];

      if (!isNonEmptyString(rawValue)) {
        continue;
      }

      const parsedValue = Number(rawValue);

      if (!Number.isNaN(parsedValue)) {
        config[option.value] = Math.min(
          MAX_PROBABILITY,
          Math.max(MIN_PROBABILITY, parsedValue),
        );
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
            value={probabilityByStage[option.value] ?? ''}
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
