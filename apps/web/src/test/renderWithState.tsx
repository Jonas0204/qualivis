import { render, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'jotai';
import type { ReactElement, ReactNode } from 'react';
import type { StateStore } from '../state/StateProvider';
import { type InitialAtomValue, TestProvider } from './TestProvider';

export type StateOptions = { store?: StateStore; initialValues?: readonly InitialAtomValue[] };

const createWrapper = (store: StateStore, initialValues: readonly InitialAtomValue[]) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProvider store={store} initialValues={initialValues}>
      {children}
    </TestProvider>
  );
  return Wrapper;
};

/** Renders `ui` with its own store; returns the store (for assertions) and a userEvent instance. */
export const renderWithState = (
  ui: ReactElement,
  { store = createStore(), initialValues = [] }: StateOptions = {}
) => {
  const user = userEvent.setup();
  return { store, user, ...render(ui, { wrapper: createWrapper(store, initialValues) }) };
};

/** Like `renderWithState`, for hooks. */
export const renderHookWithState = <Result,>(
  hook: () => Result,
  { store = createStore(), initialValues = [] }: StateOptions = {}
) => ({ store, ...renderHook(hook, { wrapper: createWrapper(store, initialValues) }) });
