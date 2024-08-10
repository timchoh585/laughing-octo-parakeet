import fetchMock from 'fetch-mock';
import '@testing-library/jest-dom';

beforeEach(() => {
  fetchMock.reset();
});

afterAll(() => {
  fetchMock.restore();
});
