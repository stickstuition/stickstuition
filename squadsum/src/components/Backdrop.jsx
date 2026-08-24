import Brand from "./Brand";

const marks = Array.from({ length: 30 }, (_, index) => index);

export default function Backdrop({ children }) {
  return (
    <main className="app-shell">
      <div className="wordmark-pattern" aria-hidden="true">
        {marks.map((mark) => (
          <span key={mark} style={{ "--tilt": `${(mark % 5) - 2}deg` }}>
            SQUADSUM
          </span>
        ))}
      </div>
      <section className="game-panel">{children}</section>
      <div className="tiny-mark" aria-hidden="true">
        <Brand compact />
      </div>
    </main>
  );
}
