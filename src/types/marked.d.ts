declare module 'marked' {
    interface MarkedOptions {
        breaks?: boolean;
        gfm?: boolean;
        pedantic?: boolean;
        silent?: boolean;
        [key: string]: unknown;
    }

    interface Marked {
        parse(src: string, options?: MarkedOptions): string;
        setOptions(options: MarkedOptions): void;
    }

    export const marked: Marked;
    export function setOptions(options: MarkedOptions): void;
}
