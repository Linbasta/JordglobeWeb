precision highp float;

// Attributes
attribute vec3 position;       // Sphere point
attribute vec4 tangent;        // Pre-scaled bitangent direction (±0.5)
attribute float countryIndex;  // Animation texture index (for segments)

// Uniforms
uniform mat4 worldViewProjection;
uniform sampler2D animationTexture;
uniform float animationTextureWidth;
uniform float animationAmplitude;
uniform float lineThickness;

// Varyings (will be injected)
// VARYINGS_PLACEHOLDER

void main(void) {
    // Read animation value from 1D texture (single row)
    float texCoord = (countryIndex + 0.5) / animationTextureWidth;
    float animValue = texture2D(animationTexture, vec2(texCoord, 0.5)).r;

    // Start with base position
    vec3 pos = position;

    // Additive altitude displacement (same as animated.vertex.glsl)
    vec3 centerDir = normalize(position);
    pos += centerDir * animValue * animationAmplitude;

    // Z-fighting offset (push outward along surface normal)
    pos += centerDir * 0.001;

    // Thickness expansion along bitangent
    pos += tangent.xyz * lineThickness;

    gl_Position = worldViewProjection * vec4(pos, 1.0);

    // VARYING_ASSIGNMENTS_PLACEHOLDER
}
