import { render, screen } from '@testing-library/react';

import { OpportunityRottingBadge } from '@/object-record/record-show/opportunity/components/OpportunityRottingBadge';

jest.mock(
  '@/object-record/record-show/opportunity/hooks/useOpportunityStageRottingConfig',
  () => ({
    useOpportunityStageRottingConfig: () => ({ config: { NEW: 7 } }),
  }),
);

const FIXED_NOW = new Date('2024-01-20T00:00:00.000Z');

const daysBeforeFixedNow = (days: number): string =>
  new Date(FIXED_NOW.getTime() - days * 86400000).toISOString();

describe('OpportunityRottingBadge', () => {
  it('shows the days-in-stage label when the opportunity is rotting', () => {
    render(
      <OpportunityRottingBadge
        status="OPEN"
        stage="NEW"
        stageChangedAt={daysBeforeFixedNow(10)}
        now={FIXED_NOW}
      />,
    );

    expect(screen.getByText(/10 Tage in Phase/)).toBeInTheDocument();
  });

  it('renders nothing when the opportunity is not rotting', () => {
    const { container } = render(
      <OpportunityRottingBadge
        status="OPEN"
        stage="NEW"
        stageChangedAt={daysBeforeFixedNow(2)}
        now={FIXED_NOW}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
