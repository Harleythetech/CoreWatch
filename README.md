<p align="center"><img src="https://github.com/user-attachments/assets/e01328ef-b25d-4d03-8642-b219525a2fe9" width="200" height="200"></p>

### <p align="center">CoreWatch - System monitoring reimagined</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.1.0--build.2--release-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-red?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey?style=for-the-badge" alt="Platform">
</p>

A comprehensive, modern system monitoring web application built with Node.js, Express, EJS, and Bootstrap 5. Monitor your system's performance in real-time through a beautiful, responsive web interface with professional-grade features.

## ✨ Features

### 🖥️ **System Monitoring**
- **Real-time CPU Metrics**: Per-core usage, frequencies, temperatures, and load averages
- **Advanced Memory Management**: RAM, swap, cache, and buffer monitoring with detailed statistics
- **Intelligent Storage Monitoring**: All mounted drives with usage analytics and filesystem details
- **Process Management**: Top processes with CPU/memory usage, state monitoring, and PID tracking
- **Network Intelligence**: Interface monitoring with IPv4/IPv6 support, statistics, and active connections

### 🎨 **Modern Interface**
- **Responsive Design**: Bootstrap 5.3.0 with mobile-first approach
- **Dark/Light Themes**: Seamless theme switching with persistent preferences
- **Real-time Updates**: Socket.io powered live data streaming
- **Interactive Dashboard**: Tabbed navigation, progress bars, and metric cards
- **Professional UI**: Clean, modern design with Bootstrap Icons

### 🔧 **Developer Features**
- **Developer Service Filtering**: Focus on tech-relevant services (Node.js, Docker, PM2, databases)
- **IPv6 Network Support**: Complete network interface monitoring including IPv6 addresses
- **Dynamic Versioning**: Automatic version display from package.json
- **Performance Optimized**: ARM device compatibility with fallback mechanisms

### 🚀 **Production Ready**
- **PM2 Ecosystem**: Complete process management configuration
- **Health Monitoring**: System status indicators and uptime tracking
- **Logging System**: Structured logging with rotation support
- **Quick Actions**: FAB menu with refresh, fullscreen, and export options

## 🛠️ Technologies Used

- **Backend**: Node.js 16+, Express.js 4.18+
- **Frontend**: EJS templating, Bootstrap 5.3.0, Socket.io 4.7+
- **System Monitoring**: systeminformation 5.21+
- **Process Management**: PM2 5.3+
- **Icons**: Bootstrap Icons 1.10+
- **Development**: Nodemon for hot-reload

## 📦 Installation

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Harleythetech/CoreWatch.git
   cd CoreWatch
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3001
   ```

### Development Mode

For development with auto-restart:
```bash
npm run dev
```

### Production Deployment

For production with PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run pm2:start:prod

# Monitor the application
npm run pm2:monit
```

## 🏗️ Project Structure

```
CoreWatch/
├── index.js                    # Main server with ASCII banner
├── package.json                # Dependencies and PM2 scripts
├── ecosystem.config.js         # PM2 configuration
├── pm2-setup.sh/.ps1          # PM2 setup scripts
├── views/
│   └── index.ejs              # Modern responsive template
├── public/
│   ├── css/
│   │   └── style.css          # Enhanced custom styles
│   ├── js/
│   │   └── app.js             # Real-time frontend logic
│   └── assets/
│       ├── favicon.ico        # Favicon
│       └── cpu.png           # Logo
├── config/
│   └── services.json         # Developer services configuration
└── logs/                     # PM2 log directory
    └── .gitkeep
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001                      # Server port (default: 3001)
NODE_ENV=production           # Environment mode

# CoreWatch Specific
COREWATCH_UPDATE_INTERVAL=60000    # Update interval in ms (default: 1 minute)
COREWATCH_MAX_PROCESSES=50         # Max processes to display
COREWATCH_MAX_CONNECTIONS=100      # Max network connections to show
```

### PM2 Scripts

```bash
npm run pm2:start              # Start with default config
npm run pm2:start:prod         # Start in production mode
npm run pm2:start:dev          # Start with file watching
npm run pm2:stop               # Stop the application
npm run pm2:restart            # Restart the application
npm run pm2:reload             # Zero-downtime reload
npm run pm2:logs               # View logs
npm run pm2:monit              # Open monitoring dashboard
npm run pm2:status             # Check status
```

### Service Filtering

Configure developer-focused services in `config/services.json`:
```json
{
  "development": ["node", "nodejs", "pm2", "docker"],
  "databases": ["mysql", "postgresql", "mongodb", "redis"],
  "webservers": ["nginx", "apache", "httpd"],
  "media": ["plex", "jellyfin", "pihole"]
}
```

