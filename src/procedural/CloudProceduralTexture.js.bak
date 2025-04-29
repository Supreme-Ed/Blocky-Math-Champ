// src/procedural/CloudProceduralTexture.js
// Local copy of Babylon.js CloudProceduralTexture for project customization
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { ProceduralTexture } from '@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture';

export class CloudProceduralTexture extends ProceduralTexture {
    constructor(name, size, scene = null, fallbackTexture, generateMipMaps) {
        super(name, size, 'cloudProceduralTexture', scene, fallbackTexture, generateMipMaps);
        this._skyColor = new Color4(0.15, 0.68, 1.0, 1.0);
        this._cloudColor = new Color4(1, 1, 1, 1.0);
        this._amplitude = 1;
        this._numOctaves = 4;
        this.updateShaderUniforms();
    }

    updateShaderUniforms() {
        this.setColor4('skyColor', this._skyColor);
        this.setColor4('cloudColor', this._cloudColor);
        this.setFloat('amplitude', this._amplitude);
        this.setInt('numOctaves', this._numOctaves);
    }

    get skyColor() {
        return this._skyColor;
    }
    set skyColor(value) {
        this._skyColor = value;
        this.updateShaderUniforms();
    }

    get cloudColor() {
        return this._cloudColor;
    }
    set cloudColor(value) {
        this._cloudColor = value;
        this.updateShaderUniforms();
    }

    get amplitude() {
        return this._amplitude;
    }
    set amplitude(value) {
        this._amplitude = value;
        this.updateShaderUniforms();
    }

    get numOctaves() {
        return this._numOctaves;
    }
    set numOctaves(value) {
        this._numOctaves = value;
        this.updateShaderUniforms();
    }

    serialize() {
        // You may want to add custom serialization logic here
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
