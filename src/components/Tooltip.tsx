import React from 'react';
import './Tooltip.css';

interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipProps {
  children?: React.ReactNode;
  content: string;
  visible: boolean;
  position?: TooltipPosition;
}

export default function Tooltip({ children, content, visible, position }: TooltipProps) {
  if (!visible) return null;
  
  const style: React.CSSProperties | undefined = position
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
