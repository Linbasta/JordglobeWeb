precision highp float;

// Varying
varying float vCountryIndex;

// Uniforms
uniform sampler2D animationTexture;
uniform float animationTextureWidth;
uniform float countryHsvSaturation;  // Global saturation (unused, kept for compatibility)
uniform float countryHsvValue;

// State thresholds (G channel encoding)
const float STATE_NORMAL = 0.0;
const float STATE_DISABLED = 0.25;
const float STATE_CLEARED = 0.50;

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main(void) {
    // Read animation texture (R=altitude, G=state, B=blend)
    float texCoord = (vCountryIndex + 0.5) / animationTextureWidth;
    vec4 animData = texture2D(animationTexture, vec2(texCoord, 0.5));
    float state = animData.g;
    float blend = animData.b;

    // Create unique color per country using HSV (normal appearance)
    float hue = fract(vCountryIndex / 360.0);
    vec3 normalColor = hsv2rgb(vec3(hue, 1.0, countryHsvValue));

    // Calculate desaturated color (70% grayscale)
    float luminance = dot(normalColor, vec3(0.299, 0.587, 0.114));
    vec3 desaturated = mix(normalColor, vec3(luminance), 0.7);

    // Apply tint based on state
    // STATE_DISABLED (0.25): gray tint (darker)
    // STATE_CLEARED (0.50): white tint (brighter)
    vec3 tint = vec3(1.0);
    if (state > 0.125 && state < 0.375) {
        // Disabled state: darker gray
        tint = vec3(0.5);
    } else if (state >= 0.375) {
        // Cleared state: white tint
        tint = vec3(1.0);
    }
    vec3 stateColor = desaturated * tint;

    // Blend between state color and normal color
    // blend = 0.0 -> full state effect
    // blend = 1.0 -> normal appearance
    vec3 finalColor = mix(stateColor, normalColor, blend);

    gl_FragColor = vec4(finalColor, 1.0);
}
