export const notebook = () => ({
  nbformat: 4,
  nbformat_minor: 5,
  metadata: { kernelspec: { name: 'python3', display_name: 'Python 3' } },
  cells: [
    { cell_type: 'markdown', id: 'intro', metadata: {}, source: ['# Title\n', 'Body'] },
    {
      cell_type: 'code',
      id: 'calc',
      metadata: { tags: ['demo'] },
      execution_count: 3,
      source: 'print(1)\n',
      outputs: [{ output_type: 'stream', name: 'stdout', text: ['1\n'] }],
    },
  ],
});

export const deck = () => ({
  format: 'xpyb',
  version: 1,
  sourceNotebook: '/work/talk.ipynb',
  metadata: { language_info: { name: 'python' } },
  slides: [
    {
      id: 'opening',
      layout: 'title',
      backgroundColor: '#000000',
      textColor: '#ffffff',
      cells: [
        { id: 'a', type: 'markdown', source: '# Hi\n', metadata: {}, outputs: [] },
        {
          id: 'b',
          type: 'code',
          source: '1 + 1',
          metadata: {},
          executionCount: 1,
          outputs: [{ output_type: 'execute_result', data: { 'text/plain': '2' } }],
        },
      ],
    },
    { id: 'blank', layout: 'blank', backgroundColor: '#123456', textColor: '#abcdef', cells: [] },
  ],
});
