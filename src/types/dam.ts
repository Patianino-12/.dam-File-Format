export interface DamMetadata {
    author: string;
    created: string;
    description: string;
    tags: string[];
}

export interface DamFile {
    version: string;
    format: 'DAM';
    metadata: DamMetadata;
    content: Record<string, any>;
}

export const DEFAULT_DAM_FILE: DamFile = {
    version: '1.0.0',
    format: 'DAM',
    metadata: {
        author: 'Anonymous',
        created: new Date().toISOString(),
        description: 'A new .dam file',
        tags: ['initial'],
    },
    content: {
        welcome: 'Hello World',
        purpose: 'This is a custom .dam file format.',
    },
};
