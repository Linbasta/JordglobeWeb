/**
 * Earth Globe Module - Globe Sphere
 *
 * Creates and manages the earth sphere with water shader.
 */

import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import { EARTH_RADIUS, SPHERE_SEGMENTS, DEFAULT_ASSETS } from './constants';
import type { AssetPaths } from './types';

/**
 * Create the water shader for the ocean
 */
function createWaterShader(scene: Scene): string {
    const shaderName = "waterShader";

    // Vertex Shader with wave displacement
    const vertexShader = `
        precision highp float;

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;

        uniform mat4 worldViewProjection;
        uniform mat4 world;
        uniform float time;
        uniform float waveHeight;
        uniform float waveScale;
        uniform float waveSpeed;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUV;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            vUV = vec2(1.0 - uv.x + 0.5, 1.0 - uv.y);

            vec2 waveUV = uv * waveScale;
            float wave1 = noise(waveUV + time * waveSpeed);
            float wave2 = noise(waveUV * 1.7 - time * waveSpeed * 0.8);
            float waveDisplacement = (wave1 + wave2 * 0.5) * waveHeight;

            vec3 displacedPosition = position + normal * waveDisplacement;

            vNormal = normalize((world * vec4(normal, 0.0)).xyz);
            vWorldPosition = (world * vec4(displacedPosition, 1.0)).xyz;
            vPosition = displacedPosition;

            gl_Position = worldViewProjection * vec4(displacedPosition, 1.0);
        }
    `;

    // Fragment Shader
    const fragmentShader = `
        precision highp float;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUV;
        varying vec3 vWorldPosition;

        uniform float time;
        uniform vec3 cameraPosition;
        uniform sampler2D depthMap;
        uniform sampler2D causticsMap;

        uniform vec3 shallowColor;
        uniform vec3 waterColor;
        uniform vec3 deepColor;
        uniform vec3 causticColor;

        uniform float causticScale;
        uniform float causticStrength;
        uniform float causticSpeed;
        uniform float causticDeform;
        uniform float causticDeformScale;

        uniform vec3 foamColor;
        uniform float foamWidth;
        uniform float foamStrength;
        uniform float foamNoiseScale;
        uniform float foamNoiseSpeed;
        uniform float foamNoiseStrength;
        uniform float foamRippleWidth;
        uniform float foamCoast;
        uniform float foamNRipples;
        uniform float foamUvStrength;

        uniform float waveUVDistortion;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            for(int i = 0; i < 4; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        float caustics(vec2 uv, float t, float depthMask) {
            float uvProduct = uv.x * uv.y;
            float animatedOffset = sin(t * causticSpeed + causticDeformScale * uvProduct) * causticDeform;
            vec2 causticUV = uv * causticScale + vec2(animatedOffset);
            vec4 causticSample = texture2D(causticsMap, causticUV);
            return causticSample.r * depthMask * causticStrength;
        }

        float RipplePass(float t, float depth, float nRipples, float rippleStrength, float rippleW) {
            float rippleDist = 1.0 / nRipples;
            rippleStrength *= (1.0 - depth);
            for (int i = 0; i < 8; i++) {
                if (float(i) >= nRipples) break;
                float e1 = fract(t + rippleDist * float(i));
                float e2 = fract(e1 + rippleW);
                if ((depth > e1) && (depth < e2)) {
                    float peak = (e1 + e2) / 2.0;
                    float strength = (rippleW / 4.0) - abs(depth - peak);
                    return strength * rippleStrength;
                }
            }
            return 0.0;
        }

        float foam(vec2 uv, float t, float depth) {
            vec2 noiseUV1 = uv * vec2(2.05, 1.0) + vec2(t * 0.0001);
            float noise1 = fbm(noiseUV1 * foamNoiseScale);
            vec2 noiseUV2 = uv - vec2(t * 0.0001);
            float noise2 = fbm(noiseUV2 * foamNoiseScale);
            float noiseVal = noise1 * noise2;

            float nRipples = round(foamNRipples);
            float rippleTime = t;
            rippleTime += foamUvStrength * uv.x * uv.y;
            rippleTime = rippleTime * foamNoiseSpeed;
            noiseVal += RipplePass(rippleTime, depth, nRipples, foamStrength, foamRippleWidth);

            bool noisePass = noiseVal > (depth - 0.1);
            bool upperPass = depth < foamWidth;

            float foamVal = 0.0;
            if (noisePass && upperPass) foamVal = 1.0;
            if (depth < foamCoast) foamVal = 1.0;

            return foamVal;
        }

        void main() {
            vec2 depthUV = vUV;
            vec2 uvDistortion = vec2(
                noise(vUV * 10.0 + time * 0.1),
                noise(vUV * 10.0 - time * 0.1)
            ) * waveUVDistortion;
            depthUV += uvDistortion;

            vec4 depthSample = texture2D(depthMap, depthUV);
            float depthR = depthSample.r;
            float depthA = depthSample.a;

            vec3 color1 = mix(shallowColor, waterColor, depthR);
            vec3 baseColor = mix(deepColor, color1, depthA);
            vec3 finalColor = baseColor;

            float depthMask = 1.0 - depthR;
            float causticsValue = caustics(vUV, time, depthMask);
            finalColor = mix(finalColor, causticColor, causticsValue);

            float foamValue = foam(vUV, time, depthR);
            finalColor = mix(finalColor, foamColor, foamValue);

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    Effect.ShadersStore[shaderName + "VertexShader"] = vertexShader;
    Effect.ShadersStore[shaderName + "FragmentShader"] = fragmentShader;

    return shaderName;
}

/**
 * Create water shader material with all uniforms configured
 */
function createWaterMaterial(
    scene: Scene,
    assets: AssetPaths,
    name: string = "waterMaterial"
): ShaderMaterial {
    const shaderName = createWaterShader(scene);

    const material = new ShaderMaterial(name, scene, shaderName, {
        attributes: ["position", "normal", "uv"],
        uniforms: [
            "worldViewProjection", "world", "time", "cameraPosition",
            "shallowColor", "waterColor", "deepColor", "causticColor",
            "causticScale", "causticStrength", "causticSpeed", "causticDeform", "causticDeformScale",
            "foamColor", "foamWidth", "foamStrength", "foamNoiseScale", "foamNoiseSpeed",
            "foamNoiseStrength", "foamRippleWidth", "foamCoast", "foamNRipples", "foamUvStrength",
            "waveHeight", "waveScale", "waveSpeed", "waveUVDistortion"
        ],
        samplers: ["depthMap", "causticsMap"]
    });

    // Load textures (WRAP so UV range 0.5..1.5 wraps correctly without fract seam)
    const depthTexture = new Texture(assets.oceanDepthMap || DEFAULT_ASSETS.oceanDepthMap, scene);
    depthTexture.wrapU = Texture.WRAP_ADDRESSMODE;
    depthTexture.wrapV = Texture.WRAP_ADDRESSMODE;
    material.setTexture("depthMap", depthTexture);

    const causticsTexture = new Texture(assets.causticsTexture || DEFAULT_ASSETS.causticsTexture, scene);
    causticsTexture.wrapU = Texture.WRAP_ADDRESSMODE;
    causticsTexture.wrapV = Texture.WRAP_ADDRESSMODE;
    material.setTexture("causticsMap", causticsTexture);

    // Water colors
    material.setVector3("shallowColor", new Vector3(0.4, 0.8, 0.95));
    material.setVector3("waterColor", new Vector3(0.15, 0.63, 0.95));
    material.setVector3("deepColor", new Vector3(0.02, 0.08, 0.25));
    material.setVector3("causticColor", new Vector3(1.0, 1.0, 1.0));

    // Caustics
    material.setFloat("causticScale", 200.0);
    material.setFloat("causticStrength", 0.6);
    material.setFloat("causticSpeed", 0.38);
    material.setFloat("causticDeform", 131.0);
    material.setFloat("causticDeformScale", 0.08);

    // Foam
    material.setVector3("foamColor", new Vector3(0.7, 0.95, 1.0));
    material.setFloat("foamWidth", 0.99);
    material.setFloat("foamStrength", 40.0);
    material.setFloat("foamNoiseScale", 500.0);
    material.setFloat("foamNoiseSpeed", 0.03);
    material.setFloat("foamNoiseStrength", 0.1);
    material.setFloat("foamRippleWidth", 0.2);
    material.setFloat("foamCoast", 0.39);
    material.setFloat("foamNRipples", 3.0);
    material.setFloat("foamUvStrength", 0.0);

    // Waves
    material.setFloat("waveHeight", 0.0);
    material.setFloat("waveScale", 9.0);
    material.setFloat("waveSpeed", 0.001);
    material.setFloat("waveUVDistortion", 0.001);

    // Animation
    let time = 0;
    scene.registerBeforeRender(() => {
        time += scene.getEngine().getDeltaTime() / 1000;
        material.setFloat("time", time);
        if (scene.activeCamera) {
            material.setVector3("cameraPosition", scene.activeCamera.position);
        }
    });

    return material;
}

/**
 * Globe Sphere - Earth sphere with water shader
 */
export class GlobeSphere {
    private scene: Scene;
    private mesh: Mesh;
    private waterMaterial: ShaderMaterial;

    constructor(scene: Scene, assets: AssetPaths = {}) {
        this.scene = scene;

        // Create sphere
        this.mesh = MeshBuilder.CreateSphere(
            "earth",
            { diameter: EARTH_RADIUS * 2, segments: SPHERE_SEGMENTS },
            scene
        );

        // Apply water shader
        this.waterMaterial = createWaterMaterial(scene, assets, "earthWaterMaterial");
        this.mesh.material = this.waterMaterial;
    }

    /**
     * Get the sphere mesh
     */
    getMesh(): Mesh {
        return this.mesh;
    }

    /**
     * Get the water material for parameter adjustments
     */
    getWaterMaterial(): ShaderMaterial {
        return this.waterMaterial;
    }

    /**
     * Dispose of the globe sphere
     */
    dispose(): void {
        this.mesh.dispose();
        this.waterMaterial.dispose();
    }
}
