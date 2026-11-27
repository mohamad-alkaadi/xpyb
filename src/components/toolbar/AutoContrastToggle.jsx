const AutoContrastToggle = ({ checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-1">
    <input
      type="checkbox"
      className="cursor-pointer"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>Auto-contrast code text</span>
  </label>
);

export default AutoContrastToggle;
