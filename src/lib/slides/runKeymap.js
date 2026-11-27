/**
 * Builds the key bindings that run the code in an editor.
 * @param {(code: string) => void} onRun Receives the editor's current text.
 * @returns {{key: string, run: Function}[]} CodeMirror key bindings.
 */
export const getRunKeymap = (onRun) => [
  {
    key: 'Shift-Enter',
    run: (view) => {
      onRun(view.state.doc.toString());
      return true;
    },
  },
];
