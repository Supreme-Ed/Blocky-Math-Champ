// Inventory.jsx
// Minecraft-style inventory UI with auto-generated 2D icons from 3D Babylon.js blocks
import React, { useEffect, useState } from 'react';
import blockAwardManager from '../game/blockAwardManager';
import { BLOCK_TYPES } from '../game/blockTypes';

// Babylon.js imports
import * as BABYLON from '@babylonjs/core';

const ICON_SIZE = 48; // px



export default function Inventory() {
  const [blocks, setBlocks] = useState(blockAwardManager.getBlocks());
  const [icons, setIcons] = useState({});
  // DEBUG: Log icons object on every render
  console.log('INVENTORY RENDER icons:', icons);
  console.log('BLOCK_TYPES:', BLOCK_TYPES);

  // On mount, try to load any cached icons from localStorage
  useEffect(() => {
    const cachedIcons = {};
    for (const blockType of BLOCK_TYPES) {
      const cacheKey = `blocky_icon_${blockType.id}`;
      const icon = window.localStorage?.getItem(cacheKey);
      if (icon) {
        cachedIcons[blockType.id] = icon;
      }
    }
    if (Object.keys(cachedIcons).length > 0) {
      setIcons(current => ({ ...current, ...cachedIcons }));
    }
  }, []);

  useEffect(() => {
    function update() {
      setBlocks(blockAwardManager.getBlocks());
    }
    window.addEventListener('blockAwarded', update);
    window.addEventListener('blockRemoved', update);
    return () => {
      window.removeEventListener('blockAwarded', update);
      window.removeEventListener('blockRemoved', update);
    };
  }, []);

  useEffect(() => {
    console.log('Inventory: icon generation effect running');
    let disposed = false;
    async function generateIcons() {
      const iconPromises = BLOCK_TYPES.map(blockType => {
        return new Promise(resolve => {
          console.log(`[Inventory] Generating icon for`, blockType.id, blockType.texture || blockType.color || '(no texture/color)');
          const cacheKey = `blocky_icon_${blockType.id}`;
          let icon = window.localStorage?.getItem(cacheKey);
          if (icon) {
            resolve({ id: blockType.id, icon });
            return;
          }
          try {
            console.log(`[Inventory] Running Babylon.js icon generation for ${blockType.id}`);
            const canvas = document.createElement('canvas');
            canvas.width = ICON_SIZE;
            canvas.height = ICON_SIZE;
            const engine = new BABYLON.Engine(canvas, false, { preserveDrawingBuffer: true });
            console.log(`[Inventory] Babylon.js engine created for ${blockType.id}`);
            const scene = new BABYLON.Scene(engine);
            console.log(`[Inventory] Babylon.js scene created for ${blockType.id}`);
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background for inventory icons
            const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 3, BABYLON.Vector3.Zero(), scene);
            camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
            camera.orthoLeft = -1.5;
            camera.orthoRight = 1.5;
            camera.orthoTop = 1.5;
            camera.orthoBottom = -1.5;
            camera.minZ = 0.1;
            camera.maxZ = 10;
            camera.attachControl(canvas, false);
            new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 1), scene);
            let mesh;
            if (blockType.meshBuilder) {
              console.log(`[Inventory] Using custom meshBuilder for ${blockType.id}`);
              mesh = blockType.meshBuilder(scene, BABYLON);
            } else {
              mesh = BABYLON.MeshBuilder.CreateBox('block', { size: 1 }, scene);
              console.log(`[Inventory] Default box mesh created for ${blockType.id}`);
            }
            const mat = new BABYLON.StandardMaterial('mat', scene);
            let assigned = false;
            if (blockType.texture) {
              mat.diffuseTexture = new BABYLON.Texture(blockType.texture, scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
              assigned = true;
            }
            if (blockType.color) {
              mat.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
              assigned = true;
            }
            if (!assigned) {
              mat.diffuseColor = new BABYLON.Color3(0, 1, 0); // Fallback: bright green
            }
            mesh.material = mat;
            console.log(`[Inventory] Material assigned to mesh for ${blockType.id}`);
            if (blockType.texture) {
              const finishRender = () => {
                let frames = 0;
                const maxFrames = 5;
                function renderLoop() {
                  scene.render();
                  frames++;
                  if (frames < maxFrames) {
                    requestAnimationFrame(renderLoop);
                  } else {
                    try {
                      const icon = canvas.toDataURL('image/png');
                      window.localStorage?.setItem(cacheKey, icon);
                      engine.dispose();
                      resolve({ id: blockType.id, icon });
                    } catch (err) {
                      console.error(`Inventory: Error generating icon for block type ${blockType.id}`, err);
                      engine.dispose();
                      resolve({ id: blockType.id, icon: null });
                    }
                  }
                }
                renderLoop();
              };
              if (mat.diffuseTexture.onLoadObservable && mat.diffuseTexture.onLoadObservable.addOnce) {
                mat.diffuseTexture.onLoadObservable.addOnce(() => {
                  finishRender();
                });
              } else {
                let waited = 0;
                const poll = () => {
                  if (mat.diffuseTexture.isReady()) {
                    finishRender();
                  } else if (waited > 2000) {
                    console.warn(`[Inventory] Texture did not load in time for ${blockType.id}`);
                    finishRender();
                  } else {
                    waited += 50;
                    setTimeout(poll, 50);
                  }
                };
                poll();
              }
            } else {
              scene.render();
              try {
                const icon = canvas.toDataURL('image/png');
                window.localStorage?.setItem(cacheKey, icon);
                engine.dispose();
                resolve({ id: blockType.id, icon });
              } catch (err) {
                console.error(`Inventory: Error generating icon for block type ${blockType.id}`, err);
                engine.dispose();
                resolve({ id: blockType.id, icon: null });
              }
            }
          } catch (err) {
            console.error(`[Inventory] EXCEPTION generating icon for block type ${blockType.id}:`, err);
            resolve({ id: blockType.id, icon: null });
          }
        });
      });
      const results = await Promise.all(iconPromises);
      if (!disposed) {
        const iconsObj = {};
        results.forEach(({ id, icon }) => {
          if (icon) iconsObj[id] = icon;
        });
        setIcons(iconsObj);
        console.log(`[Inventory] setIcons with all icons`, iconsObj);
      }
    }
    generateIcons();
    return () => { disposed = true; };
  }, []);

  return (
    <>
      <div key={Object.keys(icons).join('-')} style={{
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        background: 'rgba(36, 36, 36, 0.95)',
        border: '2px solid #888',
        borderRadius: '12px 0 0 12px',
        padding: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 64,
      }}>
        {BLOCK_TYPES.map(type => {
          const qty = blocks[type.id] || 0;
          const icon = icons[type.id];
          return (
            <div key={type.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              border: '2px solid #333', borderRadius: 8, background: '#222', padding: 4, minWidth: ICON_SIZE, minHeight: ICON_SIZE + 18
            }}>
              {icon
                ? <>
                  {console.log('ICON FOR', type.id, icon)}
                  // If this image is blank, try right-clicking and opening in a new tab to check the PNG data.
<img key={type.id} src={icon} alt={type.name} width={ICON_SIZE} height={ICON_SIZE} style={{ imageRendering: 'pixelated', borderRadius: 4, border: '2px solid red' }} />
                  <div style={{fontSize:8, color:'#ccc', wordBreak:'break-all', maxWidth:ICON_SIZE*2, marginTop:2}}>
                    {icon.startsWith('data:image/png;base64,') ? 'OK' : 'BAD'}
                    <br/>{icon.slice(0, 40)}...{icon.slice(-8)}
                  </div>
                  {/* Debug: Show the actual canvas rendered from PNG */}
                  <canvas width={ICON_SIZE} height={ICON_SIZE} ref={el => {
                    if (el && icon.startsWith('data:image/png;base64,')) {
                      const ctx = el.getContext('2d');
                      const img = new window.Image();
                      img.onload = () => ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
                      img.src = icon;
                    }
                  }} style={{border:'1px solid red', marginTop:2}} />
                  {/* Show the raw texture PNG for debug */}
                  {type.texture && (
                    <img src={type.texture} alt={type.id+"-raw"} width={ICON_SIZE} height={ICON_SIZE} style={{border:'1px solid blue', marginTop:2}} />
                  )}
                </>
                : <div style={{ width: ICON_SIZE, height: ICON_SIZE, background: '#444', borderRadius: 4, border: '2px solid red' }}>No icon</div>}
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 3 }}>{qty}</span>
            </div>
          );
        })}
      </div>
      <pre style={{color:'#fff',background:'#222',padding:'8px',fontSize:'10px',overflow:'auto'}}>{JSON.stringify(icons,null,2)}</pre>
    </>
  );
}
