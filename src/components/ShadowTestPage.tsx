import React from 'react';
import ShadowTest from './ShadowTest';
import SimpleShadowTest from './SimpleShadowTest';
import MinimalBabylonShadowDemo from './MinimalBabylonShadowDemo';
import './ShadowTest.css';

/**
 * A simple page to test shadows in isolation
 */
export default function ShadowTestPage() {
  const handleReturnToMain = () => {
    window.location.href = window.location.pathname; // Remove query params
  };

  return (
    <div className="shadow-test-page">
      <div className="shadow-test-header">
        <h2>Shadow Test Comparison</h2>
        <p>This page compares different shadow implementations to help diagnose shadow rendering issues.</p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div>
          <h3>Original Working Demo</h3>
          <MinimalBabylonShadowDemo />
        </div>

        <div>
          <h3>New Simple Test</h3>
          <SimpleShadowTest />
        </div>
      </div>

      <div className="shadow-test-content">
        <h3>Current Implementation</h3>
        <ShadowTest />
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Debug Notes</h3>
        <p>
          This page compares different shadow implementations. If one works and others don't, check the console
          for detailed logging information about the differences.
        </p>
        <p>
          <strong>Key differences to check:</strong>
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
