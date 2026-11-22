(() => {
  'use strict';

  const CAMERA_DISTANCE = 7.2;
  const NEAR = 0.8;
  const FAR = 16;
  const STRIDE = 11;
  const framingBoxes = [
    { halfW: 1.925, halfD: 1.495, bottom: -.65, top: -.39, spread: -.56 },
    { halfW: 1.695, halfD: 1.325, bottom: -.379, top: -.04, spread: -.13 },
    { halfW: 1.145, halfD: .875, bottom: -.109, top: .109, spread: .40 },
    { halfW: 1.192, halfD: .932, bottom: .108, top: .347, spread: 1.20 }
  ];

  const graphite = material(.16, .137, .115, .47, .2);
  const ceramic = material(.205, .182, .157, .73, .26);
  const carbon = material(.102, .101, .086, .18, .72);
  const board = material(.20, .186, .145, .24, .46);
  const bronze = material(.46, .282, .151, .78, .48);
  const brass = material(.69, .491, .272, .80, .45);
  const champagne = material(.83, .66, .43, .86, .56);
  const edge = material(.55, .482, .389, .83, .73);
  const die = material(.304, .355, .326, .84, .21);
  const etched = material(.59, .52, .405, .44, .41);
  const ink = material(.056, .052, .043, .24, 0);

  function material(red, green, blue, metal, grain) {
    return [red, green, blue, metal, grain];
  }

  function normalized(x, y, z) {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
  }

  function face(mesh, points, finish) {
    const [a, b, c] = points;
    const u = b.map((value, index) => value - a[index]);
    const v = c.map((value, index) => value - a[index]);
    const normal = normalized(
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    );

    for (let index = 1; index < points.length - 1; index += 1) {
      for (const point of [a, points[index], points[index + 1]]) {
        mesh.push(...point, ...normal, ...finish);
      }
    }
  }

  function perimeter(width, depth, height, cut, x, z) {
    const halfW = width / 2;
    const halfD = depth / 2;
    return [
      [-halfW + cut, -halfD], [halfW - cut, -halfD],
      [halfW, -halfD + cut], [halfW, halfD - cut],
      [halfW - cut, halfD], [-halfW + cut, halfD],
      [-halfW, halfD - cut], [-halfW, -halfD + cut]
    ].map(([px, pz]) => [x + px, height, z + pz]);
  }

  function slab(mesh, { x = 0, z = 0, bottom, top, width, depth, cut = .12, bevel = .025, surface, sides, rim }) {
    const rings = [
      perimeter(width - 2 * bevel, depth - 2 * bevel, bottom, cut, x, z),
      perimeter(width, depth, bottom + bevel, cut, x, z),
      perimeter(width, depth, top - bevel, cut, x, z),
      perimeter(width - 2 * bevel, depth - 2 * bevel, top, cut, x, z)
    ];

    face(mesh, rings[0], sides);
    for (let ring = 0; ring < rings.length - 1; ring += 1) {
      for (let i = 0; i < 8; i += 1) {
        const j = (i + 1) % 8;
        face(mesh, [rings[ring][i], rings[ring + 1][i], rings[ring + 1][j], rings[ring][j]], ring === 1 ? sides : rim);
      }
    }
    face(mesh, [...rings[3]].reverse(), surface);
  }

  function disk(mesh, x, y, z, radius, finish) {
    const ring = Array.from({ length: 18 }, (_, index) => {
      const angle = -index * Math.PI / 9;
      return [x + Math.cos(angle) * radius, y, z + Math.sin(angle) * radius];
    });
    face(mesh, ring, finish);
  }

  function track(mesh, points, y, width, finish) {
    for (let index = 1; index < points.length; index += 1) {
      const [ax, az] = points[index - 1];
      const [bx, bz] = points[index];
      const length = Math.hypot(bx - ax, bz - az);
      const sideX = (bz - az) * width / (2 * length);
      const sideZ = (ax - bx) * width / (2 * length);
      face(mesh, [
        [ax + sideX, y, az + sideZ], [ax - sideX, y, az - sideZ],
        [bx - sideX, y, bz - sideZ], [bx + sideX, y, bz + sideZ]
      ], finish);
    }
  }

  function plateDetails(mesh) {
    for (const x of [-1.61, 1.61]) {
      for (const z of [-1.2, 1.2]) {
        disk(mesh, x, -.391, z, .088, ink);
        disk(mesh, x, -.389, z, .059, edge);
        track(mesh, [[x - .036, z], [x + .036, z]], -.388, .012, ink);
      }
    }

    for (let index = 0; index < 24; index += 1) {
      const x = -1.35 + index * .116;
      track(mesh, [[x, 1.397], [x, 1.466]], -.388, .028, index % 4 === 0 ? champagne : brass);
      track(mesh, [[x, -1.397], [x, -1.466]], -.388, .028, index % 4 === 0 ? champagne : brass);
    }
  }

  function boardDetails(mesh) {
    for (const reflect of [-1, 1]) {
      for (let index = 0; index < 8; index += 1) {
        const x = .19 + index * .14;
        const inner = .58 + (index % 3) * .06;
        const outer = 1.18 - (index % 2) * .078;
        const endX = x + .095 * (index > 3 ? 1 : -1);
        track(mesh, [[x, reflect * inner], [x, reflect * (outer - .13)], [endX, reflect * outer]],
          -.115, .016, index % 3 === 0 ? champagne : brass);
        disk(mesh, endX, -.113, reflect * outer, .026, brass);
        disk(mesh, endX, -.112, reflect * outer, .012, ink);
      }

      for (let index = 0; index < 7; index += 1) {
        const z = -.64 + index * .205;
        const edgeX = reflect * (index % 2 ? 1.52 : 1.59);
        const jog = index < 3 ? -.105 : .105;
        track(mesh, [[reflect * .94, z], [reflect * 1.15, z],
          [reflect * 1.29, z + jog], [edgeX, z + jog]], -.114, .017, brass);
        disk(mesh, edgeX, -.111, z + jog, .021, champagne);
      }

      for (let index = 0; index < 5; index += 1) {
        const x = reflect * (1.08 + index * .086);
        slab(mesh, {
          x, z: reflect * 1.10, bottom: -.112, top: -.071, width: .051, depth: .108,
          cut: .009, bevel: .004, surface: edge, sides: graphite, rim: champagne
        });
      }
    }
    for (const x of [-1.28, 1.29]) {
      slab(mesh, {
        x, z: .87, bottom: -.113, top: -.041, width: .30, depth: .18, cut: .02,
        bevel: .009, surface: ceramic, sides: graphite, rim: edge
      });
      for (const offset of [-.09, -.03, .03, .09]) {
        track(mesh, [[x + offset, .945], [x + offset, 1.015]], -.114, .021, brass);
        track(mesh, [[x + offset, .725], [x + offset, .792]], -.114, .021, brass);
      }
    }
  }

  function heatSpreaderDetails(mesh) {
    for (const z of [-.64, .64]) {
      track(mesh, [[-.84, z], [.84, z]], .3458, .009, etched);
    }
    for (const x of [-.93, .93]) {
      track(mesh, [[x, -.55], [x, .55]], .3458, .009, etched);
      for (const z of [-.47, -.41, -.35, .35, .41, .47]) {
        track(mesh, [[x - .073, z], [x + .073, z]], .346, .01, etched);
      }
    }

    track(mesh, [[-.20, -.235], [-.20, .235]], .346, .034, champagne);
    track(mesh, [[-.18, .025], [.225, -.235]], .346, .034, champagne);
    track(mesh, [[-.075, -.040], [.246, .235]], .346, .034, champagne);
    disk(mesh, .39, .347, .23, .025, champagne);
    for (let index = 0; index < 5; index += 1) {
      const x = -.16 + index * .08;
      track(mesh, [[x, .43], [x + .038, .43]], .3458, .012, etched);
    }
  }

  function buildModel() {
    const frame = [];
    const circuit = [];
    const silicon = [];
    const cover = [];

    slab(frame, {
      bottom: -.65, top: -.50, width: 3.85, depth: 2.99, cut: .26, bevel: .048,
      surface: graphite, sides: graphite, rim: edge
    });
    slab(frame, {
      bottom: -.51, top: -.46, width: 3.82, depth: 2.97, cut: .26, bevel: .012,
      surface: brass, sides: bronze, rim: champagne
    });
    slab(frame, {
      bottom: -.47, top: -.39, width: 3.70, depth: 2.95, cut: .25, bevel: .022,
      surface: carbon, sides: graphite, rim: edge
    });
    plateDetails(frame);

    slab(circuit, {
      bottom: -.379, top: -.118, width: 3.39, depth: 2.65, cut: .14, bevel: .036,
      surface: board, sides: graphite, rim: brass
    });
    for (const z of [-1.3254, 1.3254]) {
      for (const y of [-.211, -.241, -.271, -.301]) {
        const line = [[-1.49, y, z], [1.49, y, z], [1.49, y + .009, z], [-1.49, y + .009, z]];
        face(circuit, z > 0 ? line : [...line].reverse(), bronze);
      }
    }
    boardDetails(circuit);

    slab(silicon, {
      bottom: -.109, top: -.012, width: 2.29, depth: 1.75, cut: .13, bevel: .018,
      surface: bronze, sides: graphite, rim: champagne
    });
    slab(silicon, {
      bottom: -.014, top: .070, width: 1.87, depth: 1.33, cut: .10, bevel: .020,
      surface: graphite, sides: bronze, rim: brass
    });
    for (const x of [-.432, .432]) {
      slab(silicon, {
        x, bottom: .069, top: .107, width: .77, depth: 1.08, cut: .043, bevel: .008,
        surface: die, sides: carbon, rim: champagne
      });
      for (let index = 0; index < 12; index += 1) {
        const z = -.46 + index * .084;
        track(silicon, [[x - .334, z], [x + .334, z]], .108, .0045, champagne);
      }
      for (let index = 0; index < 9; index += 1) {
        const dx = -.31 + index * .0775;
        track(silicon, [[x + dx, -.46], [x + dx, .462]], .109, .004, etched);
      }
    }

    slab(cover, {
      bottom: .108, top: .345, width: 2.38, depth: 1.86, cut: .195, bevel: .052,
      surface: ceramic, sides: graphite, rim: champagne
    });
    slab(cover, {
      bottom: .153, top: .181, width: 2.384, depth: 1.864, cut: .195, bevel: .007,
      surface: brass, sides: bronze, rim: champagne
    });
    heatSpreaderDetails(cover);

    return [
      { points: frame, spread: -.56 },
      { points: circuit, spread: -.13 },
      { points: silicon, spread: .40 },
      { points: cover, spread: 1.20 }
    ];
  }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    attribute vec2 aFinish;

    uniform vec2 uFrame;
    uniform vec2 uCenter;
    uniform vec2 uYaw;
    uniform vec2 uPitch;
    uniform float uSpread;
    uniform float uCamera;
    uniform vec2 uDepth;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec2 vFinish;
    varying vec3 vViewPosition;
    varying vec3 vViewNormal;

    vec3 cameraRotate(vec3 point) {
      vec3 rotated = vec3(
        uYaw.x * point.x + uYaw.y * point.z,
        point.y,
        uYaw.x * point.z - uYaw.y * point.x
      );
      return vec3(rotated.x,
        uPitch.x * rotated.y - uPitch.y * rotated.z,
        uPitch.y * rotated.y + uPitch.x * rotated.z
      );
    }

    void main() {
      vPosition = aPosition;
      vNormal = aNormal;
      vColor = aColor;
      vFinish = aFinish;
      vViewPosition = cameraRotate(aPosition + vec3(0.0, uSpread, 0.0));
      vViewNormal = cameraRotate(aNormal);
      float cameraDepth = uCamera - vViewPosition.z;
      gl_Position = vec4(vViewPosition.xy * uFrame * uCamera + uCenter * cameraDepth,
        uDepth.x * cameraDepth - uDepth.y, cameraDepth);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    uniform float uCamera;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vColor;
    varying vec2 vFinish;
    varying vec3 vViewPosition;
    varying vec3 vViewNormal;

    void main() {
      vec3 normal = normalize(vViewNormal);
      vec3 eye = normalize(vec3(0.0, 0.0, uCamera) - vViewPosition);
      vec3 key = normalize(vec3(-0.6, 0.9, 0.85));
      vec3 bounce = normalize(vec3(0.8, 0.35, 0.46));
      vec3 rim = normalize(vec3(0.15, 0.8, -0.6));
      float metal = vFinish.x;
      float grain = sin(vPosition.z * 770.0 + sin(vPosition.x * 186.0));
      float facing = max(0.0, dot(normal, eye));
      float diffuse = .31 + .63 * max(0.0, dot(normal, key)) + .31 * max(0.0, dot(normal, bounce));
      float studio = pow(max(0.0, dot(normal, normalize(key + eye))), mix(15.0, 47.0, metal));
      float warmRim = pow(max(0.0, dot(normal, normalize(rim + eye))), 28.0);
      float softBox = pow(max(0.0, dot(normal, normalize(bounce + eye))), 9.0);
      float fresnel = pow(1.0 - facing, 4.0);
      float brushing = grain * vFinish.y * .012 * max(0.2, dot(vNormal, vec3(0.0, 1.0, 0.0)));
      float gradient = smoothstep(-1.8, 1.8, vPosition.x + vPosition.z * .37);

      vec3 color = vColor * (diffuse + gradient * .14 + brushing);
      color += vec3(1.0, .81, .55) * metal * (studio * .58 + warmRim * .37 + fresnel * .10);
      color += vec3(.98, .90, .76) * softBox * (.07 + metal * .19);
      gl_FragColor = vec4(pow(clamp(color, 0.0, 1.0), vec3(.87)), 1.0);
    }
  `;

  function compile(gl, type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (gl.getShaderParameter(result, gl.COMPILE_STATUS)) return result;
    gl.deleteShader(result);
    throw new Error('Processor shader could not compile');
  }

  function project(point, spread, view) {
    const [x, y, z] = point;
    const depthY = y + spread;
    const horizX = view.cosYaw * x + view.sinYaw * z;
    const horizZ = view.cosYaw * z - view.sinYaw * x;
    const vertY = view.cosPitch * depthY - view.sinPitch * horizZ;
    const vertZ = view.sinPitch * depthY + view.cosPitch * horizZ;
    const scale = view.scale * CAMERA_DISTANCE / (CAMERA_DISTANCE - vertZ);
    return { x: view.centerX + horizX * scale, y: view.centerY - vertY * scale, depth: vertZ };
  }

  function frameView(view, zoom) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const { halfW, halfD, bottom: floor, top: ceiling, spread } of framingBoxes) {
      for (const x of [-halfW, halfW]) {
        for (const z of [-halfD, halfD]) {
          for (const y of [floor, ceiling]) {
            const point = project([x, y, z], spread * view.assembly, view);
            left = Math.min(left, point.x);
            right = Math.max(right, point.x);
            top = Math.min(top, point.y);
            bottom = Math.max(bottom, point.y);
          }
        }
      }
    }
    view.scale = zoom * Math.min(view.width * .91 / (right - left), view.height * .87 / (bottom - top));
    view.centerX = view.width / 2 - (left + right) * view.scale / 2;
    view.centerY = view.height / 2 - (top + bottom) * view.scale / 2;
  }

  function anchors(view) {
    return [
      project([.78, .346, .52], view.assembly * 1.2, view),
      project([-.68, .108, -.28], view.assembly * .40, view),
      project([1.48, -.385, 1.13], view.assembly * -.56, view)
    ].map(({ x, y }) => ({ x, y }));
  }

  function createRenderer(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return null;

    const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    const buffers = buildModel().map(({ points, spread }) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      return { buffer, spread, count: points.length / STRIDE };
    });

    const attributes = [
      ['aPosition', 3, 0], ['aNormal', 3, 3], ['aColor', 3, 6], ['aFinish', 2, 9]
    ].map(([name, size, offset]) => ({ location: gl.getAttribLocation(program, name), size, offset }));
    const uniforms = ['uFrame', 'uCenter', 'uYaw', 'uPitch', 'uSpread', 'uCamera', 'uDepth'];
    const locations = Object.fromEntries(uniforms.map(name => [name, gl.getUniformLocation(program, name)]));

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(locations.uCamera, CAMERA_DISTANCE);
    gl.uniform2f(locations.uDepth, (FAR + NEAR) / (FAR - NEAR), 2 * FAR * NEAR / (FAR - NEAR));
    attributes.forEach(({ location }) => gl.enableVertexAttribArray(location));

    return {
      maxSize: 1800,
      paint(view) {
        if (gl.isContextLost()) return false;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(locations.uFrame, 2 * view.scale / view.width, 2 * view.scale / view.height);
        gl.uniform2f(locations.uCenter, 2 * view.centerX / view.width - 1, 1 - 2 * view.centerY / view.height);
        gl.uniform2f(locations.uYaw, view.cosYaw, view.sinYaw);
        gl.uniform2f(locations.uPitch, view.cosPitch, view.sinPitch);
        for (const { buffer, spread, count } of buffers) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          attributes.forEach(({ location, size, offset }) => {
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
          });
          gl.uniform1f(locations.uSpread, spread * view.assembly);
          gl.drawArrays(gl.TRIANGLES, 0, count);
        }
        return true;
      },
      destroy() {
        buffers.forEach(({ buffer }) => gl.deleteBuffer(buffer));
        gl.deleteProgram(program);
      }
    };
  }

  function softwareColor(points, start, view) {
    const [nx, ny, nz, red, green, blue, metal] = points.slice(start + 3, start + 10);
    const axialZ = view.cosYaw * nz - view.sinYaw * nx;
    const lightX = view.cosYaw * nx + view.sinYaw * nz;
    const lightY = view.cosPitch * ny - view.sinPitch * axialZ;
    const lightZ = view.sinPitch * ny + view.cosPitch * axialZ;
    const key = Math.max(0, -.40 * lightX + .60 * lightY + .65 * lightZ);
    const fill = Math.max(0, .81 * lightX + .35 * lightY + .46 * lightZ);
    const diffuse = .38 + .70 * key + .24 * fill;
    const facing = Math.max(0, lightZ);
    const rim = metal * (.05 * (1 - facing) ** 3 + .19 * key ** 6 + .08 * fill ** 3);
    return [red * diffuse + rim, green * diffuse + .81 * rim, blue * diffuse + .55 * rim]
      .map(value => 255 * Math.min(1, value) ** .87);
  }

  function rasterTriangle(a, b, c, color, frame, depthBuffer, ratioX, ratioY) {
    const ax = a.x * ratioX;
    const ay = a.y * ratioY;
    const bx = b.x * ratioX;
    const by = b.y * ratioY;
    const cx = c.x * ratioX;
    const cy = c.y * ratioY;
    const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denominator) < .001) return;

    const startX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const endX = Math.min(frame.width - 1, Math.ceil(Math.max(ax, bx, cx)));
    const startY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const endY = Math.min(frame.height - 1, Math.ceil(Math.max(ay, by, cy)));
    const aDepth = 1 / (CAMERA_DISTANCE - a.depth);
    const bDepth = 1 / (CAMERA_DISTANCE - b.depth);
    const cDepth = 1 / (CAMERA_DISTANCE - c.depth);
    const stepU = (by - cy) / denominator;
    const stepV = (cy - ay) / denominator;
    const stepRowU = (cx - bx) / denominator;
    const stepRowV = (ax - cx) / denominator;

    for (let y = startY; y <= endY; y += 1) {
      let u = stepU * (startX + .5 - cx) + stepRowU * (y + .5 - cy);
      let v = stepV * (startX + .5 - cx) + stepRowV * (y + .5 - cy);
      for (let x = startX; x <= endX; x += 1, u += stepU, v += stepV) {
        const w = 1 - u - v;
        if (u < -.0001 || v < -.0001 || w < -.0001) continue;
        const depth = u * aDepth + v * bDepth + w * cDepth;
        const index = y * frame.width + x;
        if (depth < depthBuffer[index]) continue;
        depthBuffer[index] = depth;
        frame.data[index * 4] = color[0];
        frame.data[index * 4 + 1] = color[1];
        frame.data[index * 4 + 2] = color[2];
        frame.data[index * 4 + 3] = 255;
      }
    }
  }

  function createSoftwareRenderer(canvas) {
    const context = canvas.getContext('2d');
    if (!context) return null;

    const meshes = buildModel();
    let frame;
    let depthBuffer;
    return {
      maxSize: 650,
      paint(view) {
        if (frame?.width !== canvas.width || frame?.height !== canvas.height) {
          frame = context.createImageData(canvas.width, canvas.height);
          depthBuffer = new Float32Array(canvas.width * canvas.height);
        }
        frame.data.fill(0);
        depthBuffer.fill(0);
        const ratioX = canvas.width / view.width;
        const ratioY = canvas.height / view.height;
        for (const { points, spread } of meshes) {
          const heightOffset = spread * view.assembly;
          for (let start = 0; start < points.length; start += 3 * STRIDE) {
            const a = project(points.slice(start, start + 3), heightOffset, view);
            const b = project(points.slice(start + STRIDE, start + STRIDE + 3), heightOffset, view);
            const c = project(points.slice(start + 2 * STRIDE, start + 2 * STRIDE + 3), heightOffset, view);
            rasterTriangle(a, b, c, softwareColor(points, start, view), frame, depthBuffer, ratioX, ratioY);
          }
        }
        context.putImageData(frame, 0, 0);
        return true;
      },
      destroy() {
        frame = null;
        depthBuffer = null;
      }
    };
  }

  function create(canvas) {
    let renderer;
    try {
      renderer = createRenderer(canvas) || createSoftwareRenderer(canvas);
    } catch {
      return null;
    }
    if (!renderer) return null;

    let lastDraw;
    return {
      draw({ assembly = 0, angle = -.48, pitch = .62, zoom = 1 } = {}) {
        const { width, height } = canvas.getBoundingClientRect();
        if (width < 1 || height < 1) return null;

        const density = Math.min(window.devicePixelRatio || 1, 2, renderer.maxSize / Math.max(width, height));
        const pixelW = Math.max(1, Math.round(width * density));
        const pixelH = Math.max(1, Math.round(height * density));
        const signature = [width, height, pixelW, pixelH, assembly, angle, pitch, zoom];
        if (lastDraw?.signature.every((value, index) => value === signature[index])) return lastDraw.points;
        if (canvas.width !== pixelW) canvas.width = pixelW;
        if (canvas.height !== pixelH) canvas.height = pixelH;

        const view = {
          width,
          height,
          assembly: Math.max(0, Math.min(1, assembly)),
          scale: 1,
          centerX: 0,
          centerY: 0,
          cosYaw: Math.cos(angle),
          sinYaw: Math.sin(angle),
          cosPitch: Math.cos(pitch),
          sinPitch: Math.sin(pitch)
        };
        frameView(view, zoom);
        if (!renderer.paint(view)) return null;
        const points = anchors(view);
        lastDraw = { signature, points };
        return points;
      },
      destroy() {
        renderer.destroy();
      }
    };
  }

  window.AtelierModel = { create };
})();
