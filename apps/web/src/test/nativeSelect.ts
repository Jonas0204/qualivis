import { fireEvent, within } from '@testing-library/react';

/** Chooses the option with this label in a native <select>, as the browser does. */
export const chooseOption = (select: HTMLElement, label: string) => {
    const option = within(select).getByRole<HTMLOptionElement>('option', { name: label });
    fireEvent.change(select, { target: { value: option.value } });
};

/** The label of the chosen option of a native <select>. */
export const chosenLabel = (select: HTMLElement) =>
    (select as HTMLSelectElement).selectedOptions[0]?.textContent;
