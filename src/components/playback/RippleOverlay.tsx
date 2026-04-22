"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

/**
 * RippleOverlay — a tiny WebGL canvas that renders a one-shot water-drop
 * style ripple over the current media. A ring of radial displacement
 * expands from the center outward, attenuating before it reaches the
 * screen edges so it never overlaps the border glow.
 *
 * The caller passes the currently-visible <img> or <video> element as
 * the texture source via the imperative `trigger()` handle. Web
 * (iframe) items are ignored silently.
 */
export interface RippleOverlayHandle {
  trigger: (source: HTMLImageElement | HTMLVideoElement | null) => void;
}

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  // Flip Y so the texture reads top-down.
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform sampler2D u_tex;
uniform float u_progress;   // 0..1 over the ripple duration
uniform vec2  u_res;        // canvas pixel dimensions
uniform vec2  u_texSize;    // source media pixel dimensions
varying vec2  v_uv;

// Apply DOM-equivalent object-fit: cover UV transform, then sample.
// Centralised so we can do multi-tap blur around the same point.
vec4 sampleCover(vec2 uv) {
  float viewAspect = u_res.x / u_res.y;
  float texAspect  = u_texSize.x / u_texSize.y;
  vec2 scale;
  if (texAspect > viewAspect) {
    scale = vec2(viewAspect / texAspect, 1.0);
  } else {
    scale = vec2(1.0, texAspect / viewAspect);
  }
  vec2 coverUv = (uv - 0.5) * scale + 0.5;
  coverUv = clamp(coverUv, vec2(0.0), vec2(1.0));
  return texture2D(u_tex, coverUv);
}

