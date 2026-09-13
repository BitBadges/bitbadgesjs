import { loadDocs } from './docs-cache.js';

jest.mock('fs', () => ({
  existsSync: () => false,
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('public documentation discovery', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads the public corpus without depending on a repository or SUMMARY.md', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        '# Corpus\n\n## File: standards/invoices.md\n\n# Invoices\nPayment terms.\n\n## File: ./learn/approvals.md\n\n# Approvals\nApproval limits.'
    } as Response);
    const docs = await loadDocs();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://docs.bitbadges.io/for-llms.txt');
    expect(Object.keys(docs.byPath)).toEqual(['standards/invoices.md', 'learn/approvals.md']);
    expect(docs.tree.find((section) => section.slug === 'standards')?.children).toEqual([
      { title: 'Invoices', slug: 'invoices', path: 'standards/invoices.md', children: [] }
    ]);
  });

  it('rejects an HTML fallback page instead of caching empty documentation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, text: async () => '<html>Not found</html>' } as Response);
    await expect(loadDocs()).rejects.toThrow('No documentation pages');
  });
});
