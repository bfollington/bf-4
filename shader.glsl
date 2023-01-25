precision mediump float;
varying vec2 a_pos;
uniform float iTime;
uniform vec2 iGyro;
uniform vec2 iMouse;
uniform vec2 iResolution;
uniform float iAlpha;
uniform float iBeta;
uniform float iGamma;


// Fork of "magic curtain 3" by vivavolt. https://shadertoy.com/view/dslXzf
// 2022-11-25 04:51:03

#define alpha iAlpha
#define beta iBeta
#define gamma iGamma

#define t (iTime / 5. + 5.)

mat2 move(in float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, -c);
}

float temper(float x) {
    return 0.5 + (x - 0.5) / 2.;
}

float map(in vec3 st) {
    st.xy *= move(t * (0.2 + 0.2 * alpha));
    st.xz *= move(t * (0.2 + 0.2 * beta));
    vec3 p = st * (.2*sin(t / 10. * alpha) + 8. + 3.*beta) * 2.0 + t;
    return length(st + vec3(sin(cos(t * 0.5 * gamma)))) + sin(p.x + sin(cos(p.y)* temper(iMouse.x) + cos(p.z)*gamma* temper(iMouse.y))) * 0.5 - 2.0;
}

float vignette(vec2 uv) {
    uv *=  1.0 - uv.yx;   //vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks FabriceNeyret !
    
    float vig = uv.x*uv.y * 15.0; // multiply with sth for intensity
    
    vig = pow(vig, 0.25); // change pow for modifying the extend of the  vignette
    return vig;
}

vec3 pixel(vec2 p) {
    vec2 st = p / iResolution.xy - vec2(1.0, 0.5);

    vec3 col = vec3(beta, gamma, alpha);
    float dist = 2.5;

    for (int i = 0; i <= 3; i++) {
        vec3 st = vec3(0.0, 0.0, beta) + normalize(vec3(st, -1.0)) * dist;
        float rz = map(st);
        float f = clamp((rz - map(st + 0.1)) * 0.5, -0.5, 1.0);
        vec3 l = vec3(gamma*alpha, alpha*beta, beta*gamma) + vec3(2.+2.*sin(iTime), 2.5, 2.5) * f;
        col = col * l + smoothstep(5.0, 2.0, rz) * 0.4 * l;
        dist += min(rz, t);
    }
    
    return col;
}

vec3 blur9(vec2 p, vec2 resolution, vec2 direction) {
  vec3 color = vec3(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += pixel(p) * 0.2270270270;
  color += pixel(p + (off1 / resolution)) * 0.3162162162;
  color += pixel(p - (off1 / resolution)) * 0.3162162162;
  color += pixel(p + (off2 / resolution)) * 0.0702702703;
  color += pixel(p - (off2 / resolution)) * 0.0702702703;
  return color;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {    
    vec3 col = blur9(fragCoord.xy - iMouse.xy * 32. - iGyro.xy * 32., iResolution.xy, vec2(255., 255.));
    fragColor = vec4(col,1.0);
    
    vec2 uv = .5*(fragCoord.xy / iResolution.xy) + 0.5;
    float vig = vignette(uv);
    
    vec3 mixed = col.xyz;
    fragColor = vec4(mixed, 1.0);
    fragColor = mix(fragColor, vec4(vec3(0.), 1.), 1.-vig);
}

void main(void) {
    mainImage(gl_FragColor, a_pos * iResolution.xy);
    //gl_FragColor = vec4(a_pos.x, a_pos.y, 0, 1.0); 
}