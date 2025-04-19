#define CUSTOM_VERTEX_DEFINITIONS
precision highp float;
in vec2 position;
out vec2 vPosition;
out vec2 vUV;
const vec2 madd = vec2(0.5, 0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
void main(void) {
    vPosition = position;
    vUV = position * madd + madd;
    gl_Position = vec4(position, 0.0, 1.0);
}
#define CUSTOM_VERTEX_MAIN_END
