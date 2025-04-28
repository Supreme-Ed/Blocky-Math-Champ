// Inventory.jsx
// Minecraft-style inventory UI with auto-generated 2D icons from 3D Babylon.js blocks
import React, { useEffect, useState } from 'react';
import './Inventory.css';
import blockAwardManager from '../game/blockAwardManager';
import { BLOCK_TYPES } from '../game/blockTypes';

// Babylon.js imports
import * as BABYLON from '@babylonjs/core';

const ICON_SIZE = 200; // px



export default function Inventory() {
  const [blocks, setBlocks] = useState(blockAwardManager.getBlocks());
  const [icons, setIcons] = useState({});
  

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
    
    let disposed = false;
    async function generateIcons() {
      const iconPromises = BLOCK_TYPES.map(blockType => {
        return new Promise(resolve => {
          
          const cacheKey = `blocky_icon_${blockType.id}`;
          let icon = window.localStorage?.getItem(cacheKey);
          if (icon) {
            resolve({ id: blockType.id, icon });
            return;
          }
          try {
            
            const canvas = document.createElement('canvas');
            canvas.width = ICON_SIZE;
            canvas.height = ICON_SIZE;
            const engine = new BABYLON.Engine(canvas, false, { preserveDrawingBuffer: true });
            
            const scene = new BABYLON.Scene(engine);
            
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
                
                engine.dispose();
                resolve({ id: blockType.id, icon: null });
              }
            }
          } catch (err) {
            
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
      <div key={Object.keys(icons).join('-')} className="inventory-hotbar">
        <div className="inventory-hotbar-inner">
          {BLOCK_TYPES.map(type => {
            const qty = blocks[type.id] || 0;
            const icon = icons[type.id];
            return (
              <div key={type.id} className="inventory-block">
                {icon ? (
                  <img src={icon} alt={type.name} width={ICON_SIZE} height={ICON_SIZE} className="inventory-block-icon" />
                ) : (
                  <div className="inventory-block-placeholder" />
                )}
                <span className="inventory-block-qty">{qty}</span>
              </div>
            );
          })}
        </div>
      </div>
      
    </>
  );
}
