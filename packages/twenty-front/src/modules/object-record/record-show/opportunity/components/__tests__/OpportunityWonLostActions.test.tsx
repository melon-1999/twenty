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
        closedAt={null}
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
        closedAt={null}
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
        closedAt="2024-01-10T11:00:00.000Z"
      />,
    );

    expect(screen.queryByText('Mark as Won')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark as Lost')).not.toBeInTheDocument();
    expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();

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

  it('reopens a lost opportunity and shows the closed date', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="LOST"
        statusLabel="Lost"
        closedAt="2024-01-10T11:00:00.000Z"
      />,
    );

    expect(screen.queryByText('Mark as Won')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark as Lost')).not.toBeInTheDocument();
    expect(screen.getByText('Reopen')).toBeInTheDocument();
    expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();

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
