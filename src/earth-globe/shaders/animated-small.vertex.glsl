precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute float countryIndex;
attribute vec3 countryPivot;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 world;
uniform sampler2D animationTexture;
uniform float animationTextureWidth;
uniform float animationAmplitude;
uniform float thicknessOffset;

// Varyings (will be injected)
// VARYINGS_PLACEHOLDER

void main(void) {
    // Read animation data from 1D texture
    float texCoord = (countryIndex + 0.5) / animationTextureWidth;
    vec4 animData = texture2D(animationTexture, vec2(texCoord, 0.5));
    float animValue = animData.r;
    float expansion = animData.a * 4.0;  // decode: stored as expansion/4.0

    // Expand vertices outward from country pivot
    vec3 toPivot = position - countryPivot;
    float dist = length(toPivot);
    vec3 expandDir = dist > 0.001 ? toPivot / dist : vec3(0.0);
    vec3 expandedPosition = countryPivot + expandDir * dist * expansion;

    // Apply altitude animation on expanded position
    vec3 centerDir = normalize(expandedPosition);
    float topFactor = uv.y;
    vec3 animatedPosition = expandedPosition + centerDir * animValue * animationAmplitude * topFactor;

    // Scale tube thickness along normal
    animatedPosition += normal * thicknessOffset;

    gl_Position = worldViewProjection * vec4(animatedPosition, 1.0);

    // VARYING_ASSIGNMENTS_PLACEHOLDER
}
