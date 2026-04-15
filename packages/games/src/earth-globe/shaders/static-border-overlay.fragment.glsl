precision highp float;

// Uniforms
uniform vec4 borderColor;
uniform float lineAlpha;

void main(void) {
    gl_FragColor = vec4(borderColor.rgb, borderColor.a * lineAlpha);
}
