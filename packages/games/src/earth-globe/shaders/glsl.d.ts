/**
 * Type declarations for GLSL shader imports
 * This enables TypeScript to understand Vite's ?raw import syntax
 */

declare module '*.glsl?raw' {
    const value: string;
    export default value;
}

declare module '*.vert?raw' {
    const value: string;
    export default value;
}

declare module '*.frag?raw' {
    const value: string;
    export default value;
}
