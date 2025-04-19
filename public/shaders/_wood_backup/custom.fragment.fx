#define CUSTOM_FRAGMENT_DEFINITIONS
precision highp float;
in vec2 vUV;
uniform vec3 woodColor;
#define CUSTOM_FRAGMENT_MAIN_BEGIN
void main(void) {
    float x = vUV.x * 10.0;
    float y = vUV.y * 10.0;
    float rings = sin(x * x + y * y);
    vec3 color = mix(woodColor, vec3(0.2, 0.1, 0.05), rings);
    gl_FragColor = vec4(color, 1.0);
}
#define CUSTOM_FRAGMENT_MAIN_END