## 🌐 Browser Compatibility

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## 📊 Features Overview

### 🔥 CPU Monitoring
- Individual core usage with real-time percentages
- Core frequencies and speed monitoring
- CPU temperature tracking (hardware dependent)
- Load averages and performance metrics
- ARM device optimization

### 💾 Memory Management
- RAM usage with visual progress indicators
- Swap memory monitoring and statistics
- Cache and buffer memory tracking
- Detailed memory breakdown in GB
- Percentage-based usage with color coding

### 💿 Storage Analytics
- All mounted filesystems detection
- Usage percentages with dynamic progress bars
- Total, used, and available space in GB
- Filesystem type identification
- Mount point information

### ⚡ Process Intelligence
- Top processes by CPU and memory usage
- Process state monitoring (running, sleeping, zombie)
- PID tracking and process naming
- Windows-specific process state handling
- Real-time process statistics

### 🌐 Network Monitoring
- Network interface detection (IPv4 + IPv6)
- Interface statistics and operstate
- Data transfer rates (RX/TX)
- Active network connections
- Protocol and port monitoring

### 📋 System Information
- Comprehensive system details
- Hostname, OS, and kernel information
- Architecture and platform detection
- System uptime and boot time
- User session monitoring

### 🎛️ Service Management
- Developer-focused service filtering
- Service health monitoring
- Running status and resource usage
- Configurable service categories

## 🎨 Customization

### Theme System
- **Dark Mode**: Professional dark theme with blue accents
- **Light Mode**: Clean light theme with proper contrast
- **Theme Persistence**: localStorage saves user preference
- **Automatic Detection**: Respects system theme preference

### UI Components
- **Metric Cards**: Hover effects and smooth animations
- **Progress Bars**: Color-coded based on usage levels
- **Tables**: Responsive with Bootstrap styling
- **Navigation**: Tab-based interface for different metrics

### Styling
Customize appearance by modifying `public/css/style.css`:
- CSS custom properties for easy theming
- Bootstrap 5 utility classes
- Responsive breakpoints
- Custom animations and transitions

## 🚨 Performance & Compatibility

### Optimization Features
- **ARM Device Support**: Optimized for Raspberry Pi and similar devices
- **Timeout Protection**: Prevents hanging on slow systems
- **Fallback Mechanisms**: Minimal data mode for resource-constrained devices
- **Efficient Updates**: Smart data collection with 1-minute intervals
- **Memory Management**: Automatic restart at 1GB usage (PM2)

### System Requirements
- **Node.js**: 16.0.0 or higher
- **RAM**: 256MB minimum (512MB recommended)
- **Storage**: 100MB for installation
- **Network**: HTTP port access (default: 3001)

## 🐛 Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Linux/macOS: Run with appropriate permissions
   sudo npm start
   
   # Windows: Run PowerShell as Administrator
   ```

2. **CPU Temperature Not Available**
   - Hardware/driver dependent feature
   - Works best on Linux with proper sensor support
   - Some ARM devices may require additional configuration

3. **High Memory Usage**
   - Normal for system monitoring applications
   - PM2 automatically restarts at 1GB usage
   - Optimize by reducing update frequency

4. **Network Interface Issues**
   - Some virtual interfaces may not display correctly
   - IPv6 support depends on system configuration
   - Use `npm run pm2:logs` to debug network detection

### Debug Mode
Enable detailed logging:
```bash
NODE_ENV=development npm start
```

### PM2 Monitoring
Monitor application health:
```bash
pm2 monit          # Real-time monitoring
pm2 logs corewatch # Application logs
pm2 describe corewatch # Detailed process info
```

## 📜 License

**AGPL-3.0-only** - This project is licensed under the GNU Affero General Public License v3.0. See the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on multiple platforms when possible
- Update documentation for new features

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Harleythetech/CoreWatch/issues)
- **Security**: [Security Policy](https://github.com/Harleythetech/CoreWatch/security)
- **Discussions**: [GitHub Discussions](https://github.com/Harleythetech/CoreWatch/discussions)

## 🙏 Acknowledgments

- **systeminformation**: Comprehensive system information library
- **Bootstrap**: Modern responsive framework
- **Socket.io**: Real-time communication
- **PM2**: Production process management
- **Node.js Community**: Excellent ecosystem support

---

<p align="center">
  <strong>Made with ❤️ by <a href="https://github.com/Harleythetech">Harleythetech</a></strong>
</p>

<p align="center">
  <em>System monitoring reimagined for the modern web</em>
</p>
