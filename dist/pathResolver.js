export class PathResolver {
    constructor(basePath) {
        this.basePath = basePath || window.location.origin;
        if (!this.basePath.endsWith("/")) {
            this.basePath += "/";
        }
    }
    getFullPath(relativePath) {
        if (relativePath.startsWith("/")) {
            relativePath = relativePath.slice(1); // Remove leading slash
        }
        return `${this.basePath}${relativePath}`;
    }
}
