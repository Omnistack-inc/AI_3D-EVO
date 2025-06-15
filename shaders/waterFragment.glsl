uniform float time;
varying vec2 vUv;

// Noise functions (random, noise, fbm)
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f); // Cubic interpolation

    return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
               mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
}

float fbm(vec2 st, int octaves, float persistence) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0; // Start with base frequency
    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(st * frequency);
        frequency *= 2.0;
        amplitude *= persistence;
    }
    return value;
}


void main() {
    vec2 uv = vUv;

    // --- Layer 1: Broad, slower waves ---
    float speed1 = 0.25; // Adjusted: Was 0.2, then 0.25. User might want this faster.
    float scale1 = 2.5;
    vec2 motion1 = vec2(cos(time * speed1 * 0.4 + uv.y * 0.5), sin(time * speed1 * 0.6 + uv.x * 0.5)) * 0.2;
    float n1 = fbm(uv * scale1 + motion1, 4, 0.5);

    // --- Layer 2: Smaller, faster ripples ---
    float speed2 = 0.4; // Adjusted: Was 0.5, then 0.35. User might want this slower.
    float scale2 = 7.0; 
    vec2 motion2 = vec2(time * speed2 * 1.2, time * speed2 * 0.9);
    float n2 = fbm(uv * scale2 + motion2, 5, 0.45);

    // --- Layer 3: Very fine, quick surface details/shimmer ---
    float speed3 = 0.9; // Adjusted: Was 0.8, then 0.6. This creates a shimmer.
    float scale3 = 18.0;
    vec2 motion3 = vec2(cos(time * speed3 + uv.y * 2.0) * 0.05, sin(time * speed3 - uv.x * 2.0) * 0.05);
    float n3 = fbm(uv * scale3 + motion3, 3, 0.4);
    
    // --- Layer 4: Additional directional ripples (sinusoidal) ---
    float speed4 = 0.6;
    float scale4_x = 25.0;
    float scale4_y = 30.0;
    float rippleStrength = 0.03;
    float ripples = (sin((uv.x + time * speed4 * 0.3) * scale4_x) + cos((uv.y + time * speed4 * 0.2) * scale4_y)) * rippleStrength;
    
    // Combine noise layers
    // Adjust weights to control influence of each layer
    float combinedNoise = n1 * 0.45 + n2 * 0.30 + n3 * 0.10 + ripples * 1.5; // Ripples added more directly

    // Base water colors (Adjusted for a Lighter Blue)
    vec3 deepWaterColor = vec3(0.1, 0.25, 0.45);    // Was: vec3(0.03, 0.15, 0.3)
    vec3 midWaterColor = vec3(0.2, 0.45, 0.7);   // Was: vec3(0.1, 0.3, 0.55)
    vec3 shallowWaterColor = vec3(0.35, 0.65, 0.9); // Was: vec3(0.2, 0.5, 0.8)

    // Color based on noise (simulating depth and wave crests)
    vec3 waterColor = mix(deepWaterColor, midWaterColor, smoothstep(0.25, 0.55, combinedNoise));
    waterColor = mix(waterColor, shallowWaterColor, smoothstep(0.5, 0.7, combinedNoise));

    // --- Lighting ---
    // Define a fixed light direction (coming from slightly above and one side)
    vec3 lightDirection = normalize(vec3(0.3, 0.8, 0.2)); 
    
    // Approximate normal perturbation based on noise.
    // This is a simplified way to get a "bumpy" surface normal.
    // For more accuracy, you'd use dFdx/dFdy on the noise value if it represents height.
    // Here, we'll use the noise to modulate a base normal.
    vec3 surfaceNormal = normalize(vec3( (noise(uv*scale2 + motion2*0.5) - 0.5) * 0.3,  // Perturb x
                                         (noise(uv*scale2 + motion2*0.5 + 5.0) - 0.5) * 0.3, // Perturb y
                                         1.0)); // Base z is up

    // Diffuse lighting
    float diffuse = max(0.0, dot(surfaceNormal, lightDirection)) * 0.4 + 0.6; // Ambient + Diffuse

    // --- MARGIN COLOR VARIATION (NEW) ---
    // Calculate distance to the closest edge (0.0 at edge, 0.5 at center of a square UV)
    float distanceToEdge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    vec3 marginColor = vec3(0.25, 0.55, 0.8); // Lighter margin - Was: vec3(0.15, 0.45, 0.65)
    float marginWidth = 0.1; // How far from the edge the effect extends (e.g., 10% of UV)
    float marginBlend = smoothstep(0.0, marginWidth, distanceToEdge);

    // Mix the main water color with the margin color
    vec3 baseWaterColor = waterColor; // Store current water color before margin
    waterColor = mix(marginColor, baseWaterColor, marginBlend);
    
    // Apply diffuse lighting to the final base color (including margin effect)
    waterColor *= diffuse;
    // --- END MARGIN COLOR VARIATION ---

    // Specular highlights
    vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0)); // Assuming camera looks mostly down
    vec3 reflectDirection = reflect(-lightDirection, surfaceNormal);
    float specularStrength = pow(max(0.0, dot(reflectDirection, viewDirection)), 24.0); // Higher power for sharper highlights
    vec3 specularColor = vec3(0.9, 0.95, 1.0);
    
    vec3 finalColor = waterColor + specularColor * specularStrength * smoothstep(0.55, 0.75, combinedNoise) * 0.7; // Apply specular on wave crests

    // Foam (subtle, on wave crests)
    float foamNoiseVal = fbm(uv * 15.0 + time * 0.15, 3, 0.5);
    float foamFactor = smoothstep(0.65, 0.75, foamNoiseVal) * smoothstep(0.55, 0.7, combinedNoise);
    finalColor = mix(finalColor, vec3(0.9, 0.9, 0.95), foamFactor * 0.25);

    gl_FragColor = vec4(finalColor, 0.85); // Slightly more opaque
}