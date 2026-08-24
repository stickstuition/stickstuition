export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="SQUADSUM">
      <span className="brand__squad">SQUAD</span>
      <span className="brand__plus">+</span>
      <span className="brand__sum">SUM</span>
    </div>
  );
}
