const Docker = require('dockerode');
const ContainerAdapter = require('./ContainerAdapter');

/**
 * DockerAdapter implements the ContainerAdapter using Dockerode.
 * In production, this will use the 'runsc' (gVisor) runtime.
 */
class DockerAdapter extends ContainerAdapter {
    constructor() {
        super();
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    }

    async create(workspaceId, options = {}) {
        const {
            image = 'ubuntu:latest',
            cpu = 0.5,
            memory = 512 * 1024 * 1024, // 512MB
            mounts = []
        } = options;

        console.log(`[Docker] Creating container for workspace: ${workspaceId}`);

        const container = await this.docker.createContainer({
            Image: image,
            Tty: true,
            Cmd: ['/bin/bash'],
            name: `gitlinux-${workspaceId}`,
            HostConfig: {
                // Hard security: use gVisor runtime if available
                Runtime: 'runsc', 
                Memory: memory,
                CpuQuota: cpu * 100000,
                CpuPeriod: 100000,
                Binds: mounts, // e.g., ["/host/path:/container/path"]
                NetworkMode: 'bridge',
                AutoRemove: true,
                StorageOpt: {
                    size: '5G' // Quota (requires XFS/ext4 with project quotas)
                }
            }
        });

        await container.start();
        return container.id;
    }

    async stop(containerId) {
        const container = this.docker.getContainer(containerId);
        await container.stop();
    }

    async getMetrics(containerId) {
        const container = this.docker.getContainer(containerId);
        const stats = await container.stats({ stream: false });
        return stats;
    }
}

module.exports = new DockerAdapter();
