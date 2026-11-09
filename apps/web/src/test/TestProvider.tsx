import type { WritableAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { ReactNode } from 'react';
import { StateProvider, type StateStore } from '../state/StateProvider';

/**
 * Any writable atom. With Jotai 3 and TS 7 `useHydrateAtoms` accepts neither `never[]` nor a Map
 * here, only `any[]` write args (jotai discussion #2650); `initial()` keeps the values type-safe.
 */
// biome-ignore lint/suspicious/noExplicitAny: useHydrateAtoms only accepts any[] write args (jotai #2650)
type AnyWritableAtom = WritableAtom<unknown, any[], unknown>;

/** One entry of `initialValues`; create it with `initial()` so the value is type-checked. */
export type InitialAtomValue = readonly [AnyWritableAtom, unknown];

/** Type-safe `[atom, value]` pair: the value must fit the atom. */
export const initial = <Value,>(
  atom: WritableAtom<Value, [Value], unknown>,
  value: NoInfer<Value>
): InitialAtomValue => [atom, value];

type HydrateAtomsProps = { initialValues: readonly InitialAtomValue[]; children: ReactNode };

const HydrateAtoms = ({ initialValues, children }: HydrateAtomsProps) => {
  useHydrateAtoms(initialValues);
  return children;
};

type TestProviderProps = {
  store?: StateStore;
  initialValues?: readonly InitialAtomValue[];
  children: ReactNode;
};

/** Isolated store plus initial atom values for component and hook tests. */
export const TestProvider = ({ store, initialValues = [], children }: TestProviderProps) => (
  <StateProvider store={store}>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </StateProvider>
);
