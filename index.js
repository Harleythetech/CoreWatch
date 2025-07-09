const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const si = require('systeminformation');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        version: packageJson.version 
    });
});

// Load developer services configuration
let developerServices = [];
try {
    const configPath = path.join(__dirname, 'config', 'services.json');
    const serviceConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Flatten all service categories into a single array
    developerServices = Object.values(serviceConfig).flat();
} catch (error) {
    console.warn('Could not load developer services config, using fallback:', error.message);
    // Fallback to essential services
    developerServices = [
        'node', 'nodejs', 'pm2', 'docker', 'nginx', 'mysql', 'postgresql', 
        'mongodb', 'redis', 'pihole', 'pi-hole', 'plex', 'jellyfin'
    ];
}

// Function to get minimal system information (for ARM devices)
async function getMinimalSystemInfo() {
    try {
        // Only collect the absolute minimum
        const [
            cpu,
            mem,
            cpuTemperature
        ] = await Promise.all([
            si.currentLoad().catch(() => ({ currentLoad: 0, avgLoad: 0, cpus: [] })),
            si.mem().catch(() => ({ total: 0, used: 0, free: 0 })),
            si.cpuTemperature().catch(() => ({ main: 0 }))
        ]);

        // Super minimal processing
        return {
            cpu: {
                avgLoad: Math.round((cpu.currentLoad || cpu.avgLoad || 0) * 100) / 100,
                currentLoad: Math.round((cpu.currentLoad || cpu.avgLoad || 0) * 100) / 100,
                temperature: cpuTemperature.main || 0,
                cores: (cpu.cpus || []).map((core, index) => ({
                    core: index,
                    load: Math.round((core?.load || 0) * 100) / 100
                })),
                speed: { avg: 0 }
            },
            memory: {
                total: Math.round((mem.total || 0) / 1024 / 1024 / 1024 * 100) / 100,
                used: Math.round((mem.used || 0) / 1024 / 1024 / 1024 * 100) / 100,
                free: Math.round((mem.free || 0) / 1024 / 1024 / 1024 * 100) / 100,
                available: Math.round((mem.available || 0) / 1024 / 1024 / 1024 * 100) / 100,
                cached: Math.round((mem.cached || 0) / 1024 / 1024 / 1024 * 100) / 100, // Add this line
                usedPercent: Math.round(((mem.used || 0) / (mem.total || 1)) * 100 * 100) / 100 || 0,
                swapUsedPercent: (mem.swaptotal || 0) > 0 ? Math.round(((mem.swapused || 0) / (mem.swaptotal || 1)) * 100 * 100) / 100 : 0,
                swapTotal: Math.round((mem.swaptotal || 0) / 1024 / 1024 / 1024 * 100) / 100,
                swapUsed: Math.round((mem.swapused || 0) / 1024 / 1024 / 1024 * 100) / 100,
                swapFree: Math.round((mem.swapfree || 0) / 1024 / 1024 / 1024 * 100) / 100
            }
        };
    } catch (error) {
        return {
            cpu: { 
                avgLoad: 0, 
                currentLoad: 0, 
                temperature: 0, 
                cores: [], 
                speed: { avg: 0 } 
            },
            memory: { 
                total: 0, 
                used: 0, 
                free: 0, 
                available: 0, 
                cached: 0, // Add this line
                usedPercent: 0, 
                swapUsedPercent: 0,
                swapTotal: 0,
                swapUsed: 0,
                swapFree: 0
            }
        };
    }
}


