import React from 'react';
import './ShadowTestPage.css';

/**
 * A simple page that previously contained shadow tests
 */
export default function ShadowTestPage() {
  const handleReturnToMain = () => {
    window.location.href = window.location.pathname; // Remove query params
  };

  return (
    <div className="shadow-test-page">
      <div className="shadow-test-header">
        <h2>Shadow Test Page</h2>
        <p>This page was used for testing shadow implementations, but the test components have been removed.</p>
      </div>

      <div className="shadow-info-section">
        <h3>Shadow Implementation Information</h3>
        <p>The shadow implementation has been moved to dedicated files:</p>
        <ul>
          <li><code>src/components/scene/Shadows.ts</code> - Shadow implementation</li>
          <li><code>src/components/scene/Lighting.ts</code> - Lighting implementation</li>
        </ul>
        <p>These components are used in the main scene in <code>BabylonSceneContent.tsx</code>.</p>
      </div>

      <div className="debug-notes-section">
        <h3>Debug Notes</h3>
        <p>
          For detailed information about shadow implementation issues and solutions, please refer to the
          <code>DEBUG_SHADOWS.md</code> document.
        </p>
        <p>
          <strong>Key shadow configuration aspects:</strong>
        </p>
        <ul>
          <li>Engine creation options (preserveDrawingBuffer, stencil)</li>
          <li>Light direction and position</li>
          <li>Shadow generator configuration</li>
          <li>Render loop management</li>
          <li>Material properties</li>
        </ul>
      </div>

      <button type="button" className="return-button" onClick={handleReturnToMain}>
        Return to Main App
      </button>
    </div>
  );
}
