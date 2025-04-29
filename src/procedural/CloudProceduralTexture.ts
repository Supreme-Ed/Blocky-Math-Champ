// src/procedural/CloudProceduralTexture.ts
// Local copy of Babylon.js CloudProceduralTexture for project customization
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ProceduralTexture } from '@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture';
import { Scene } from '@babylonjs/core/scene';
import { Nullable } from '@babylonjs/core/types';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';

/**
 * Procedural texture for generating animated cloud patterns
 * This is a customized version of Babylon.js CloudProceduralTexture
 */
export class CloudProceduralTexture extends ProceduralTexture {
    private _skyColor: Color4;
    private _cloudColor: Color4;
    private _amplitude: number;
    private _numOctaves: number;
    
    /**
     * Creates a new CloudProceduralTexture
     * @param name - Name of the texture
     * @param size - Size of the texture in pixels
     * @param scene - Babylon.js scene
     * @param fallbackTexture - Optional fallback texture
     * @param generateMipMaps - Whether to generate mipmaps
     */
    constructor(
        name: string, 
        size: number, 
        scene: Nullable<Scene> = null, 
        fallbackTexture?: Nullable<BaseTexture>, 
        generateMipMaps?: boolean
    ) {
        super(name, size, 'cloudProceduralTexture', scene, fallbackTexture, generateMipMaps);
        this._skyColor = new Color4(0.15, 0.68, 1.0, 1.0);
        this._cloudColor = new Color4(1, 1, 1, 1.0);
        this._amplitude = 1;
        this._numOctaves = 4;
        this.updateShaderUniforms();
    }

    /**
     * Updates the shader uniforms with the current property values
     */
    updateShaderUniforms(): void {
        this.setColor4('skyColor', this._skyColor);
        this.setColor4('cloudColor', this._cloudColor);
        this.setFloat('amplitude', this._amplitude);
        this.setInt('numOctaves', this._numOctaves);
    }

    /**
     * Gets the sky color
     */
    get skyColor(): Color4 {
        return this._skyColor;
    }
    
    /**
     * Sets the sky color
     */
    set skyColor(value: Color4) {
        this._skyColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Gets the cloud color
     */
    get cloudColor(): Color4 {
        return this._cloudColor;
    }
    
    /**
     * Sets the cloud color
     */
    set cloudColor(value: Color4) {
        this._cloudColor = value;
        this.updateShaderUniforms();
    }

    /**
     * Gets the amplitude
     */
    get amplitude(): number {
        return this._amplitude;
    }
    
    /**
     * Sets the amplitude
     */
    set amplitude(value: number) {
        this._amplitude = value;
        this.updateShaderUniforms();
    }

    /**
     * Gets the number of octaves
     */
    get numOctaves(): number {
        return this._numOctaves;
    }
    
    /**
     * Sets the number of octaves
     */
    set numOctaves(value: number) {
        this._numOctaves = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes the texture to a plain object
     * @returns Serialized texture data
     */
    serialize(): any {
        return {
            name: this.name,
            size: this.getSize().width,
            skyColor: this._skyColor,
            cloudColor: this._cloudColor,
            amplitude: this._amplitude,
            numOctaves: this._numOctaves
        };
    }
}
