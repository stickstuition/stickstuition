import { X } from "lucide-react";

export default function ConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="modal modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="leave-title">
        <button type="button" className="modal-close" onClick={onCancel} aria-label="Close"><X /></button>
        <div className="confirm-icon">↩</div>
        <p>CLASSROOM MODE</p>
        <h2 id="leave-title">Leave classroom game?</h2>
        <span>Your score will reset when you return to the menu.</span>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel}>KEEP PLAYING</button>
          <button type="button" className="danger-button" onClick={onConfirm}>LEAVE GAME</button>
        </div>
      </section>
    </div>
  );
}
