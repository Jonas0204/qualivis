import { createRoot } from 'react-dom/client';
import { Page } from '../components/page/Page';

function Root() {
  return <Page title="Overview" />;
}

createRoot(document.getElementById('root')!).render(<Root />);