// Function to get system information with optimizations for ARM
async function getSystemInfo() {
    try {
        // Use Promise.race with a timeout to prevent hanging
        const promiseWithTimeout = (prom, time) => {
            let timer;
            return Promise.race([
                prom,
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Timeout')), time);
                })
            ]).finally(() => clearTimeout(timer));
        };
        
        // Collect data with a strict 5 second timeout for each call
        
        // Try to get temperature with multiple methods for ARM
        let tempData = { main: 0 };
        try {
            tempData = await si.cpuTemperature();
            
            // On some ARM devices, we might need to try alternative methods if main is 0
            if (tempData.main === 0 || !tempData.main) {
                // For Raspberry Pi, we could try the specific command
                const { exec } = require('child_process');
                exec('/opt/vc/bin/vcgencmd measure_temp', (err, stdout) => {
                    if (!err) {
                        const match = stdout.match(/temp=(\d+\.\d+)/);
                        if (match) {
                            tempData.main = parseFloat(match[1]);
                        }
                    }
                });
            }
        } catch (e) {
            tempData = { main: 0 };
        }
        
        // Get CPU speed directly if systeminformation fails
        let cpuRealSpeed = 0;
        try {
            const { exec } = require('child_process');
            if (process.platform === 'linux') {
                // Try to get CPU speed directly from /proc/cpuinfo on Linux
                exec('cat /proc/cpuinfo | grep "cpu MHz" | head -1 | awk \'{print $4}\'', (err, stdout) => {
                    if (!err && stdout) {
                        cpuRealSpeed = parseInt(stdout.trim());
                    }
                });
            } else if (process.platform === 'win32') {
                // On Windows, try using wmic
                exec('wmic cpu get CurrentClockSpeed', (err, stdout) => {
                    if (!err && stdout) {
                        const match = stdout.match(/(\d+)/);
                        if (match) {
                            cpuRealSpeed = parseInt(match[1]);
                        }
                    }
                });
            }
        } catch (e) {
            cpuRealSpeed = 0;
        }

        // First, collect the essential data that rarely fails
        const [
            cpu,
            cpuCurrentSpeed,
            cpuTemperature,
            mem,
            processes,
            osInfo,
            timeInfo,
            networkInterfaces,
            networkStats,
            networkConnections
        ] = await Promise.all([
            // Basic metrics with simplified error handling
            promiseWithTimeout(si.currentLoad().catch(() => ({ currentLoad: 0, avgLoad: 0, cpus: [] })), 5000),
            promiseWithTimeout(si.cpuCurrentSpeed().catch(() => ({ avg: 0, cores: [] })), 5000),
            Promise.resolve(tempData), // Use our pre-fetched temperature
            promiseWithTimeout(si.mem().catch(() => ({ total: 0, used: 0, free: 0 })), 5000),
            
            // Expensive calls with strict limits and error handling
            promiseWithTimeout(si.processes().then(procs => ({
                ...procs, 
                list: (procs.list || []).slice(0, 10).map(p => ({ 
                    pid: p.pid, 
                    name: p.name, 
                    cpu: p.cpu, 
                    memory: p.memory,
                    state: p.state
                }))
            })).catch(() => ({ all: 0, running: 0, list: [] })), 5000),
            
            // System info - Fix this line
            promiseWithTimeout(si.osInfo().catch(() => ({ hostname: 'Unknown', platform: 'Unknown', kernel: 'Unknown', arch: 'Unknown', uptime: 0 })), 5000),
            Promise.resolve((() => {
                try {
                    return si.time();
                } catch (e) {
                    return { uptime: 0 };
                }
            })()), // Fix: si.time() is synchronous, wrap it properly
            
            // Network data
            promiseWithTimeout(si.networkInterfaces().catch(() => ([])), 5000),
            promiseWithTimeout(si.networkStats().catch(() => ([])), 5000),
            promiseWithTimeout(si.networkConnections().then(conns => conns.slice(0, 10)).catch(() => ([])), 5000)
        ]);

        // Now try to get the problematic data separately with better error handling
        let fsSize = [];
        let users = [];
        let services = [];

        // Storage data - handle separately with longer timeout
        try {
            fsSize = await promiseWithTimeout(
                si.fsSize().catch(() => []), 
                8000 // Longer timeout for storage
            );
        } catch (error) {
            console.warn('Storage data collection failed:', error.message);
            fsSize = [];
        }

        // Users data - handle separately
        try {
            users = await promiseWithTimeout(
                si.users().catch(() => []), 
                3000
            );
        } catch (error) {
            console.warn('Users data collection failed:', error.message);
            users = [];
        }

        // Services data - handle separately with better filtering
        try {
            const allServices = await promiseWithTimeout(
                si.services('*').catch(() => []), 
                8000 // Longer timeout for services
            );
            
            // Filter services more efficiently
            services = (allServices || [])
                .filter(service => {
                    if (!service || !service.name) return false;
                    
                    const serviceName = service.name.toLowerCase();
                    return developerServices.some(devService => 
                        serviceName.includes(devService.toLowerCase()) || 
                        serviceName.startsWith(devService.toLowerCase())
                    );
                })
                .slice(0, 20);
                
        } catch (error) {
            console.warn('Services data collection failed:', error.message);
            services = [];
        }

        const cpuCores = (cpu.cpus || []).map((core, index) => {
            let coreSpeed = 0;
            if (cpuCurrentSpeed.cores && cpuCurrentSpeed.cores[index]) {
                coreSpeed = Math.round(cpuCurrentSpeed.cores[index] * 1000);
            } else if (cpuRealSpeed > 0) {
                coreSpeed = cpuRealSpeed;
            } else {
                coreSpeed = Math.round((cpuCurrentSpeed.avg || 0) * 1000);
            }
            
            return {
                core: index,
                load: Math.round((core?.load || 0) * 100) / 100,
                speed: coreSpeed
            };
        });

        // Enhanced memory data with cache and buffers - simplified
        const memory = {
            total: Math.round((mem.total || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            used: Math.round((mem.used || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            free: Math.round((mem.free || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            available: Math.round((mem.available || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            cached: Math.round((mem.cached || 0) / 1024 / 1024 / 1024 * 100) / 100,
            usedPercent: Math.round(((mem.used || 0) / (mem.total || 1)) * 100 * 100) / 100,
            swapTotal: Math.round((mem.swaptotal || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            swapUsed: Math.round((mem.swapused || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            swapFree: Math.round((mem.swapfree || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
            swapUsedPercent: (mem.swaptotal || 0) > 0 ? Math.round(((mem.swapused || 0) / (mem.swaptotal || 1)) * 100 * 100) / 100 : 0
        };

        // Enhanced storage data - simplified
        const storage = (fsSize || []).map(fs => {
            return {
                fs: fs.fs,
                type: fs.type,
                mount: fs.mount,
                size: Math.round((fs.size || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
                used: Math.round((fs.used || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
                available: Math.round((fs.available || 0) / 1024 / 1024 / 1024 * 100) / 100, // GB
                use: Math.round((fs.use || 0) * 100) / 100
            };
        });

        // Enhanced process data - highly simplified
        const allProcesses = (processes.list || []);
        const topProcesses = allProcesses.slice(0, 10).map(proc => {
            
            // Better state mapping for Windows systems
            let processState = proc.state || proc.status || 'unknown';
            
            // If state is 'unknown', try to infer from other properties
            if (processState === 'unknown') {
                if (proc.cpu && proc.cpu > 0) {
                    processState = 'running';
                } else if (proc.pid === 0) {
                    processState = 'system'; // System Idle Process
                } else {
                    processState = 'sleeping'; // Most processes are idle/sleeping
                }
            }
            
            return {
                pid: proc.pid,
                name: proc.name,
                cpu: Math.round((proc.cpu || 0) * 100) / 100,
                memory: Math.round((proc.memory || 0) * 100) / 100,
                state: processState
            };
        });

        // Count processes by their actual inferred states
        const runningCount = allProcesses.filter(proc => {
            let state = proc.state || proc.status || 'unknown';
            if (state === 'unknown') {
                if (proc.cpu && proc.cpu > 0) state = 'running';
                else if (proc.pid === 0) state = 'system';
                else state = 'sleeping';
            }
            return state === 'running';
        }).length;

        const sleepingCount = allProcesses.filter(proc => {
            let state = proc.state || proc.status || 'unknown';
            if (state === 'unknown') {
                if (proc.cpu && proc.cpu > 0) state = 'running';
                else if (proc.pid === 0) state = 'system';
                else state = 'sleeping';
            }
            return state === 'sleeping' || state === 'system';
        }).length;

        const zombieCount = allProcesses.filter(proc => {
            let state = proc.state || proc.status || 'unknown';
            return state === 'zombie' || state === 'z';
        }).length;

        const processStats = {
            all: processes.all || allProcesses.length,
            running: runningCount,
            sleeping: sleepingCount,
            zombie: zombieCount,
            top: topProcesses
        };

        // Network interfaces with detailed info - show all interfaces
        const networkInterfacesData = (networkInterfaces || []).map(iface => ({
            iface: iface.iface || 'Unknown',
            ip4: iface.ip4 || '',
            ip6: iface.ip6 || '', // Add IPv6 support
            mac: iface.mac || '',
            operstate: iface.operstate || 'unknown',
            speed: iface.speed || 0,
            type: iface.type || 'unknown'
        }));

        // Network statistics - show all stats
        const networkStatsData = (networkStats || []).map(stat => ({
            iface: stat.iface || 'Unknown',
            operstate: stat.operstate || 'unknown',
            rx_bytes: Math.round((stat.rx_bytes || 0) / 1024 / 1024 * 100) / 100, // MB
            tx_bytes: Math.round((stat.tx_bytes || 0) / 1024 / 1024 * 100) / 100, // MB
            rx_sec: Math.round((stat.rx_sec || 0) / 1024 * 100) / 100, // KB/s
            tx_sec: Math.round((stat.tx_sec || 0) / 1024 * 100) / 100, // KB/s
            rx_errors: stat.rx_errors || 0,
            tx_errors: stat.tx_errors || 0
        }));

        // Active connections - highly simplified
        const activeConnections = (networkConnections || []).slice(0, 5).map(conn => ({
            protocol: conn.protocol || 'unknown',
            localAddress: conn.localAddress || '',
            localPort: conn.localPort || '',
            peerAddress: conn.peerAddress || '',
            peerPort: conn.peerPort || '',
            state: conn.state || 'unknown',
            process: conn.process || ''
        }));

        // Enhanced system info - simplified
        const systemInfo = {
            hostname: (osInfo.hostname || 'Unknown'),
            platform: (osInfo.platform || 'Unknown'),
            distro: (osInfo.distro || 'Unknown'),
            kernel: (osInfo.kernel || 'Unknown'),
            arch: (osInfo.arch || 'Unknown'),
            uptime: formatUptime(timeInfo.uptime || osInfo.uptime || 0),
            release: osInfo.release || 'Unknown',
            bootTime: timeInfo.uptime ? new Date(Date.now() - (timeInfo.uptime * 1000)).toLocaleString() : 
                      (osInfo.uptime ? new Date(Date.now() - (osInfo.uptime * 1000)).toLocaleString() : 'Unknown')
        };

        // System users
        const loggedUsers = (users || []).map(user => ({
            user: user.user || 'unknown',
            tty: user.tty || '',
            date: user.date || '',
            time: user.time || '',
            ip: user.ip || '',
            command: user.command || ''
        }));

        // Services health (filtered for developer/tech enthusiast services)
        const serviceHealth = (services || []).map(service => ({
            name: service.name || 'Unknown',
            running: service.running || false,
            startmode: service.startmode || 'Unknown',
            pids: service.pids || [],
            cpu: service.cpu || 0,
            mem: service.mem || 0
        }));

        return {
            cpu: {
                cores: cpuCores,
                avgLoad: Math.round((cpu.currentLoad || cpu.avgLoad || 0) * 100) / 100,
                currentLoad: Math.round((cpu.currentLoad || 0) * 100) / 100,
                temperature: cpuTemperature.main || 0,
                speed: {
                    avg: cpuRealSpeed > 0 ? cpuRealSpeed : Math.round((cpuCurrentSpeed.avg || 0) * 1000)
                }
            },
            memory,
            storage,
            processes: processStats,
            network: {
                interfaces: networkInterfacesData,
                stats: networkStatsData,
                connections: activeConnections
            },
            users: loggedUsers,
            services: serviceHealth,
            systemInfo
        };
    } catch (error) {
        console.error('Error in getSystemInfo:', error);
        // Return a complete object with all expected fields
        return {
            cpu: { 
                cores: [], 
                avgLoad: 0, 
                currentLoad: 0, 
                temperature: 0, 
                speed: { avg: 0 } 
            },
            memory: { 
                total: 0,
                used: 0,
                free: 0,
                available: 0,
                cached: 0,
                usedPercent: 0, 
                swapUsedPercent: 0,
                swapTotal: 0,
                swapUsed: 0,
                swapFree: 0
            },
            storage: [],
            processes: { 
                all: 0, 
                running: 0, 
                sleeping: 0, 
                zombie: 0, 
                top: [] 
            },
            network: { 
                interfaces: [], 
                stats: [], 
                connections: [] 
            },
            users: [],
            services: [],
            systemInfo: { 
                hostname: 'Error', 
                platform: 'Unknown', 
                distro: 'Unknown',
                kernel: 'Unknown', 
                arch: 'Unknown',
                uptime: '0m', 
                bootTime: 'Unknown',
                release: 'Unknown'
            }
        };
    }
}

// Helper function to format uptime
function formatUptime(seconds) {
    // Ensure seconds is a number
    seconds = Number(seconds) || 0;
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes || 1}m`;  // Show at least 1m even if it's 0
    }
}

// Socket.io connection
io.on('connection', (socket) => {
    
    // Send full data immediately on initial load
    getSystemInfo().then(data => {
        if (data) {
            socket.emit('systemData', data);
        }
    }).catch(error => {
        console.error('Error getting initial system data:', error);
        // Fallback to minimal data if full data fails
        getMinimalSystemInfo().then(fallbackData => {
            if (fallbackData) {
                console.warn('[WARN] Sending fallback minimal data on initial load');
                socket.emit('systemData', fallbackData);
            }
        });
    });

    // Add socket event handler for manual refresh
    socket.on('requestUpdate', async () => {
        try {
            const data = await getSystemInfo();
            if (data) {
                socket.emit('systemData', data);
            }
        } catch (error) {
            console.error('Error on manual refresh:', error);
        }
    });
    
    // Set up periodic updates - simplified to 1 minute intervals only
    const updateInterval = 60000; // 1 minute for all updates
    
    const interval = setInterval(async () => {
        try {
            // Always send full data every minute
            const data = await getSystemInfo();
            
            if (data) {
                socket.emit('systemData', data);
            }
            
        } catch (error) {
            console.error('Error in periodic update:', error);
            // Try fallback to minimal data if full data fails
            try {
                const fallbackData = await getMinimalSystemInfo();
                if (fallbackData) {
                    socket.emit('systemData', fallbackData);
                }
            } catch (fallbackError) {
                console.error('Error in fallback update:', fallbackError);
            }
        }
    }, updateInterval);
    
    socket.on('disconnect', () => {
        clearInterval(interval);
    });
});

server.listen(PORT, () => {
    console.log(`
  /$$$$$$   /$$$$$$  /$$$$$$$  /$$$$$$$$ /$$      /$$  /$$$$$$  /$$$$$$$$ /$$$$$$  /$$   /$$
 /$$__  $$ /$$__  $$| $$__  $$| $$_____/| $$  /$ | $$ /$$__  $$|__  $$__//$$__  $$| $$  | $$
| $$  \\__/| $$  \\ $$| $$  \\ $$| $$      | $$ /$$$| $$| $$  \\ $$   | $$  | $$  \\__/| $$  | $$
| $$      | $$  | $$| $$$$$$$/| $$$$$   | $$/$$ $$ $$| $$$$$$$$   | $$  | $$      | $$$$$$$$
| $$      | $$  | $$| $$__  $$| $$__/   | $$$$_  $$$$| $$__  $$   | $$  | $$      | $$__  $$
| $$    $$| $$  | $$| $$  \\ $$| $$      | $$$/ \\  $$$| $$  | $$   | $$  | $$    $$| $$  | $$
|  $$$$$$/|  $$$$$$/| $$  | $$| $$$$$$$$| $$/   \\  $$| $$  | $$   | $$  |  $$$$$$/| $$  | $$
 \\______/  \\______/ |__/  |__/|________/|__/     \\__/|__/  |__/   |__/   \\______/ |__/  |__/
                                                                                             `);
    console.log(`🚀 CoreWatch Server Status:`);
    console.log(`   └─ Server running on http://localhost:${PORT}`);
    console.log(`   └─ Version: ${packageJson.version}`);
    console.log(`   └─ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   └─ Platform: ${process.platform} (${process.arch})`);
    console.log(`   └─ Node.js: ${process.version}`);
    console.log(`   └─ Ready for connections! 🌟\n`);
});