void main() {
  // Ripple originates from the bottom-center of the screen and
  // expands upward/outward like a wave front. Distance is
  // aspect-corrected so the arc is a true circle on any viewport.
  vec2 uv = v_uv;
  vec2 center = vec2(0.5, 1.0);
  vec2 fromCenter = uv - center;
  vec2 aspect = vec2(u_res.x / u_res.y, 1.0);
  vec2 polar = fromCenter * aspect;
  float dist = length(polar);

  // Ring grows from 0 up past the top of the screen. maxRadius is
  // tuned so the wavefront climbs most of the way up without actually
  // reaching the top edge (edgeGuard below then smoothly zeroes it).
  float maxRadius = 0.95;
  float ringRadius = u_progress * maxRadius;
  float ringWidth  = 0.10;

  // Sinusoidal wavefront centered on the expanding ring.
  float band = (dist - ringRadius) / ringWidth;
  float wave = sin(band * 3.14159);

  // Gaussian envelope keeps displacement confined to a thin band.
  float envelope = exp(-band * band);

  // Bell over time so the ripple energy rises then fades.
  float timeBell = sin(u_progress * 3.14159);

  // Taper amplitude to zero before the wavefront reaches the top
  // edge / corners so it can't compete with the border glow.
  float edgeGuard = 1.0 - smoothstep(0.80, 1.05, dist);

  // Radial displacement magnitude. Punchy but still tapered near the
  // screen edges.
  float amp = 0.045 * wave * envelope * timeBell * edgeGuard;

  vec2 dir = fromCenter / max(dist, 1e-6);
  vec2 distortedUv = uv + dir * amp;
  distortedUv = clamp(distortedUv, vec2(0.0), vec2(1.0));

  vec4 sharp = sampleCover(distortedUv);

  // --- Liquid-glass pass --------------------------------------------
  // Within the ripple band the content reads as looked-at through
  // frosted glass: we do a cheap 2-ring Poisson-style blur around the
  // displaced sample point and mix it with the sharp sample based on
  // how "inside" the wave that fragment is.
  float glassStrength = envelope * timeBell * edgeGuard;

  vec4 blurred = vec4(0.0);
  float rInner = 0.006;
  float rOuter = 0.014;
  // Two rings of 6 samples each. Loop iteration count is constant so
  // it unrolls on WebGL 1.
  for (int i = 0; i < 6; i++) {
    float a = float(i) * (6.2831853 / 6.0);
    vec2 dirV = vec2(cos(a), sin(a));
    // Stretch the glass-blur tangentially to the wave direction so the
    // refraction feels like it's streaking along the crest.
    vec2 tangent = vec2(-dir.y, dir.x);
    vec2 off1 = dirV * rInner;
    vec2 off2 = (dirV + tangent * 0.35) * rOuter;
    blurred += sampleCover(distortedUv + off1);
    blurred += sampleCover(distortedUv + off2);
  }
  blurred /= 12.0;

  // Soft saturation/brighten of the blurred layer, a hallmark of the
  // Apple-style liquid glass look.
  vec3 gray = vec3(dot(blurred.rgb, vec3(0.299, 0.587, 0.114)));
  blurred.rgb = mix(gray, blurred.rgb, 1.25);
  blurred.rgb *= 1.04;

  // Crisp specular highlight riding on the crest of the wave.
  float crest = pow(envelope, 2.2) * timeBell * edgeGuard;
  vec3 highlight = vec3(0.15, 0.18, 0.18) * crest;

  vec3 color = mix(sharp.rgb, blurred.rgb, clamp(glassStrength * 1.15, 0.0, 1.0));
  color += highlight;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("ripple shader compile fail", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export const RippleOverlay = forwardRef<RippleOverlayHandle>(
  function RippleOverlay(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const progRef = useRef<WebGLProgram | null>(null);
    const texRef = useRef<WebGLTexture | null>(null);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef(0);
    const sourceRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
      });
      if (!gl) return;
      glRef.current = gl;

      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return;

      const prog = gl.createProgram();
      if (!prog) return;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn("ripple program link fail", gl.getProgramInfoLog(prog));
        return;
      }
      progRef.current = prog;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const tex = gl.createTexture();
      if (!tex) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texRef.current = tex;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        gl.viewport(0, 0, canvas.width, canvas.height);
      };
      resize();
      window.addEventListener("resize", resize);

      return () => {
        window.removeEventListener("resize", resize);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    useImperativeHandle(
      ref,
      (): RippleOverlayHandle => ({
        trigger(source) {
          const gl = glRef.current;
          const prog = progRef.current;
          const tex = texRef.current;
          const canvas = canvasRef.current;
          if (!gl || !prog || !tex || !canvas) return;
          if (!source) return;
          // Video not yet playing / image not yet loaded -> skip.
          if (source instanceof HTMLImageElement && !source.complete) return;
          if (
            source instanceof HTMLVideoElement &&
            (source.readyState < 2 || source.videoWidth === 0)
          ) {
            return;
          }

          sourceRef.current = source;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          startRef.current = performance.now();
          canvas.style.display = "block";
          canvas.style.opacity = "1";

          gl.useProgram(prog);
          const uProgress = gl.getUniformLocation(prog, "u_progress");
          const uRes = gl.getUniformLocation(prog, "u_res");
          const uTexSize = gl.getUniformLocation(prog, "u_texSize");

          const DURATION = 1000;

          const render = () => {
            const now = performance.now();
            const elapsed = now - startRef.current;
            const t = Math.min(elapsed / DURATION, 1);

            const src = sourceRef.current;
            if (src) {
              try {
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.texImage2D(
                  gl.TEXTURE_2D,
                  0,
                  gl.RGBA,
                  gl.RGBA,
                  gl.UNSIGNED_BYTE,
                  src
                );

                const texW =
                  src instanceof HTMLVideoElement
                    ? src.videoWidth
                    : src.naturalWidth || src.width;
                const texH =
                  src instanceof HTMLVideoElement
                    ? src.videoHeight
                    : src.naturalHeight || src.height;
                gl.uniform2f(uTexSize, texW || 1, texH || 1);
              } catch {
                // Tainted / CORS: bail gracefully.
                canvas.style.display = "none";
                return;
              }
            }

            gl.uniform1f(uProgress, t);
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            // Fade the overlay out in the back third so the real DOM
            // (already mid-transition to the next slide) becomes
            // visible without a hard cut.
            if (t > 0.65) {
              const fade = 1 - (t - 0.65) / 0.35;
              canvas.style.opacity = String(Math.max(0, fade));
            }

            if (t < 1) {
              rafRef.current = requestAnimationFrame(render);
            } else {
              canvas.style.display = "none";
              sourceRef.current = null;
            }
          };
          render();
        },
      }),
      []
    );

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30"
        style={{ display: "none" }}
      />
    );
  }
);
