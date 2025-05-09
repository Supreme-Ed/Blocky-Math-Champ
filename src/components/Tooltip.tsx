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
        top: position.y - 10, // Offset to position above the cursor
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
      }
    : undefined;

  // Format multi-line content
  const formattedContent = content.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < content.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));

  return (
    <div className="inventory-tooltip" style={style}>
      {formattedContent}
      {children}
    </div>
  );
}
