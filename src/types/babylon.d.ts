import { Scene, Vector3, Mesh } from '@babylonjs/core';
import { MathProblem, Avatar } from './game';

export interface SceneProps {
  scene: Scene;
  problemQueue?: MathProblem[];
  onAnswerSelected?: (answer: number | string, correct: boolean) => void;
  selectedAvatar?: Avatar | null;
  resetKey?: string | number;
}

export interface BabylonObject {
  mesh: Mesh;
  position?: Vector3;
  rotation?: Vector3;
  scaling?: Vector3;
  dispose: () => void;
}
