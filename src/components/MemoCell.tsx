interface Props {
  value: string;
  onChange: (text: string) => void;
  className?: string;
}

export function MemoCell({ value, onChange, className = '' }: Props) {
  return (
    <td className={`memo-col editable ${className}`}>
      <input
        type="text"
        value={value}
        placeholder="적요"
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value.trim())}
      />
    </td>
  );
}
