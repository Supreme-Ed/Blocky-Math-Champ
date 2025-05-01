import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface GiantTreeProps {
  scene: BABYLON.Scene | null;
}

/**
 * GiantTree component for Babylon.js scene.
 * Loads the Tree.gltf model and scales it to 600% of its original size.
 */
function GiantTree({ scene }: GiantTreeProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);

  useEffect(() => {
    if (!scene) return;

    console.log("GiantTree: Starting to load tree at 600% scale");

    // Create a reference box to show the intended position and scale
    const refBox = BABYLON.MeshBuilder.CreateBox("treeRefBox", {
      width: 6,
      height: 12,
      depth: 6
    }, scene);
    refBox.position = new BABYLON.Vector3(0, 6, -10);

    const refBoxMaterial = new BABYLON.StandardMaterial("refBoxMat", scene);
    refBoxMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0);
    refBoxMaterial.alpha = 0.3; // Make it semi-transparent
    refBox.material = refBoxMaterial;

    console.log("GiantTree: Created reference box at position:", refBox.position);

    // Load the tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log("GiantTree: Tree loaded successfully, meshes:", meshes.map(m => ({
          name: m.name,
          id: m.id,
          position: m.position.toString(),
          scaling: m.scaling.toString(),
          hasMaterial: !!m.material,
          materialType: m.material ? m.material.getClassName() : 'none',
          hasParent: !!m.parent,
          parentName: m.parent ? m.parent.name : 'none',
          isVisible: m.isVisible
        })));

        if (meshes && meshes.length > 0) {
          // Store the meshes
          treeMeshesRef.current = meshes;

          // Create a parent transform node for all tree meshes
          const treeParent = new BABYLON.TransformNode("giantTreeParent", scene);
          treeParent.position = new BABYLON.Vector3(0, 0, 0); // Position at origin

          // Create a debug box to show where the tree should be
          const debugBox = BABYLON.MeshBuilder.CreateBox("treeDebugBox", {
            width: 10,
            height: 20,
            depth: 10
          }, scene);
          debugBox.position = new BABYLON.Vector3(0, 10, 0); // Position at origin, half height up
          const debugBoxMat = new BABYLON.StandardMaterial("debugBoxMat", scene);
          debugBoxMat.wireframe = true;
          debugBoxMat.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green
          debugBox.material = debugBoxMat;

          // Parent all meshes to the tree parent
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = treeParent;
            }
          });

          // Apply a 600% scale (6x)
          const scale = 6.0;
          treeParent.scaling = new BABYLON.Vector3(scale, scale, scale);

          // Add a debug sphere at the origin of the tree parent
          const debugSphere = BABYLON.MeshBuilder.CreateSphere("treeOriginSphere", { diameter: 1 }, scene);
          debugSphere.position = treeParent.position.clone();
          const sphereMat = new BABYLON.StandardMaterial("sphereMat", scene);
          sphereMat.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
          sphereMat.emissiveColor = new BABYLON.Color3(1, 0, 0); // Make it glow
          debugSphere.material = sphereMat;

          // Create a simple box tree as a fallback
          const trunkBox = BABYLON.MeshBuilder.CreateBox("trunkBox", {
            width: 1,
            height: 4,
            depth: 1
          }, scene);
          trunkBox.position = new BABYLON.Vector3(5, 2, 0); // Position to the right
          const trunkMat = new BABYLON.StandardMaterial("trunkMat", scene);
          trunkMat.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1); // Brown
          trunkBox.material = trunkMat;

          const foliageBox = BABYLON.MeshBuilder.CreateBox("foliageBox", {
            width: 3,
            height: 4,
            depth: 3
          }, scene);
          foliageBox.position = new BABYLON.Vector3(5, 6, 0); // Position above trunk
          const foliageMat = new BABYLON.StandardMaterial("foliageMat", scene);
          foliageMat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); // Green
          foliageBox.material = foliageMat;

          console.log("GiantTree: Applied 600% scale to tree");

          // Ensure all materials are visible
          meshes.forEach(mesh => {
            if (mesh.material) {
              // Make sure the material is not transparent
              const material = mesh.material as BABYLON.StandardMaterial;
              if (material.alpha < 1.0) {
                material.alpha = 1.0;
              }

              // Make sure the material has a diffuse color
              if (material.diffuseColor) {
                // Brighten the diffuse color
                material.diffuseColor = new BABYLON.Color3(
                  Math.min(material.diffuseColor.r + 0.2, 1.0),
                  Math.min(material.diffuseColor.g + 0.2, 1.0),
                  Math.min(material.diffuseColor.b + 0.2, 1.0)
                );
              }

              // Make sure the material has some ambient color
              if (material.ambientColor) {
                material.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
              }

              console.log(`GiantTree: Adjusted material for mesh ${mesh.name}`);
            }
          });

          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log(`GiantTree: Added mesh to shadow casters:`, mesh.name);
            });
          }

          // Remove the reference box after a short delay
          setTimeout(() => {
            refBox.dispose();
          }, 5000);
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("GiantTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("GiantTree: Error loading tree:", message, exception);
      }
    );

    return () => {
      // Cleanup
      if (refBox) refBox.dispose();
      treeMeshesRef.current.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
    };
  }, [scene]);

  return null;
}

export default GiantTree;
