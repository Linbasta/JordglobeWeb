precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute float countryIndex;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform sampler2D animationTexture;
uniform float animationTextureWidth;
uniform float animationAmplitude;
uniform float altitudeScale;
uniform float thicknessOffset;

// Varyings (will be injected)
// VARYINGS_PLACEHOLDER

void main(void) {
    // Read animation value from 1D texture (single row)
    // Texture stores scaled-down value, multiply by altitudeScale to get actual altitude
    float texCoord = (countryIndex + 0.5) / animationTextureWidth;
    float animValue = texture2D(animationTexture, vec2(texCoord, 0.5)).r * altitudeScale;

    // Apply animation - ALWAYS full animation for dashed tubes
    // (unlike normal borders where uv.y controls animation participation)
    vec3 animatedPosition = position;
    vec3 centerDir = normalize(position);
    animatedPosition += centerDir * animValue * animationAmplitude;

    // Scale tube thickness along tube's radial direction
    animatedPosition += normal * thicknessOffset;

    gl_Position = worldViewProjection * vec4(animatedPosition, 1.0);

    // VARYING_ASSIGNMENTS_PLACEHOLDER
}
