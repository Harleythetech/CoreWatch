
<p align="center"><img src="https://github.com/user-attachments/assets/e01328ef-b25d-4d03-8642-b219525a2fe9" width="200" height="200"></p>

### <p align="center">CoreWatch - System monitoring reimagined</p>

A comprehensive system monitor web GUI built with Node.js, Express, EJS, and Bootstrap. Monitor your system's performance in real-time through a responsive web interface.

## Features

- **Per-core CPU Usage & Frequencies**: Real-time monitoring of each CPU core with load percentages and current frequencies
- **Memory Management**: RAM and swap usage with visual progress bars and detailed statistics
- **CPU Temperature**: Live CPU temperature monitoring (when available)
- **Storage Usage**: Monitor all mounted drives with usage statistics and available space
- **Process Monitoring**: Top 15 processes by CPU usage with PID, name, CPU%, and memory%
- **System Information**: Hostname, OS, kernel version, architecture, platform, and uptime
- **Auto-refresh**: Data updates every 5 seconds automatically
- **Responsive Design**: Bootstrap-based UI that works on desktop and mobile
- **Dark/Light Mode**: Toggle between dark and light themes with persistent settings
- **Real-time Updates**: Uses Socket.io for efficient real-time data streaming

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating, Bootstrap 5, Socket.io
- **System Info**: systeminformation library
- **Icons**: Bootstrap Icons

## Installation

1. **Clone or download** this repository to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
CoreWatch/
├── index.js                 # Main server file
├── package.json             # Project dependencies
├── views/
│   └── index.ejs           # Main template file
└── public/
    ├── css/
    │   └── style.css       # Custom styles
    └── js/
        └── app.js          # Client-side JavaScript
```

## Configuration

- **Port**: Default port is 3001. Set `PORT` environment variable to change:
  ```bash
  PORT=3001 npm star
  ```

- **Update Interval**: Data refreshes every 5 seconds. Modify the interval in `index.js`:
  ```javascript
  // Change 5000 to desired milliseconds
  }, 5000);
  ```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Features Overview

### CPU Monitoring
- Individual core usage percentages
- Core frequencies in MHz
- Average CPU load
- CPU temperature (when supported by hardware)

### Memory Monitoring
- RAM usage with visual progress bars
- Total, used, and free RAM in GB
- Swap memory usage and statistics
- Percentage-based usage indicators

### Storage Monitoring
- All mounted filesystems
- Usage percentages with color-coded progress bars
- Total, used, and available space in GB
- Filesystem types

### Process Monitoring
- Top 15 processes by CPU usage
- Process ID (PID)
- Process names
- CPU usage percentages
- Memory usage percentages

### System Information
- Hostname
- Operating system and distribution
- Kernel version
- System architecture
- Platform information
- System uptime

## Customization

### Themes
The application supports dark and light modes. Users can toggle between themes using the switch in the navigation bar. The preference is saved in localStorage.

### Styling
Modify `public/css/style.css` to customize the appearance. The application uses Bootstrap 5 variables and classes for easy theming.

### Data Sources
The system information is gathered using the `systeminformation` library, which provides cross-platform system data for Windows, macOS, and Linux.

## Performance Notes

- The application is optimized for minimal system impact
- Data collection occurs server-side to reduce client load
- Socket.io provides efficient real-time updates
- Progress bars and animations use CSS transitions for smooth updates

## Troubleshooting

### Common Issues

1. **Permission errors on some system data**: Some system information may require elevated privileges on certain systems.

2. **CPU temperature not showing**: CPU temperature monitoring depends on hardware sensors and may not be available on all systems.

3. **High memory usage**: The systeminformation library needs to access various system APIs, which may show higher memory usage in the process list.

### Dependencies

Make sure all npm dependencies are installed:
```bash
npm install express ejs systeminformation socket.io
```

For development:
```bash
npm install nodemon --save-dev
```

## License

MIT License - Feel free to modify and distribute as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
