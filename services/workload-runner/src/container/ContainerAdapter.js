/**
 * ContainerAdapter is an abstract base class for different 
 * container runtimes (Docker, gVisor, Firecracker).
 */
class ContainerAdapter {
    /**
     * Creates and starts a container.
     * @param {string} workspaceId 
     * @param {object} options 
     */
    async create(workspaceId, options) {
        throw new Error('Method not implemented');
    }

    /**
     * Stops and removes a container.
     */
    async stop(containerId) {
        throw new Error('Method not implemented');
    }

    /**
     * Executes a command inside the container.
     */
    async exec(containerId, cmd) {
        throw new Error('Method not implemented');
    }

    /**
     * Gets resource usage metrics.
     */
    async getMetrics(containerId) {
        throw new Error('Method not implemented');
    }
}

module.exports = ContainerAdapter;
