#version 450
#ifdef ARRAY_VIEW
layout(binding=0) uniform sampler2DArray source;
#else
layout(binding=0) uniform sampler2D source;
#endif
layout(push_constant) uniform Shape { int mips; } shape;
layout(location=0) out vec4 color;
int coord(int i, int n) {
    return i == 0 ? 0 : i == 1 ? n / 3 : i == 2 ? n / 2 + 1 : n - 1;
}
void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    int region = pixel.y / 4, mip = region % shape.mips;
    ivec2 extent = textureSize(source, mip).xy;
    vec2 uv = (vec2(coord(pixel.x, extent.x), coord(pixel.y % 4, extent.y)) + 0.5) / vec2(extent);
#ifdef ARRAY_VIEW
    color = textureLod(source, vec3(uv, region / shape.mips), float(mip));
#else
    color = textureLod(source, uv, float(mip));
#endif
}
