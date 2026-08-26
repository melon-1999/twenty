import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OpportunityProbabilityForm } from '@/settings/data-model/object-details/components/OpportunityProbabilityForm';

const OPTIONS = [
  { value: 'NEW', label: 'Neu' },
  { value: 'PROPOSAL', label: 'Angebot' },
];

describe('OpportunityProbabilityForm', () => {
  it('seeds inputs from the initial config', () => {
    render(
      <OpportunityProbabilityForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 80 }}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Angebot')).toHaveValue(80);
    expect(screen.getByLabelText('Neu')).toHaveValue(null);
  });

  it('calls onSave with the edited value on save', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityProbabilityForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 80 }}
        onSave={handleSave}
      />,
    );

    const proposalInput = screen.getByLabelText('Angebot');
    await user.clear(proposalInput);
    await user.type(proposalInput, '90');

    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ PROPOSAL: 90 }),
    );
  });

  it('omits blank inputs from the saved config', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityProbabilityForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 80 }}
        onSave={handleSave}
      />,
    );

    await user.clear(screen.getByLabelText('Angebot'));
    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledWith({});
  });

  it('clamps values above 100 down to 100', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityProbabilityForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 80 }}
        onSave={handleSave}
      />,
    );

    const proposalInput = screen.getByLabelText('Angebot');
    await user.clear(proposalInput);
    await user.type(proposalInput, '150');

    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ PROPOSAL: 100 }),
    );
  });

  it('clamps negative values up to 0', async () => {
    const user = userEvent.setup();
    const handleSave = jest.fn();

    render(
      <OpportunityProbabilityForm
        options={OPTIONS}
        initialConfig={{ PROPOSAL: 80 }}
        onSave={handleSave}
      />,
    );

    const proposalInput = screen.getByLabelText('Angebot');
    await user.clear(proposalInput);
    await user.type(proposalInput, '-10');

    await user.click(screen.getByText('Save'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({ PROPOSAL: 0 }),
    );
  });
});
