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
  return (
    <div className="popover-layer">
      <button className="popover-backdrop" aria-label="닫기" onClick={onClose} />
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
