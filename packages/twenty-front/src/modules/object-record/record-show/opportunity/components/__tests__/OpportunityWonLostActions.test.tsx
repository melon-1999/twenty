import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OpportunityWonLostActions } from '@/object-record/record-show/opportunity/components/OpportunityWonLostActions';
import { OPPORTUNITY_LOST_REASONS } from '@/object-record/record-show/opportunity/constants/opportunityLostReasons';

const mockUpdateOneRecord = jest.fn();

const OPPORTUNITY_LOST_REASON_LABELS = OPPORTUNITY_LOST_REASONS.map(
  (reason) => reason.label,
);

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
        closedAt={null}
        lostReason={null}
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
        lostReason: null,
      },
    });
  });

  it('opens the Lost dropdown and marks the opportunity as lost with the chosen reason', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="OPEN"
        closedAt={null}
        lostReason={null}
      />,
    );

    await user.click(screen.getByText('Mark as Lost'));
    await user.click(screen.getByText('Sonstiges'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'LOST',
        closedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/),
        lostReason: 'OTHER',
      },
    });
  });

  it('reopens a won opportunity and clears closedAt', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="WON"
        closedAt="2024-01-10T11:00:00.000Z"
        lostReason={null}
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
        lostReason: null,
      },
    });
  });

  it('reopens a lost opportunity and shows the closed date', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="LOST"
        closedAt="2024-01-10T11:00:00.000Z"
        lostReason="LOST_TO_COMPETITOR"
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
        lostReason: null,
      },
    });
  });

  it('marking Lost with a reason sets status, closedAt and lostReason in one update', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="OPEN"
        closedAt={null}
        lostReason={null}
      />,
    );

    await user.click(screen.getByText('Mark as Lost'));
    await user.click(screen.getByText('Konkurrenz'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'LOST',
        closedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/),
        lostReason: 'LOST_TO_COMPETITOR',
      },
    });
  });

  it('marking Lost with "Ohne Grund" sets lostReason null', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="OPEN"
        closedAt={null}
        lostReason={null}
      />,
    );

    await user.click(screen.getByText('Mark as Lost'));
    await user.click(screen.getByText('Ohne Grund'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'LOST',
        closedAt: expect.stringMatching(/\d{4}-\d{2}-\d{2}T/),
        lostReason: null,
      },
    });
  });

  it('Reopen clears lostReason', async () => {
    const user = userEvent.setup();
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="LOST"
        closedAt="2024-01-10T11:00:00.000Z"
        lostReason="LOST_TO_COMPETITOR"
      />,
    );

    await user.click(screen.getByText('Reopen'));

    expect(mockUpdateOneRecord).toHaveBeenCalledTimes(1);
    expect(mockUpdateOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'opportunity',
      idToUpdate: 'rec-1',
      updateOneRecordInput: {
        status: 'OPEN',
        closedAt: null,
        lostReason: null,
      },
    });
  });

  it('renders the German reason chip for a Lost deal with a reason', () => {
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="LOST"
        closedAt="2024-01-10T11:00:00.000Z"
        lostReason="TOO_EXPENSIVE"
      />,
    );

    expect(screen.getByText('Zu teuer')).toBeInTheDocument();
  });

  it('renders no reason chip when lostReason is null on a Lost deal', () => {
    render(
      <OpportunityWonLostActions
        recordId="rec-1"
        status="LOST"
        closedAt="2024-01-10T11:00:00.000Z"
        lostReason={null}
      />,
    );

    OPPORTUNITY_LOST_REASON_LABELS.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });
});
