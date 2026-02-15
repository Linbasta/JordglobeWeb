precision highp float;

// Attributes
attribute vec3 position;       // Sphere point
attribute vec4 tangent;        // Pre-scaled bitangent direction (±0.5)

// Uniforms
uniform mat4 worldViewProjection;
uniform float altitudeOffset;  // Fixed altitude (e.g., COUNTRY_ALTITUDE)
uniform float lineThickness;   // Zoom-interpolated thickness

void main(void) {
    // Start with base position
    vec3 pos = position;

    // Additive altitude offset (static, no animation)
    vec3 centerDir = normalize(position);
    pos += centerDir * altitudeOffset;

    // Z-fighting offset (push outward along surface normal)
    pos += centerDir * 0.001;

    // Thickness expansion along bitangent
    pos += tangent.xyz * lineThickness;

    gl_Position = worldViewProjection * vec4(pos, 1.0);
}
