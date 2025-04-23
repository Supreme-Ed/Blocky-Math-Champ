#define CUSTOM_FRAGMENT_DEFINITIONS
precision highp float;
in vec2 vUV;
uniform float numberOfTilesHeight;
uniform float numberOfTilesWidth;
uniform float amplitude;
uniform vec3 jointColor;
#define CUSTOM_FRAGMENT_MAIN_BEGIN
void main(void) {
    float x = vUV.x * numberOfTilesWidth;
    float y = vUV.y * numberOfTilesHeight;
    float noise = sin(x * 10.0 + y * 10.0) * amplitude;
    float marble = mod(x + y + noise, 1.0);
    vec3 color = mix(vec3(1.0), jointColor, marble);
    gl_FragColor = vec4(color, 1.0);
}
#define CUSTOM_FRAGMENT_MAIN_END
