// System Monitor Client-side JavaScript

class SystemMonitor {
    constructor() {
        this.socket = io();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupQuickActions();
        this.initializeUI();
        this.lastData = null;
    }

    setupEventListeners() {
        this.socket.on('systemData', (data) => {
            try {
                this.updateUI(data);
            } catch (error) {
                console.error('Error processing system data:', error);
                this.showNotification('Error processing data from server', 'danger');
            }
        });

        this.socket.on('connect', () => {
            this.showConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            this.showConnectionStatus(false);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.showNotification('Connection error occurred', 'warning');
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        body.setAttribute('data-bs-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';

        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            body.setAttribute('data-bs-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    setupQuickActions() {
        const fabButton = document.getElementById('fabButton');
        const quickActions = document.getElementById('quickActions');
        const fabIcon = document.getElementById('fabIcon');
        let isOpen = false;

        // Toggle quick actions menu
        fabButton.addEventListener('click', () => {
            isOpen = !isOpen;
            quickActions.classList.toggle('show', isOpen);
            fabIcon.className = isOpen ? 'bi bi-x-lg' : 'bi bi-plus-lg';
            fabButton.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!fabButton.contains(e.target) && !quickActions.contains(e.target) && isOpen) {
                isOpen = false;
                quickActions.classList.remove('show');
                fabIcon.className = 'bi bi-plus-lg';
                fabButton.style.transform = 'rotate(0deg)';
            }
        });

        // Quick action handlers
        document.getElementById('refreshAction').addEventListener('click', (e) => {
            e.preventDefault();
            this.forceRefresh();
        });

        document.getElementById('fullscreenAction').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleFullscreen();
        });

        document.getElementById('exportAction').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportData();
        });
    }

    initializeUI() {
        this.updateLastUpdate();
        this.initializeTooltips();
    }

    updateUI(data) {
        try {
            this.lastData = this.mergeData(data);

            // Only update what's available in the current data payload with null checks
            if (data.cpu && typeof data.cpu === 'object') {
                this.updateCPU(this.lastData.cpu);
            }
            if (data.memory && typeof data.memory === 'object') {
                this.updateMemory(this.lastData.memory);
            }
            if (data.storage && Array.isArray(data.storage)) {
                this.updateStorage(this.lastData.storage);
            }
            if (data.processes && data.processes.top && Array.isArray(data.processes.top) && data.processes.top.length > 0) {
                this.updateProcesses(this.lastData.processes);
            }
            if (data.network && typeof data.network === 'object') {
                if (data.network.interfaces && Array.isArray(data.network.interfaces)) this.updateNetworkInterfaces(this.lastData.network.interfaces);
                if (data.network.stats && Array.isArray(data.network.stats)) this.updateNetworkStats(this.lastData.network.stats);
                if (data.network.connections && Array.isArray(data.network.connections)) this.updateNetworkConnections(this.lastData.network.connections);
            }
            if (data.users && Array.isArray(data.users)) {
                this.updateUsers(this.lastData.users);
            }
            if (data.services && Array.isArray(data.services)) {
                this.updateServices(this.lastData.services);
            }
            if (data.systemInfo && typeof data.systemInfo === 'object' && Object.keys(data.systemInfo).length > 0) {
                this.updateSystemInfo(this.lastData.systemInfo);
            }

            this.updateLastUpdate();

            // Add safety check for performance indicators
            if (this.lastData && this.lastData.cpu && this.lastData.memory) {
                this.updatePerformanceIndicators(this.lastData);
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            this.showNotification('Error updating display', 'danger');
        }
    }

    // Helper method to merge new data with existing data to maintain state
    mergeData(newData) {
        if (!this.lastData) return newData;

        // Create a deep merged object
        const merged = { ...this.lastData };

        // Update top-level properties that exist in newData
        Object.keys(newData).forEach(key => {
            if (typeof newData[key] === 'object' && newData[key] !== null) {
                merged[key] = { ...merged[key], ...newData[key] };
            } else {
                merged[key] = newData[key];
            }
        });

        return merged;
    }

    updateSystemInfo(info) {
        const container = document.getElementById('systemInfo');
        if (!container) return;

        container.innerHTML = `
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-hdd-network text-primary"></i>
                    Hostname
                </div>
                <div class="system-info-value">${info.hostname || 'Unknown'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-display text-success"></i>
                    Operating System
                </div>
                <div class="system-info-value">${info.distro || info.platform || 'Unknown'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-gear text-info"></i>
                    Kernel
                </div>
                <div class="system-info-value">${info.kernel || 'Unknown'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-cpu text-warning"></i>
                    Architecture
                </div>
                <div class="system-info-value">${info.arch || 'Unknown'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-laptop text-secondary"></i>
                    Platform
                </div>
                <div class="system-info-value">${info.platform || 'Unknown'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-clock text-primary"></i>
                    Uptime
                </div>
                <div class="system-info-value">${info.uptime || '0m'}</div>
            </div>
            <div class="system-info-item">
                <div class="system-info-label">
                    <i class="bi bi-calendar3 text-info"></i>
                    Boot Time
                </div>
                <div class="system-info-value">${info.bootTime || 'Unknown'}</div>
            </div>
        `;
    }

    updateCPU(cpu) {
        if (!cpu) return;

        // Update enhanced CPU metrics - check if values exist first
        // Add explicit fallback to currentLoad if avgLoad is missing
        const cpuLoad = cpu.avgLoad !== undefined ? cpu.avgLoad :
            (cpu.currentLoad !== undefined ? cpu.currentLoad : 0);

        // Display CPU load with better fallbacks
        this.animateValue('avgCpuLoad', `${cpuLoad}%`);

        // Display "-" for unavailable temperature
        if (cpu.temperature !== undefined) {
            const tempValue = cpu.temperature > 0 ?
                `${cpu.temperature}°C` :
                '-';
            this.animateValue('cpuTemp', tempValue);
        }

        if (cpu.cores) this.animateValue('cpuCoresCount', cpu.cores.length);
        if (cpu.currentLoadUser !== undefined) this.animateValue('cpuLoadUser', `${cpu.currentLoadUser}%`);
        if (cpu.currentLoadSystem !== undefined) this.animateValue('cpuLoadSystem', `${cpu.currentLoadSystem}%`);
        if (cpu.speed && cpu.speed.avg !== undefined) this.animateValue('cpuSpeed', `${Math.round(cpu.speed.avg)} MHz`);

        // Only update cores if they exist
        if (!cpu.cores || !cpu.cores.length) return;

        // Update CPU cores with enhanced details
        const container = document.getElementById('cpuCoresList');
        if (!container) return;

        container.innerHTML = cpu.cores.map(core => {
            // Handle potentially missing values in core data
            const coreLoad = core.load !== undefined ? core.load : 0;
            const coreSpeed = core.speed ? core.speed : 'N/A';

            return `
            <div class="cpu-core data-update">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="cpu-core-label">
                        <i class="bi bi-cpu"></i> Core ${core.core}
                    </span>
                    <div>
                        <span class="badge ${this.getCPUBadgeClass(coreLoad)} me-1">${coreLoad}%</span>
                        ${coreSpeed !== 'N/A' ? `<span class="badge bg-secondary">${coreSpeed} MHz</span>` : ''}
                    </div>
                </div>
                <div class="progress mb-1">
                    <div class="progress-bar ${this.getCPUProgressBarClass(coreLoad)}" 
                         role="progressbar" 
                         style="width: ${coreLoad}%"
                         data-bs-toggle="tooltip" 
                         data-bs-placement="top" 
                         title="Total: ${coreLoad}%">
                    </div>
                </div>
                ${core.loadUser !== undefined ? `
                <div class="row small">
                    <div class="col-3 text-center">
                        <div class="text-muted">User</div>
                        <div class="fw-bold text-primary">${core.loadUser}%</div>
                    </div>
                    <div class="col-3 text-center">
                        <div class="text-muted">System</div>
                        <div class="fw-bold text-warning">${core.loadSystem}%</div>
                    </div>
                    <div class="col-3 text-center">
                        <div class="text-muted">Nice</div>
                        <div class="fw-bold text-info">${core.loadNice}%</div>
                    </div>
                    <div class="col-3 text-center">
                        <div class="text-muted">Idle</div>
                        <div class="fw-bold text-success">${core.loadIdle}%</div>
                    </div>
                </div>
                ` : ''}
            </div>
        `}).join('');

        // Initialize tooltips
        this.initializeTooltips();
    }

    updateMemory(memory) {
        if (!memory) return;

        // Update RAM with enhanced details and fallbacks
        this.animateProgressBar('ramProgress', memory.usedPercent || 0, this.getMemoryProgressBarClass(memory.usedPercent || 0));
        this.animateValue('ramPercent', `${memory.usedPercent || 0}%`);
        this.animateValue('ramUsed', `${memory.used || 0} GB`);
        this.animateValue('ramAvailable', `${memory.available || 0} GB`);
        // Only update cached if the field exists and element exists
        if (memory.cached !== undefined && document.getElementById('ramCached')) {
            this.animateValue('ramCached', `${memory.cached} GB`);
        }
        this.animateValue('ramTotal', `${memory.total || 0} GB`);

        // Update Swap with animations
        this.animateProgressBar('swapProgress', memory.swapUsedPercent || 0, 'bg-warning');
        this.animateValue('swapPercent', `${memory.swapUsedPercent || 0}%`);
        this.animateValue('swapUsed', `Used: ${memory.swapUsed || 0} GB`);
        this.animateValue('swapTotal', `Total: ${memory.swapTotal || 0} GB`);
    }

    updateStorage(storage) {
        const container = document.getElementById('storageList');
        if (!container) return;

        if (!Array.isArray(storage) || storage.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No storage devices detected</div>';
            return;
        }

        container.innerHTML = storage.map(device => `
            <div class="storage-item data-update">
                <div class="storage-header">
                    <div class="storage-name">
                        <i class="bi bi-hdd-fill me-2"></i>${device.fs || 'Unknown'}
                    </div>
                    <span class="badge bg-info">${device.type || 'Unknown'}</span>
                </div>
                <div class="progress mb-3" data-bs-toggle="tooltip" data-bs-placement="top" 
                     title="${device.used || 0} GB used of ${device.size || 0} GB total">
                    <div class="progress-bar ${this.getStorageProgressBarClass(device.use || 0)}" 
                         role="progressbar" 
                         style="width: ${device.use || 0}%">
                    </div>
                </div>
                <div class="row small">
                    <div class="col-4 text-center">
                        <div class="text-muted">Used</div>
                        <div class="fw-bold">${device.used || 0} GB</div>
                    </div>
                    <div class="col-4 text-center">
                        <div class="text-muted">Free</div>
                        <div class="fw-bold text-success">${device.available || 0} GB</div>
                    </div>
                    <div class="col-4 text-center">
                        <div class="text-muted">Total</div>
                        <div class="fw-bold">${device.size || 0} GB</div>
                    </div>
                </div>
            </div>
        `).join('');

        // Initialize tooltips
        this.initializeTooltips();
    }

    updateProcesses(processes) {
        if (!processes) return;

        // Update process statistics with fallbacks
        this.animateValue('processTotal', processes.all || 0);
        this.animateValue('processRunning', processes.running || 0);
        this.animateValue('processSleeping', processes.sleeping || 0);
        this.animateValue('processZombie', processes.zombie || 0);

        const container = document.getElementById('processList');
        if (!container) return;

        if (!Array.isArray(processes.top) || processes.top.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-muted text-center">No processes available</td></tr>';
            return;
        }

        container.innerHTML = processes.top.map((proc, index) => `
            <tr class="data-update" style="animation-delay: ${index * 0.05}s">
                <td><span class="badge bg-secondary">${proc.pid || 'N/A'}</span></td>
                <td class="text-truncate" style="max-width: 120px;" 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top" 
                    title="${proc.name || 'Unknown'}">
                    <i class="bi bi-app me-1"></i>${proc.name || 'Unknown'}
                </td>
                <td>
                    <span class="badge ${this.getCPUBadgeClass(proc.cpu || 0)}">${proc.cpu || 0}%</span>
                </td>
                <td>
                    <span class="badge ${this.getMemoryBadgeClass(proc.memory || 0)}">${proc.memory || 0}%</span>
                </td>
                <td>
                    <span class="badge ${this.getProcessStateBadgeClass(proc.state || 'unknown')}">${proc.state || 'unknown'}</span>
                </td>
            </tr>
        `).join('');

        // Initialize tooltips
        this.initializeTooltips();
    }

    updateNetworkInterfaces(interfaces) {
        const container = document.getElementById('networkInterfaces');
        if (!container) return;

        if (!Array.isArray(interfaces) || interfaces.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No network interfaces detected</div>';
            return;
        }

        container.innerHTML = interfaces.map(iface => `
            <div class="storage-item mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="storage-name">
                        <i class="bi bi-ethernet me-2"></i>${iface.iface || 'Unknown'}
                    </strong>
                    <span class="badge ${iface.operstate === 'up' ? 'text-bg-success' : 'text-bg-warning'}">${iface.operstate || 'unknown'}</span>
                </div>
                <div class="row small">
                    <div class="col-md-6">
                        <div class="text-muted">IPv4</div>
                        <div class="fw-bold">${iface.ip4 || 'N/A'}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted">IPv6</div>
                        <div class="fw-bold" style="word-break: break-all;">${iface.ip6 || 'N/A'}</div>
                    </div>
                    <div class="col-md-6">
                        <div class="text-muted">MAC</div>
                        <div class="fw-bold">${iface.mac || 'N/A'}</div>
                    </div>
                    <div class="col-md-6 mt-2">
                        <div class="text-muted">Speed</div>
                        <div class="fw-bold">${iface.speed ? iface.speed + ' Mbps' : 'N/A'}</div>
                    </div>
                    <div class="col-md-6 mt-2">
                        <div class="text-muted">Type</div>
                        <div class="fw-bold">${iface.type || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateNetworkStats(stats) {
        const container = document.getElementById('networkStats');
        if (!container) return;

        if (!Array.isArray(stats) || stats.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No network statistics available</div>';
            return;
        }

        container.innerHTML = stats.map(stat => `
            <div class="storage-item mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="storage-name">
                        <i class="bi bi-graph-up me-2"></i>${stat.iface || 'Unknown'}
                    </strong>
                    <span class="badge ${stat.operstate === 'up' ? 'bg-success' : 'bg-secondary'}">${stat.operstate || 'unknown'}</span>
                </div>
                <div class="row small">
                    <div class="col-6">
                        <div class="text-muted">RX</div>
                        <div class="fw-bold text-info">${stat.rx_bytes || 0} MB</div>
                        <div class="text-muted small">${stat.rx_sec || 0} KB/s</div>
                    </div>
                    <div class="col-6">
                        <div class="text-muted">TX</div>
                        <div class="fw-bold text-warning">${stat.tx_bytes || 0} MB</div>
                        <div class="text-muted small">${stat.tx_sec || 0} KB/s</div>
                    </div>
                    <div class="col-6 mt-2">
                        <div class="text-muted">RX Errors</div>
                        <div class="fw-bold ${(stat.rx_errors || 0) > 0 ? 'text-danger' : 'text-success'}">${stat.rx_errors || 0}</div>
                    </div>
                    <div class="col-6 mt-2">
                        <div class="text-muted">TX Errors</div>
                        <div class="fw-bold ${(stat.tx_errors || 0) > 0 ? 'text-danger' : 'text-success'}">${stat.tx_errors || 0}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateNetworkConnections(connections) {
        const container = document.getElementById('connectionsList');
        if (!container) return;

        if (!Array.isArray(connections) || connections.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-muted text-center">No active connections</td></tr>';
            return;
        }

        container.innerHTML = connections.map((conn, index) => `
            <tr class="data-update" style="animation-delay: ${index * 0.05}s">
                <td><span class="badge bg-info">${conn.protocol || 'unknown'}</span></td>
                <td class="text-truncate" style="max-width: 150px;">${conn.localAddress || ''}:${conn.localPort || ''}</td>
                <td class="text-truncate" style="max-width: 150px;">${conn.peerAddress || ''}:${conn.peerPort || ''}</td>
                <td><span class="badge ${this.getConnectionStateBadgeClass(conn.state || 'unknown')}">${conn.state || 'unknown'}</span></td>
                <td class="text-truncate" style="max-width: 100px;">${conn.process || 'N/A'}</td>
            </tr>
        `).join('');
    }

    updateUsers(users) {
        const container = document.getElementById('usersList');
        if (!container) return;

        if (!Array.isArray(users) || users.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No logged users</div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="storage-item mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="storage-name">
                        <i class="bi bi-person me-2"></i>${user.user || 'Unknown'}
                    </strong>
                    <span class="badge bg-success">online</span>
                </div>
                <div class="small">
                    <div class="text-muted">TTY: ${user.tty || 'N/A'}</div>
                    <div class="text-muted">Login: ${user.date || 'N/A'} ${user.time || ''}</div>
                    ${user.ip ? `<div class="text-muted">IP: ${user.ip}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateServices(services) {
        const container = document.getElementById('servicesList');
        if (!container) return;

        if (!Array.isArray(services) || services.length === 0) {
            container.innerHTML = '<div class="text-muted text-center">No services detected</div>';
            return;
        }

        container.innerHTML = services.map(service => `
            <div class="storage-item mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <strong class="storage-name">
                        <i class="bi bi-server me-2"></i>${service.name || 'Unknown'}
                    </strong>
                    <span class="badge ${service.running ? 'bg-success' : 'bg-danger'}">${service.running ? 'Running' : 'Stopped'}</span>
                </div>
                <div class="small">
                    <div class="text-muted">Start Mode: ${service.startmode || 'N/A'}</div>
                    ${service.cpu ? `<div class="text-muted">CPU: ${service.cpu}%</div>` : ''}
                    ${service.mem ? `<div class="text-muted">Memory: ${service.mem}%</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateLastUpdate() {
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }

    showConnectionStatus(connected) {
        const alert = document.querySelector('.alert');
        const statusIndicator = alert.querySelector('.status-indicator');

        if (connected) {
            alert.className = 'alert alert-info d-flex align-items-center fade-in-up';
            statusIndicator.className = 'status-indicator status-online';
            alert.innerHTML = `
                <span class="status-indicator status-online"></span>
                <i class="bi bi-wifi me-2"></i>
                <span>Auto-refreshing data every 1 minutes... Last update: <span id="lastUpdate">Never</span></span>
            `;
        } else {
            alert.className = 'alert alert-warning d-flex align-items-center fade-in-up';
            statusIndicator.className = 'status-indicator status-offline';
            alert.innerHTML = `
                <span class="status-indicator status-offline"></span>
                <i class="bi bi-wifi-off me-2"></i>
                <span>Connection lost. Attempting to reconnect...</span>
            `;
        }
    }

    // Animation helper methods
    animateValue(elementId, newValue) {
        try {
            const element = document.getElementById(elementId);
            if (element && element.textContent !== String(newValue)) {
                element.classList.add('data-update');
                element.textContent = newValue;
                setTimeout(() => {
                    if (element && element.classList) {
                        element.classList.remove('data-update');
                    }
                }, 500);
            }
        } catch (error) {
            console.error(`Error animating value for ${elementId}:`, error);
        }
    }

    animateProgressBar(elementId, percentage, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.width = `${percentage}%`;
            element.className = `progress-bar ${className}`;
            element.classList.add('data-update');
            setTimeout(() => element.classList.remove('data-update'), 500);
        }
    }

    initializeTooltips() {
        try {
            // Dispose of existing tooltips first
            const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            existingTooltips.forEach(el => {
                try {
                    const tooltip = bootstrap.Tooltip.getInstance(el);
                    if (tooltip) tooltip.dispose();
                } catch (e) {
                    // Ignore disposal errors
                }
            });

            // Initialize new tooltips with small delay to prevent conflicts
            setTimeout(() => {
                const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                tooltipTriggerList.forEach(tooltipTriggerEl => {
                    try {
                        if (tooltipTriggerEl && !bootstrap.Tooltip.getInstance(tooltipTriggerEl)) {
                            new bootstrap.Tooltip(tooltipTriggerEl);
                        }
                    } catch (e) {
                        // Ignore individual tooltip creation errors
                    }
                });
            }, 100);
        } catch (error) {
            console.error('Error initializing tooltips:', error);
        }
    }

    // Quick action methods
    forceRefresh() {
        this.socket.emit('requestUpdate');
        this.showNotification('Refreshing data...', 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                this.showNotification('Entered fullscreen mode', 'success');
            });
        } else {
            document.exitFullscreen().then(() => {
                this.showNotification('Exited fullscreen mode', 'info');
            });
        }
    }

    exportData() {
        if (this.lastData) {
            const dataStr = JSON.stringify(this.lastData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `system-monitor-${new Date().toISOString().slice(0, 19)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
        notification.style.zIndex = '9999';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        notification.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.style.opacity = '1', 100);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updatePerformanceIndicators(data) {
        try {
            const cpuElement = document.querySelector('#avgCpuLoad');
            const ramElement = document.querySelector('#ramPercent');

            // Update performance indicators based on thresholds with safety checks
            if (data.cpu && typeof data.cpu.avgLoad === 'number') {
                this.updatePerformanceClass(cpuElement, data.cpu.avgLoad);
            }
            if (data.memory && typeof data.memory.usedPercent === 'number') {
                this.updatePerformanceClass(ramElement, data.memory.usedPercent);
            }
        } catch (error) {
            console.error('Error updating performance indicators:', error);
        }
    }

    updatePerformanceClass(element, value) {
        if (element) {
            element.classList.remove('performance-good', 'performance-warning', 'performance-critical');
            if (value < 50) {
                element.classList.add('performance-good');
            } else if (value < 80) {
                element.classList.add('performance-warning');
            } else {
                element.classList.add('performance-critical');
            }
        }
    }

    getCPUProgressBarClass(value) {
        let cpu;
        if (value < 30) cpu = 'bg-success';
        else if (value < 70) cpu = 'bg-warning';
        return cpu || 'bg-danger';
    }

    getMemoryProgressBarClass(value) {
        let memory;
        if (value < 50) memory = 'bg-success';
        else if (value < 80) memory = 'bg-warning';
        else memory = 'bg-danger';
        return memory;
    }

    getStorageProgressBarClass(value) {
        let storage;
        if (value < 60) storage = 'bg-success';
        else if (value < 85) storage = 'bg-warning';
        else storage = 'bg-danger';
        return storage;
    }

    // Add this temporarily to your app.js to debug badge classes:
    getCPUBadgeClass(value) {
        let badgeClass;
        if (value < 10) badgeClass = 'bg-success';
        else if (value < 50) badgeClass = 'bg-warning';
        else badgeClass = 'bg-danger';

        console.log(`CPU Badge for ${value}%: ${badgeClass}`); // Debug log
        return badgeClass;
    }

    getMemoryBadgeClass(value) {
        let membc;
        if (value < 20) membc = 'bg-success';
        else if (value < 50) membc = 'bg-warning';
        else membc = 'bg-danger';
        return membc;
    }

    getProcessStateBadgeClass(state) {
        console.log('Process state received:', state); // Debug log
        switch (state.toLowerCase()) {
            case 'running':
            case 'r':
                return 'bg-success';
            case 'sleeping':
            case 's':
                return 'bg-info';
            case 'zombie':
            case 'z':
                return 'bg-danger';
            case 'stopped':
            case 't':
                return 'bg-warning';
            default:
                console.log('Unknown process state, using bg-secondary:', state); // Debug log
                return 'bg-secondary';
        }
    }

    getConnectionStateBadgeClass(state) {
        console.log('Connection state received:', state); // Debug log
        switch (state.toLowerCase()) {
            case 'established':
                return 'bg-success';
            case 'listen':
                return 'bg-info';
            case 'time_wait':
                return 'bg-warning';
            case 'close_wait':
                return 'bg-danger';
            default:
                console.log('Unknown connection state, using bg-secondary:', state); // Debug log
                return 'bg-secondary';
        }
    }
}

// Initialize the system monitor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const monitor = new SystemMonitor();

    // Add page load animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';

    // Show content immediately
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // Add staggered animation to cards
    setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in-up');
        });
    }, 2000);
});
