import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface MassiveTreeProps {
  scene: BABYLON.Scene | null;
}

/**
 * MassiveTree component for Babylon.js scene.
 * Loads the Tree.gltf model at a massive scale to ensure visibility.
 */
function MassiveTree({ scene }: MassiveTreeProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("MassiveTree: Starting to load tree at massive scale");
    
    // Create a light specifically for the tree
    const treeLight = new BABYLON.HemisphericLight("treeLight", new BABYLON.Vector3(0, 1, 0), scene);
    treeLight.intensity = 1.0;
    treeLight.diffuse = new BABYLON.Color3(1, 1, 1);
    treeLight.specular = new BABYLON.Color3(1, 1, 1);
    treeLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    
    // Load the tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log("MassiveTree: Tree loaded successfully, meshes:", meshes.map(m => ({
          name: m.name,
          id: m.id,
          position: m.position.toString(),
          isVisible: m.isVisible
        })));
        
        if (meshes && meshes.length > 0) {
          // Store the meshes
          treeMeshesRef.current = meshes;
          
          // Create a parent transform node for all tree meshes
          const treeParent = new BABYLON.TransformNode("massiveTreeParent", scene);
          
          // Position the tree in front of the camera
          const camera = scene.activeCamera;
          if (camera) {
            const forward = camera.getForwardRay().direction;
            const position = camera.position.add(forward.scale(20));
            position.y = 0; // Place on ground
            treeParent.position = position;
            console.log("MassiveTree: Positioned tree in front of camera at:", position);
          } else {
            treeParent.position = new BABYLON.Vector3(0, 0, -20);
            console.log("MassiveTree: Positioned tree at default position");
          }
          
          // Parent all meshes to the tree parent
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = treeParent;
              
              // Ensure the mesh is visible
              mesh.isVisible = true;
              
              // Log mesh details
              console.log(`MassiveTree: Mesh ${mesh.name} details:`, {
                isVisible: mesh.isVisible,
                hasMaterial: !!mesh.material,
                materialType: mesh.material ? mesh.material.getClassName() : 'none',
                position: mesh.position.toString(),
                absolutePosition: mesh.getAbsolutePosition().toString()
              });
            }
          });
          
          // Apply a massive scale (20x)
          const scale = 20.0;
          treeParent.scaling = new BABYLON.Vector3(scale, scale, scale);
          console.log("MassiveTree: Applied massive scale (20x) to tree");
          
          // Create a debug sphere at the origin of the tree parent
          const debugSphere = BABYLON.MeshBuilder.CreateSphere("treeOriginSphere", { diameter: 2 }, scene);
          debugSphere.position = treeParent.position.clone();
          const sphereMat = new BABYLON.StandardMaterial("sphereMat", scene);
          sphereMat.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
          sphereMat.emissiveColor = new BABYLON.Color3(1, 0, 0); // Make it glow
          debugSphere.material = sphereMat;
          
          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log(`MassiveTree: Added mesh to shadow casters:`, mesh.name);
            });
          }
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("MassiveTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("MassiveTree: Error loading tree:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (treeLight) treeLight.dispose();
      treeMeshesRef.current.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
    };
  }, [scene]);
  
  return null;
}

export default MassiveTree;
