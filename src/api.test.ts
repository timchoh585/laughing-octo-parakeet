import { getBug } from './api/api';
import fetchMock from 'fetch-mock';

describe('API Tests', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  afterAll(() => {
    fetchMock.restore();
  });

  it('should fetch bug details for a given bug ID', async () => {
    const bugId = 12345;
    const mockResponse = {
      bugs: [
        {
          id: bugId,
          summary: 'Test Bug',
          description: 'This is a test bug',
          creation_time: '2023-01-01T00:00:00Z'
        }
      ]
    };

    fetchMock.get(`https://bugzilla.mozilla.org/rest/bug/${bugId}`, {
      status: 200,
      body: mockResponse
    });

    const result = await getBug(bugId);
    expect(result).toEqual(mockResponse.bugs[0]);
  });

  it('should throw an error for an invalid response', async () => {
    const bugId = 12345;

    fetchMock.get(`https://bugzilla.mozilla.org/rest/bug/${bugId}`, {
      status: 404
    });

    await expect(getBug(bugId)).rejects.toThrow('Network response was not ok');
  });
});
