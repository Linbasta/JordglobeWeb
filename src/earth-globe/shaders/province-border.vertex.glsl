precision highp float;

// Attributes
attribute vec3 position;       // Sphere point
attribute vec4 tangent;        // Pre-scaled bitangent direction (±0.5)

// Uniforms
uniform mat4 worldViewProjection;
uniform float altitudeOffset;  // Fixed altitude (e.g., COUNTRY_ALTITUDE)
uniform float lineThickness;   // Zoom-interpolated thickness

void main(void) {
    // position is already placed at the right altitude by the CPU
    // (latLonToSphere with full altitude including animation headroom).
    // We just need a small extra push to clear z-fighting with country surfaces.
    vec3 pos = position;
    vec3 centerDir = normalize(position);

    // Extra outward push to sit clearly above country surface
    pos += centerDir * altitudeOffset;

    // Thickness expansion along bitangent
    pos += tangent.xyz * lineThickness;

    gl_Position = worldViewProjection * vec4(pos, 1.0);
}
