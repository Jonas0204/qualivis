import { sampleItems } from '@data/sample';

export const routes = sampleItems.map(item => ({
  path: `/items/${item.id}`,
  title: item.title,
}));
