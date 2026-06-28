import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface PopoverProps {
  top: number;
  left: number;
  width: number;
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Popover({ top, left, width, className, onClose, children }: PopoverProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="popover-layer">
      <div className="popover-backdrop" aria-hidden="true" onClick={onClose} />
      <div
        className={`popover${className ? ` ${className}` : ''}`}
        style={{ top, left, width }}
        role="menu"
      >
        {children}
      </div>
    </div>
  );
}
