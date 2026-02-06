/**
 * Earth Globe Module - Shader Factory
 *
 * Creates and manages shader materials for the globe rendering.
 */

import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Color3, Color4 } from '@babylonjs/core/Maths/math';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Material } from '@babylonjs/core/Materials/material';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

import {
    ANIMATION_AMPLITUDE,
    ANIMATION_TEXTURE_WIDTH,
    COUNTRY_HSV_SATURATION,
    COUNTRY_HSV_VALUE,
    BORDER_COLOR_WHITE,
    BORDER_COLOR_GRAY,
    OUTLINE_COLOR
} from './constants';

// Import shaders
import animatedVertexShader from './shaders/animated.vertex.glsl?raw';
import borderFragmentShader from './shaders/border.fragment.glsl?raw';
import countryFragmentShader from './shaders/country.fragment.glsl?raw';
import unlitVertexShader from './shaders/unlit.vertex.glsl?raw';
import unlitFragmentShader from './shaders/unlit.fragment.glsl?raw';

/**
 * Shader Factory - Creates shader materials for globe rendering
 */
export class ShaderFactory {
    private scene: Scene;
    private engine: AbstractEngine;
    private animationTexture: DynamicTexture | null = null;
    private shaderCounter: number = 0;

    constructor(scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();
    }

    /**
     * Set the animation texture used by shaders
     */
    setAnimationTexture(texture: DynamicTexture): void {
        this.animationTexture = texture;
    }

    /**
     * Create a shader material with the animated vertex shader
     * @param name Material name
     * @param fragmentShader Fragment shader source
     * @param uniforms Additional uniforms
     * @param varyings Varying declarations to inject
     * @param varyingAssignments Varying assignments to inject
     * @returns Configured ShaderMaterial
     */
    createShaderMaterial(
        name: string,
        fragmentShader: string,
        uniforms: string[],
        varyings: string = "",
        varyingAssignments: string = ""
    ): ShaderMaterial {
        // Setup vertex shader with injected varyings
        const vertexShader = animatedVertexShader
            .replace('// VARYINGS_PLACEHOLDER', varyings)
            .replace('// VARYING_ASSIGNMENTS_PLACEHOLDER', varyingAssignments);

        Effect.ShadersStore[`${name}VertexShader`] = vertexShader;
        Effect.ShadersStore[`${name}FragmentShader`] = fragmentShader;

        // Create shader material
        const shaderMaterial = new ShaderMaterial(name, this.scene, {
            vertex: name,
            fragment: name,
        }, {
            attributes: ["position", "normal", "uv", "countryIndex"],
            uniforms: ["worldViewProjection", "world", "animationTextureWidth", "animationAmplitude", ...uniforms],
            samplers: ["animationTexture"]
        });

        // Setup compilation callbacks
        shaderMaterial.onCompiled = () => console.log(`Shader ${name} compiled successfully`);
        shaderMaterial.onError = (effect, errors) => {
            console.error(`Shader compilation error in ${name}:`, errors);
        };

        // Set common uniforms
        if (this.animationTexture) {
            shaderMaterial.setTexture("animationTexture", this.animationTexture);
        }
        shaderMaterial.setFloat("animationTextureWidth", ANIMATION_TEXTURE_WIDTH);
        shaderMaterial.setFloat("animationAmplitude", ANIMATION_AMPLITUDE);
        shaderMaterial.backFaceCulling = false;

        return shaderMaterial;
    }

    /**
     * Create the country surface shader material
     * @returns Configured ShaderMaterial for countries
     */
    createCountryShaderMaterial(): ShaderMaterial {
        const material = this.createShaderMaterial(
            "countryShader",
            countryFragmentShader,
            ["countryHsvSaturation", "countryHsvValue"],
            "varying float vCountryIndex;",
            "vCountryIndex = countryIndex;"
        );
        material.setFloat("countryHsvSaturation", COUNTRY_HSV_SATURATION);
        material.setFloat("countryHsvValue", COUNTRY_HSV_VALUE);
        return material;
    }

    /**
     * Create a border shader material
     * @param name Material name
     * @param baseColor Border color
     * @returns Configured ShaderMaterial for borders
     */
    createBorderShaderMaterial(name: string, baseColor: Color3): ShaderMaterial {
        const material = this.createShaderMaterial(name, borderFragmentShader, ["baseColor"]);
        material.setColor3("baseColor", baseColor);
        return material;
    }

    /**
     * Create the extruded border shader material (gray)
     */
    createExtrudedBorderMaterial(): ShaderMaterial {
        return this.createBorderShaderMaterial("extrudedBorderShader", BORDER_COLOR_GRAY);
    }

    /**
     * Create the segment border shader material (white)
     */
    createSegmentBorderMaterial(): ShaderMaterial {
        return this.createBorderShaderMaterial("segmentBorderShader", BORDER_COLOR_WHITE);
    }

    /**
     * Create the outline shader material (gold)
     */
    createOutlineMaterial(): ShaderMaterial {
        return this.createBorderShaderMaterial("outlineShader", OUTLINE_COLOR);
    }

    /**
     * Create an unlit material (for pins and other objects)
     * @param originalMaterial Original material to extract color/texture from
     * @returns Configured unlit ShaderMaterial
     */
    createUnlitMaterial(originalMaterial: Material | null): ShaderMaterial {
        const materialName = `unlitMaterial_${this.shaderCounter++}`;

        Effect.ShadersStore[`${materialName}VertexShader`] = unlitVertexShader;
        Effect.ShadersStore[`${materialName}FragmentShader`] = unlitFragmentShader;

        const shaderMaterial = new ShaderMaterial(materialName, this.scene, {
            vertex: materialName,
            fragment: materialName,
        }, {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "baseColor", "hasTexture"],
            samplers: ["baseColorTexture"]
        });

        // Try to extract color from original material
        let baseColor = new Color4(1, 1, 1, 1);
        let hasTexture = false;

        if (originalMaterial) {
            // Try to get base color from PBR material
            const pbrMat = originalMaterial as any;
            if (pbrMat.albedoColor) {
                const c = pbrMat.albedoColor;
                baseColor = new Color4(c.r, c.g, c.b, 1.0);
            } else if (pbrMat.diffuseColor) {
                const c = pbrMat.diffuseColor;
                baseColor = new Color4(c.r, c.g, c.b, 1.0);
            }

            // Check for textures
            if (pbrMat.albedoTexture) {
                shaderMaterial.setTexture("baseColorTexture", pbrMat.albedoTexture);
                hasTexture = true;
            } else if (pbrMat.diffuseTexture) {
                shaderMaterial.setTexture("baseColorTexture", pbrMat.diffuseTexture);
                hasTexture = true;
            }
        }

        shaderMaterial.setColor4("baseColor", baseColor);
        shaderMaterial.setFloat("hasTexture", hasTexture ? 1.0 : 0.0);
        shaderMaterial.backFaceCulling = false;

        return shaderMaterial;
    }

    /**
     * Update all materials with a new animation texture
     * @param texture New animation texture
     */
    updateAnimationTexture(texture: DynamicTexture): void {
        this.animationTexture = texture;
        // Materials need to be updated individually by their owners
    }
}
