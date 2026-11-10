type SwatchProps = { color: string };

export function Swatch({ color }: SwatchProps) {
  return <span className="swatch" style={{ backgroundColor: color }} />;
}
