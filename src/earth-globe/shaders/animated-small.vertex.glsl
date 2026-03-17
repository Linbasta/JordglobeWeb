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
uniform sampler2D expansionTexture;
uniform float expansionTextureWidth;
uniform float animationAmplitude;
uniform float thicknessOffset;

// Varyings (will be injected)
// VARYINGS_PLACEHOLDER

void main(void) {
    // Read animation data from main animation texture
    float texCoord = (countryIndex + 0.5) / animationTextureWidth;
    vec4 animData = texture2D(animationTexture, vec2(texCoord, 0.5));
    float animValue = animData.r;

    // Read expansion from separate expansion texture
    // Texture stores expansion/255, so multiply by 255 to decode
    float expansionCoord = (countryIndex + 0.5) / expansionTextureWidth;
    float expansion = texture2D(expansionTexture, vec2(expansionCoord, 0.5)).r * 255.0;

    // Only expand when elevated above normal altitude (0.2)
    // This ensures small countries render identically to regular countries at rest
    float normalAltitude = 0.2;
    float expansionFactor = animValue > normalAltitude ? expansion : 1.0;

    // Expand vertices outward from country pivot
    vec3 toPivot = position - countryPivot;
    float dist = length(toPivot);
    vec3 expandDir = dist > 0.001 ? toPivot / dist : vec3(0.0);
    vec3 expandedPosition = countryPivot + expandDir * dist * expansionFactor;

    // Apply altitude animation on expanded position
    vec3 centerDir = normalize(expandedPosition);
    float topFactor = uv.y;
    vec3 animatedPosition = expandedPosition + centerDir * animValue * animationAmplitude * topFactor;

    // Scale tube thickness along normal
    animatedPosition += normal * thicknessOffset;

    gl_Position = worldViewProjection * vec4(animatedPosition, 1.0);

    // VARYING_ASSIGNMENTS_PLACEHOLDER
}
