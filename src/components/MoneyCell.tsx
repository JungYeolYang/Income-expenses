import { useEffect, useState } from 'react';
import { formatMoney, parseMoneyInput } from '../lib/format';

interface Props {
  value: number;
  onChange: (n: number) => void;
  readOnly?: boolean;
  className?: string;
}

export function MoneyCell({ value, onChange, readOnly, className = '' }: Props) {
  const [text, setText] = useState(value ? formatMoney(value) : '');

  useEffect(() => {
    setText(value ? formatMoney(value) : '');
  }, [value]);

  if (readOnly) {
    return <td className={`num ${className}`}>{value ? formatMoney(value) : ''}</td>;
  }

  return (
    <td className={`num editable ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseMoneyInput(text);
          onChange(n);
          setText(n ? formatMoney(n) : '');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
    </td>
  );
}
