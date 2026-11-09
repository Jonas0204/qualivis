import { describe, expect, it } from 'vitest';
import { type AnalysisState, analysisAtom, initialAnalysisState } from '../state/analysisAtoms';
import { viewModeAtom } from '../state/viewAtoms';
import { renderWithState } from '../test/renderWithState';
import { initial } from '../test/TestProvider';
import { App } from './App';

const running: AnalysisState = { ...initialAnalysisState, status: 'running', progress: 40 };

describe('App', () => {
  it('shows the progress bar in the graph view while the analysis runs', () => {
    const { getByRole } = renderWithState(<App />, {
      initialValues: [initial(analysisAtom, running), initial(viewModeAtom, 'graph')],
    });

    expect(getByRole('progressbar').getAttribute('aria-valuenow')).toBe('40');
  });

  it('shows no progress bar in the upload view, like the legacy app', () => {
    const { getByText, queryByRole } = renderWithState(<App />, {
      initialValues: [initial(analysisAtom, running), initial(viewModeAtom, 'upload')],
    });

    expect(getByText('Drag and drop or browse a folder')).toBeTruthy();
    expect(queryByRole('progressbar')).toBeNull();
  });
});
