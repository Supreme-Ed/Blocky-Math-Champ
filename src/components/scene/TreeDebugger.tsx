import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface TreeDebuggerProps {
  scene: BABYLON.Scene | null;
}

/**
 * TreeDebugger component for Babylon.js scene.
 * Loads the tree model and adds debug visualization to show its structure.
 */
function TreeDebugger({ scene }: TreeDebuggerProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("TreeDebugger: Starting to debug tree model");
    
    // Create a parent node for all debug elements
    const debugParent = new BABYLON.TransformNode("treeDebugParent", scene);
    debugParent.position = new BABYLON.Vector3(10, 0, -10); // Position to the right
    
    // Load the tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log("TreeDebugger: Tree loaded successfully, meshes:", meshes.map(m => ({
          name: m.name,
          id: m.id,
          hasParent: !!m.parent,
          parentName: m.parent?.name || "none",
          position: m.position,
          scaling: m.scaling,
          hasMaterial: !!m.material,
          materialName: m.material?.name || "none"
        })));
        
        if (meshes && meshes.length > 0) {
          // Store the meshes
          treeMeshesRef.current = meshes;
          
          // Parent all meshes to the debug parent
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = debugParent;
            }
          });
          
          // Scale the debug parent
          debugParent.scaling = new BABYLON.Vector3(5, 5, 5);
          
          // Create debug visualization for each mesh
          meshes.forEach((mesh, index) => {
            if (mesh.id !== "__root__") {
              // Create a wireframe box around the mesh
              const boundingInfo = mesh.getBoundingInfo();
              const min = boundingInfo.boundingBox.minimumWorld;
              const max = boundingInfo.boundingBox.maximumWorld;
              
              const width = max.x - min.x;
              const height = max.y - min.y;
              const depth = max.z - min.z;
              
              const debugBox = BABYLON.MeshBuilder.CreateBox(
                `debugBox_${index}`,
                { width, height, depth },
                scene
              );
              
              // Position the debug box at the center of the mesh
              debugBox.position = new BABYLON.Vector3(
                (min.x + max.x) / 2,
                (min.y + max.y) / 2,
                (min.z + max.z) / 2
              );
              
              // Create a wireframe material
              const wireframeMat = new BABYLON.StandardMaterial(`wireframeMat_${index}`, scene);
              wireframeMat.wireframe = true;
              wireframeMat.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red
              debugBox.material = wireframeMat;
              
              // Parent the debug box to the debug parent
              debugBox.parent = debugParent;
              
              console.log(`TreeDebugger: Created debug box for mesh ${mesh.name}`);
            }
          });
          
          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log(`TreeDebugger: Added mesh to shadow casters:`, mesh.name);
            });
          }
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("TreeDebugger: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("TreeDebugger: Error loading tree:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (debugParent) debugParent.dispose();
      treeMeshesRef.current.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
    };
  }, [scene]);
  
  return null;
}

export default TreeDebugger;
