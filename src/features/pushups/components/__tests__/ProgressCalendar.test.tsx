import { fireEvent, render } from '@testing-library/react-native';

import { buildProgressCalendar } from '../../domain/progress';
import type { DayKey } from '../../domain/types';
import { ProgressCalendar } from '../ProgressCalendar';

jest.mock('@/design-system/PlatformIcon', () => ({
  PlatformIcon: () => null,
}));

describe('ProgressCalendar', () => {
  it('navigates backward, disables the next month at the present, and selects available days', async () => {
    const onPreviousMonth = jest.fn();
    const onNextMonth = jest.fn();
    const onSelectDay = jest.fn();
    const days = buildProgressCalendar(
      '2024-05-01' as DayKey,
      '2024-05-09' as DayKey,
      '2024-05-09' as DayKey,
      [],
    );
    const screen = await render(
      <ProgressCalendar
        displayedMonthKey="2024-05-01"
        days={days}
        canGoToNextMonth={false}
        compact={false}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
        onSelectDay={onSelectDay}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
    await fireEvent.press(screen.getByRole('button', {
      name: 'Wednesday, May 8, 2024, 0 push-ups',
    }));

    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    expect(onSelectDay).toHaveBeenCalledWith('2024-05-08');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    expect(screen.getByRole('button', {
      name: 'Thursday, May 9, 2024, 0 push-ups',
    }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('button', { name: 'Friday, May 10, 2024, 0 push-ups' }))
      .toBeDisabled();
  });
});
