// src/routes/bugs/[id].test.js
import { render, screen } from '@testing-library/svelte';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import BugDetails from './[id].svelte/ Mock API responses
const server = setupServer(
  rest.get('https://bugzilla.mozilla.org/rest/bug/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json({ bugs: [{ id, summary: `Bug Summary ${id}`, description: `Bug Description ${id}`, creation_time: '2023-01-01T00:00:00Z' }] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders bug details correctly', async () => {
  // Set up the route parameter
  window.history.pushState({}, 'Bug Details', '/bugs/1794235');

  render(BugDetails);

  expect(await screen.findByText('Bug Summary 1794235')).toBeInTheDocument();
  expect(screen.getByText('Bug Description 1794235')).toBeInTheDocument();
  expect(screen.getByText('ID: 1794235')).toBeInTheDocument();
});
