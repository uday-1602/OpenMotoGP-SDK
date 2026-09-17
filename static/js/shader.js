/* ══════════════════════════════════════════════════════════
   shader.js — WebGL background animation
   Renders an aerodynamic flow-line shader on a fullscreen canvas.
   Self-contained IIFE — no external dependencies.
   ══════════════════════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById("shader-canvas-ANIMATION_5");
  if (!canvas) return;

  function syncSize() {
    const w = canvas.clientWidth  || 1280;
    const h = canvas.clientHeight || 720;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
  }
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(syncSize).observe(canvas);
  }
  syncSize();

  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return;

  const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

  const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;

    float speed      = 1.2;
    float density    = 20.0;
    float brightness = 0.12;

    float lines = 0.0;
    for (float i = 0.0; i < 4.0; i++) {
        float offset = i * 0.25;
        float line   = sin(uv.x * density + u_time * speed + offset) * 0.5 + 0.5;
        line *= pow(1.0 - abs(uv.y - 0.5 - sin(uv.x * 1.5 + u_time * 0.4 + i) * 0.3), 60.0);
        lines += line;
    }

    vec3 color = vec3(0.898, 0.0, 0.078) * lines * brightness;
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.015;

    gl_FragColor = vec4(color, 1.0);
}`;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   vs));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  const uTime  = gl.getUniformLocation(prog, "u_time");
  const uRes   = gl.getUniformLocation(prog, "u_resolution");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");

  let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width && rect.height) {
      mouse.x = ((e.clientX - rect.left) / rect.width)  * canvas.width;
      mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
    }
  });

  function render(t) {
    if (typeof ResizeObserver === "undefined") syncSize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (uTime)  gl.uniform1f(uTime,  t * 0.001);
    if (uRes)   gl.uniform2f(uRes,   canvas.width, canvas.height);
    if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render(0);
})();
