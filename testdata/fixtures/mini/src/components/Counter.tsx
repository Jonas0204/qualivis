import React, { useCallback, useState } from 'react';

interface CounterProps {
  value: number;
  onIncrement: () => void;
}

export function Counter({ value, onIncrement }: CounterProps) {
  const [clicks, setClicks] = useState<number>(0);

  const handleClick = useCallback(() => {
    setClicks(clicks + 1);
    onIncrement();
  }, [clicks, onIncrement]);

  const formatValue = (input: number): string => {
    if (input < 0) {
      return 'negative';
    }
    return input > 100 ? 'many' : String(input);
  };

  const renderBadge = () => <span className="badge">{clicks}</span>;

  return (
    <button type="button" onClick={handleClick}>
      {formatValue(value)} {renderBadge()}
    </button>
  );
}
