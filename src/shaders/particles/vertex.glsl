uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacmentTexture;

attribute float aIntensity;
attribute float aAngels;

varying vec3 vColor;

void main() {
    // Displacment
    vec3 newPostion = position;
    float displacmentIntesity = texture(uDisplacmentTexture, uv).r;
    displacmentIntesity = smoothstep(0.1, 0.3, displacmentIntesity);

    vec3 displacment = vec3(
        cos(aAngels) * 0.2,
        sin(aAngels) * 0.2,
        1.0
    );
    displacment = normalize(displacment);
    displacment *= displacmentIntesity;
    displacment *= 3.0;
    displacment *= aIntensity;

    newPostion += displacment;
    
    // Final position
    vec4 modelPosition = modelMatrix * vec4(newPostion, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Picture
    float pictureIntesity = texture(uPictureTexture, uv).r;

    // Point size
    gl_PointSize = 0.2 * pictureIntesity * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = vec3(pow(pictureIntesity, 2.0));
}