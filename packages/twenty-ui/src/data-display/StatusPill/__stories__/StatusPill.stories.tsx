import { type Meta, type StoryObj } from '@storybook/react-vite';

import { ComponentDecorator } from '@ui/testing/decorators/ComponentDecorator';

import { StatusPill } from '@ui/data-display/StatusPill/StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'UI/Data Display/StatusPill',
  component: StatusPill,
  decorators: [ComponentDecorator],
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <StatusPill variant="success" label="Won" withDot />
      <StatusPill variant="danger" label="Lost" withDot />
      <StatusPill variant="warning" label="At risk" withDot />
      <StatusPill variant="info" label="Open" withDot />
      <StatusPill variant="neutral" label="Cold" withDot />
    </div>
  ),
};

export const WithoutDot: Story = {
  args: { variant: 'success', label: 'Active' },
};
