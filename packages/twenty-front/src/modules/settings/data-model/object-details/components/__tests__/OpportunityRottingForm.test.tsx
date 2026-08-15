import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OpportunityRottingForm } from '@/settings/data-model/object-details/components/OpportunityRottingForm';

const OPTIONS = [
  { value: 'NEW', label: 'Neu' },
  { value: 'PROPOSAL', label: 'Angebot' },
];

describe('OpportunityRottingForm', () => {
  it('seeds inputs from the initial config', () => {
    render(
      <OpportunityRottingForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 21 }}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Angebot')).toHaveValue(21);
    expect(screen.getByLabelText('Neu')).toHaveValue(null);
  });

  it('calls onSave with the edited value on save', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityRottingForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 21 }}
        onSave={handleSave}
      />,
    );

    const proposalInput = screen.getByLabelText('Angebot');
    await user.clear(proposalInput);
    await user.type(proposalInput, '30');

    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ PROPOSAL: 30 }),
    );
  });

  it('omits blank inputs from the saved config', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityRottingForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 21 }}
        onSave={handleSave}
      />,
    );

    await user.clear(screen.getByLabelText('Angebot'));
    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledWith({});
  });
});
