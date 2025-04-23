#define CUSTOM_FRAGMENT_DEFINITIONS
precision highp float;
in vec2 vUV;
uniform vec3 cloudColor;
#define CUSTOM_FRAGMENT_MAIN_BEGIN
void main(void) {
    float x = vUV.x * 10.0;
    float y = vUV.y * 10.0;
    float cloud = smoothstep(0.4, 0.6, sin(x) * cos(y));
    vec3 color = mix(cloudColor, vec3(1.0), cloud);
    gl_FragColor = vec4(color, 1.0);
}
#define CUSTOM_FRAGMENT_MAIN_END
