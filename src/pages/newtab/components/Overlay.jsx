import { useEffect, useRef } from "react";

export default function Overlay({ title, onClose, children }) {
  const ref = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    dialog.querySelector("input[type=search]")?.focus();
    return () => {
      dialog.close();
      opener.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="poem-dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" aria-label="关闭" onClick={onClose}>
          关闭
        </button>
      </header>
      {children}
    </dialog>
  );
}
