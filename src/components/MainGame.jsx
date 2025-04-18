import React, { useRef, useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import soundManager from '../game/soundManager.js';
import { handleRightAnswer } from '../game/rightAnswerHandler.js';
import { handleWrongAnswer } from '../game/wrongAnswerHandler.js';

import { useState } from 'react';
export default function MainGame() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;

      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Preload sounds and ensure audio engine is ready before proceeding
      await soundManager.preload(scene);
      console.log('[MainGame] Audio engine and sounds ready');

      // Example: add a simple camera and light
      const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 8, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true);


      engine.runRenderLoop(() => {
        if (scene) scene.render();
      });

      // Cleanup
      return () => {
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      };
    };
    run();
    // No dependencies: run once on mount
  }, []);

  const [correctBlocks, setCorrectBlocks] = useState(typeof window !== 'undefined' && window.correctBlocks ? window.correctBlocks : 0);

  // Listen for global correctBlocksUpdated event
  React.useEffect(() => {
    function updateCount(e) {
      setCorrectBlocks(e.detail.count);
    }
    window.addEventListener('correctBlocksUpdated', updateCount);
    return () => window.removeEventListener('correctBlocksUpdated', updateCount);
  }, []);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);

  // Listen for feedback UI events
  React.useEffect(() => {
    function showFeedbackHandler() {
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1000);
    }
    function showWrongFeedbackHandler() {
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 1000);
    }
    window.addEventListener('showCorrectFeedback', showFeedbackHandler);
    window.addEventListener('showWrongFeedback', showWrongFeedbackHandler);
    return () => {
      window.removeEventListener('showCorrectFeedback', showFeedbackHandler);
      window.removeEventListener('showWrongFeedback', showWrongFeedbackHandler);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
      {/* Sound Test Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #ccc',
          borderRadius: 12,
          padding: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 320
        }}
      >
        <h3 style={{marginTop:0}}>Sound Test Panel</h3>
        {showFeedback && (
          <div style={{
            background: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: 20,
            padding: '8px 0', borderRadius: 8, textAlign: 'center', marginBottom: 8,
            boxShadow: '0 2px 8px rgba(76,175,80,0.2)'
          }}>Correct!</div>
        )}
        {showWrongFeedback && (
          <div style={{
            background: '#F44336', color: 'white', fontWeight: 'bold', fontSize: 20,
            padding: '8px 0', borderRadius: 8, textAlign: 'center', marginBottom: 8,
            boxShadow: '0 2px 8px rgba(244,67,54,0.2)'
          }}>Wrong!</div>
        )}
        <button style={{marginBottom:8,background:'#4CAF50',color:'white',fontWeight:'bold'}} onClick={() => {
          window.dispatchEvent(new CustomEvent('showCorrectFeedback'));
        }}>Test Feedback UI</button>
        <button style={{marginBottom:8,background:'#F44336',color:'white',fontWeight:'bold'}} onClick={() => {
          window.dispatchEvent(new CustomEvent('showWrongFeedback'));
        }}>Test Wrong Feedback UI</button>
        <div style={{marginBottom:8,fontWeight:'bold'}}>Correct Blocks Awarded: <span id="correct-blocks-count">{correctBlocks}</span></div>
        <button style={{marginBottom:8}} onClick={() => {
          window.correctBlocks = 0;
          setCorrectBlocks(0);
          window.dispatchEvent(new CustomEvent('correctBlocksUpdated', { detail: { count: 0 } }));
        }}>Reset Correct Blocks</button>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <button onClick={() => soundManager.play('correct')}>Play Default</button>
          <button onClick={() => soundManager.stop('correct')}>Stop</button>
          <button onClick={() => soundManager.mute('correct')}>Mute</button>
          <button onClick={() => soundManager.unmute('correct')}>Unmute</button>
        </div>
        <button style={{marginBottom:12}} onClick={() => handleRightAnswer()}>Test handleRightAnswer (Correct Sound)</button>
        <button style={{marginBottom:12,background:'#F44336',color:'white',fontWeight:'bold'}} onClick={() => handleWrongAnswer()}>Test handleWrongAnswer (Wrong Sound)</button>
        <form style={{display:'flex',flexDirection:'column',gap:4}} onSubmit={e => {e.preventDefault();}}>
          <label style={{fontWeight:'bold'}}>Advanced Play Options:</label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span>Offset</span>
            <input id="offset" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
            <small style={{color: 'gray'}}>Note: Babylon.js has a limitation where offset values between 0 and 0.1 are not supported.</small>
            <span>Length</span>
            <input id="length" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
            <span>Volume</span>
            <input id="volume" type="number" step={0.1} min="0" max="1" style={{width:48}} defaultValue={1} />
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>

          </div>
          <button style={{marginTop:8}} onClick={() => {
            const offset = parseFloat(document.getElementById('offset').value) || 0;
            const duration = parseFloat(document.getElementById('length').value) || 0;
            const volume = parseFloat(document.getElementById('volume').value);
            soundManager.play('correct', {
              offset,
              duration,
              volume: isNaN(volume) ? undefined : volume
            });
          }}>Play With Options</button>
        </form>
      </div>
    </>
  );
}
