import { createStore, Provider } from 'jotai';
import { type ReactNode, useState } from 'react';

export type StateStore = ReturnType<typeof createStore>;

type StateProviderProps = { store?: StateStore; children: ReactNode };

/** Provides an isolated Jotai store (tests pass their own). */
export const StateProvider = ({ store, children }: StateProviderProps) => {
  const [value] = useState(() => store ?? createStore());
  return <Provider store={value}>{children}</Provider>;
};
