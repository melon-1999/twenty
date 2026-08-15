import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OpportunityWonLostActions } from '@/object-record/record-show/opportunity/components/OpportunityWonLostActions';

const mockUpdateOneRecord = jest.fn();

jest.mock('@/object-record/hooks/useUpdateOneRecord', () => ({
  useUpdateOneRecord: () => ({
    updateOneRecord: mockUpdateOneRecord,
  }),
}));

describe('OpportunityWonLostActions', () => {
  beforeEach(() => {
    mockUpdateOneRecord.mockClear();
  });

  it('marks the opportunity as won with a closedAt timestamp', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="OPEN"
        statusLabel="Open"
      />,
    );

    await user.click(screen.getByText('Mark as Won'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'WON',
        closedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/),
      },
    });
  });

  it('marks the opportunity as lost with a closedAt timestamp', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="OPEN"
        statusLabel="Open"
      />,
    );

    await user.click(screen.getByText('Mark as Lost'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'LOST',
        closedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/),
      },
    });
  });

  it('reopens a won opportunity and clears closedAt', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="WON"
        statusLabel="Won"
      />,
    );

    expect(screen.queryByText('Mark as Won')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark as Lost')).not.toBeInTheDocument();

    await user.click(screen.getByText('Reopen'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'OPEN',
        closedAt: null,
      },
    });
  });
});
