import React from 'react';
import './Tooltip.css';

export default function Tooltip({ children, content, visible, position }) {
  if (!visible) return null;
  const style = position
    ? {
        left: position.x,
        top: position.y,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
      }
    : undefined;
  return (
    <div className="inventory-tooltip" style={style}>
      {content}
      {children}
    </div>
  );
}
