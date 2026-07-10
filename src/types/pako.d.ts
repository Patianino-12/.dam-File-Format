declare module 'pako' {
    export function deflate(
        data: Uint8Array | number[],
        options?: { level?: number; [key: string]: unknown },
    ): Uint8Array;

    export function inflate(
        data: Uint8Array | number[],
        options?: { [key: string]: unknown },
    ): Uint8Array;

    export function gzip(
        data: Uint8Array | number[],
        options?: { level?: number; [key: string]: unknown },
    ): Uint8Array;

    export function ungzip(
        data: Uint8Array | number[],
        options?: { [key: string]: unknown },
    ): Uint8Array;
}
