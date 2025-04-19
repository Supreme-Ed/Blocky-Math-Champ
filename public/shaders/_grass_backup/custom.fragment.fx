#define CUSTOM_FRAGMENT_DEFINITIONS
precision highp float;
uniform vec3 herb1Color;
uniform vec3 herb2Color;
uniform vec3 herb3Color;
uniform vec3 groundColor;
in vec2 vUV;
#define CUSTOM_FRAGMENT_MAIN_BEGIN
void main(void) {
    vec3 color = groundColor;
    float noise = fract(sin(dot(vUV, vec2(12.9898,78.233))) * 43758.5453);
    if (noise < 0.33) {
        color = herb1Color;
    } else if (noise < 0.66) {
        color = herb2Color;
    } else {
        color = herb3Color;
    }
    gl_FragColor = vec4(color, 1.0);
}
#define CUSTOM_FRAGMENT_MAIN_END
