# GitLinux Workload-Runner: Engineering Design Document (v1.0)

## [ 1 ] Internal Service Architecture

The Workload-Runner is a monolith-first service designed for high-throughput I/O and low-latency container management.

### 1.1 PTY Manager
- **Responsibility**: Manages the lifecycle of Pseudo-terminals (PTY) using `node-pty`.
- **Mechanism**: Spawns a master PTY process that executes `docker exec` (or `runsc exec`) into the target container.
- **I/O Handling**: Buffers output to prevent head-of-line blocking on the WebSocket. Implements Flow Control (Pause/Resume) to prevent saturating the client.

### 1.2 Container Runtime Adapter
- **Responsibility**: Abstract layer over the Container Engine (Docker/gVisor).
- **Functions**: `create()`, `start()`, `stop()`, `pause()`, `resume()`.
- **Isolation**: Forces `runsc` (gVisor) runtime and applies rigid `HostConfig` (CPU/RAM limits).

### 1.3 Session Registry
- **Responsibility**: In-memory (with Redis persistence) mapping of `UserID -> WorkspaceID -> ContainerID -> PTY_PID`.
- **Persistence**: Ensures that if the Workload-Runner restarts, it can re-attach to existing containers (Reconciliation Loop).

### 1.4 WebSocket Gateway (Internal)
- **Responsibility**: Terminating TLS (if not done at Edge) and multiplexing signals.
- **Protocols**: Custom binary-friendly JSON protocol for `stdin`, `stdout`, `stderr`, `resize`, and `heartbeat`.

### 1.5 Resource Monitor
- **Responsibility**: Real-time tracking of Container metrics via `/sys/fs/cgroup`.
- **Action**: Triggers "Killer" logic if a container exceeds hard limits or stays `Idle` for > 30 mins.

### 1.6 Filesystem Mount Manager
- **Responsibility**: Orchestrates `Bind Mounts` from the Host's SSD to the Container's workspace.
- **Corruption Prevention**: Implements `fsck` checks on startup and uses `O_DIRECT` for critical metadata writes.

---

## [ 2 ] Request Flow (The 800ms Target)

1. **User Request (T+0ms)**: User hits `Connect`.
2. **Auth & Lookup (T+50ms)**: Gateway validates JWT. Registry checks if a container is already running.
3. **Provision/Wakeup (T+100ms)**:
   - If `Warm`: Attach immediately.
   - If `Suspended`: Unpause container (approx 150ms).
   - If `New`: Clone from `Pre-warmed Pool` (approx 300ms).
4. **PTY Attachment (T+450ms)**: `node-pty` spawns a process executing into the container.
5. **Stream Binding (T+500ms)**: WebSocket pipe established.
6. **Xterm Ready (T+600ms)**: Terminal prompt appears in the browser.

**Bottleneck**: Docker API latency and gVisor startup.
**Mitigation**: Pre-warmed containers and direct `containerd` interaction to bypass the Docker Daemon overhead if needed.

---

## [ 3 ] Runtime State Machine

| State | Trigger | Action | Recovery |
|-------|---------|--------|----------|
| **Provisioning** | Create Request | Pull image / Allocate SSD | Retry 3x, then fail |
| **Booting** | Start Signal | `docker start` with gVisor | Kill & Restart |
| **Attaching** | Running State | Spawn PTY & Bind WS | Re-attach on WS disconnect |
| **Running** | Active I/O | Streaming data | Check for `Idle` |
| **Idle** | No input > 30m | Notify User | Transition to Suspended |
| **Suspended** | Idle Timeout | `docker pause` / Snapshot | Restore to Running |
| **Crashed** | OOM / Panic | Log Error | Auto-restart (Limit 5x/hr) |
| **Terminated** | User Delete | Wipe SSD (opt) / Delete Container | None |

---

## [ 4 ] Storage Layer: The Workspace Engine

### 4.1 Local SSD Strategy
- We use **NVMe SSDs** with **XFS** filesystem for the host. XFS handles large numbers of small files (like `node_modules`) better than Ext4.
- **Project Structure**: Each user workspace is a directory: `/mnt/data/workspaces/{workspace_id}`.

### 4.2 OverlayFS Internals
- **LowerDir**: Read-only base image (Ubuntu/Node.js).
- **UpperDir**: User's specific changes to the OS.
- **WorkDir**: OverlayFS internal metadata.
- **Result**: Users can `apt-get install`, but the base image remains pristine.

### 4.3 Inode Exhaustion & node_modules
- **Problem**: `npm install` can create 50,000+ tiny files, eating all Inodes.
- **Solution**: Set high Inode limits on XFS. Implement `Quota` system (`xfs_quota`) per directory to limit both Space (e.g., 5GB) and Inodes (e.g., 1,000,000).

---

## [ 5 ] Security Model: The Hardened Sandbox

### 5.1 gVisor (The Core)
- Every workspace runs in a gVisor sandbox (`runsc`).
- It intercepts all 300+ Linux system calls and implements them in Sentry (written in Go).
- **Result**: Exploiting a Kernel vulnerability (like Dirty Pipe) will only break the gVisor sandbox, not the host.

### 5.2 Seccomp & Capabilities
- **Drop All**: We drop all Linux capabilities (`CAP_SYS_ADMIN`, `CAP_NET_RAW`, etc.) by default.
- **Seccomp**: Whitelist only essential syscalls.

### 5.3 Network Isolation
- Each container is on a private `Docker Network` (Bridge mode).
- **Egress Firewall**: Prevent access to internal IP ranges (192.168.x.x, 10.x.x.x) and cloud metadata APIs (169.254.169.254).

### 5.4 Threat Model
- **Threat**: User runs a fork bomb. -> **Mitigation**: `pids-limit` in Cgroups.
- **Threat**: User runs a miner. -> **Mitigation**: CPU quota (0.5 core) + Monitoring.
- **Threat**: Container Escape. -> **Mitigation**: gVisor.

---

## [ 6 ] Implementation Phases

### Phase 1: PTY-to-Local-Shell (Mock Container)
- Goal: Get WebSocket -> node-pty -> /bin/bash working on the host.
- Test: Latency measurement.

### Phase 2: Docker Integration
- Goal: Move `/bin/bash` into a Docker container.
- Test: File persistence after container restart.

### Phase 3: gVisor Hardening
- Goal: Switch runtime to `runsc`.
- Test: Verify syscall blocking.

### Phase 4: Resource Management
- Goal: Implement Cgroups and Quotas.
- Test: Force OOM and verify container kill.
