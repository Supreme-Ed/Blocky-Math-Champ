import React from 'react';
import ShadowTest from './ShadowTest';
import './ShadowTest.css';

/**
 * A simple page to test shadows in isolation
 */
export default function ShadowTestPage() {
  return (
    <div className="shadow-test-page">
      <div className="shadow-test-header">
        <h2>Shadow Test</h2>
        <p>This is a minimal test of Babylon.js shadows. You should see a red box casting a shadow on the gray ground.</p>
      </div>
      <div className="shadow-test-content">
        <ShadowTest />
      </div>
    </div>
  );
}
