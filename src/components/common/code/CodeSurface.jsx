const CodeSurface = ({ appearance: { isDark, backdrop, textColor }, children }) => (
  <div
    data-testid="code-surface"
    data-tone={isDark ? 'dark' : 'light'}
    className={`h-full min-h-0 w-full ${backdrop ? 'rounded-xl backdrop-blur-md' : ''}`}
    style={{ backgroundColor: backdrop || 'transparent', color: textColor }}
  >
    {children}
  </div>
);

export default CodeSurface;
