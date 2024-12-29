export class PathResolver {
    private basePath: string;

    constructor(basePath?: string) {
        this.basePath = basePath || window.location.origin;
        if (!this.basePath.endsWith("/")) {
            this.basePath += "/";
        }
    }

    getFullPath(relativePath: string): string {
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.slice(1); // Remove leading slash
        }
        return `${this.basePath}${relativePath}`;
    }
}


