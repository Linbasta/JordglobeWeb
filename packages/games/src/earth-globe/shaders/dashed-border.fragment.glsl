precision highp float;

// Uniforms
uniform vec3 baseColor;
uniform float dashLength;
uniform float gapLength;
uniform float alpha;

// Varyings
varying vec2 vUV;

void main(void) {
    // Babylon's CreateTube: UV.x = circumference (0-1 around tube), UV.y = path (0-1 along tube)
    // Use UV.y (along path) for dash pattern
    float patternLength = dashLength + gapLength;
    float position = mod(vUV.y, patternLength);

    // Discard fragments in the gap
    if (position > dashLength) {
        discard;
    }

    gl_FragColor = vec4(baseColor, alpha);
}
