#!/usr/bin/env python3
"""
Startup script for Rootzsu project on Render
Manages both web server and Telegram bot processes
"""

import os
import sys
import time
import signal
import logging
import threading
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('startup.log')
    ]
)
logger = logging.getLogger(__name__)

class ProcessManager:
    def __init__(self):
        self.processes = {}
        self.running = True
        self.restart_count = {}
        self.max_restarts = 5
        
    def start_process(self, name, command, cwd=None):
        """Start a process and monitor it"""
        try:
            logger.info(f"Starting {name}...")
            process = subprocess.Popen(
                command,
                shell=True,
                cwd=cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.processes[name] = process
            self.restart_count[name] = 0
            
            # Start output monitoring thread
            threading.Thread(
                target=self._monitor_output,
                args=(name, process),
                daemon=True
            ).start()
            
            logger.info(f"✅ {name} started with PID {process.pid}")
            return process
            
        except Exception as e:
            logger.error(f"❌ Failed to start {name}: {e}")
            return None
    
    def _monitor_output(self, name, process):
        """Monitor process output and log it"""
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    logger.info(f"[{name}] {line.strip()}")
        except Exception as e:
            logger.error(f"Error monitoring {name} output: {e}")
    
    def monitor_processes(self):
        """Monitor all processes and restart if needed"""
        while self.running:
            try:
                for name, process in list(self.processes.items()):
                    if process.poll() is not None:  # Process has terminated
                        logger.warning(f"⚠️ {name} has stopped (exit code: {process.returncode})")
                        
                        if self.restart_count[name] < self.max_restarts:
                            self.restart_count[name] += 1
                            logger.info(f"🔄 Restarting {name} (attempt {self.restart_count[name]}/{self.max_restarts})")
                            
                            # Restart based on process type
                            if name == "web_server":
                                self.start_process("web_server", "python server.py")
                            elif name == "telegram_bot":
                                self.start_process("telegram_bot", "python bot.py")
                        else:
                            logger.error(f"❌ {name} has failed too many times, not restarting")
                            del self.processes[name]
                
                time.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in process monitoring: {e}")
                time.sleep(5)
    
    def stop_all(self):
        """Stop all processes gracefully"""
        logger.info("🛑 Stopping all processes...")
        self.running = False
        
        for name, process in self.processes.items():
            try:
                logger.info(f"Stopping {name}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=10)
                    logger.info(f"✅ {name} stopped gracefully")
                except subprocess.TimeoutExpired:
                    logger.warning(f"⚠️ Force killing {name}")
                    process.kill()
                    process.wait()
                    
            except Exception as e:
                logger.error(f"Error stopping {name}: {e}")

def setup_environment():
    """Setup environment and check dependencies"""
    logger.info("🔧 Setting up environment...")
    
    # Check if we're on Render
    if os.getenv('RENDER'):
        logger.info("🌐 Running on Render platform")
    
    # Check Python version
    python_version = sys.version_info
    logger.info(f"🐍 Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check required files
    required_files = ['server.py', 'bot.py', 'requirements.txt']
    for file in required_files:
        if not Path(file).exists():
            logger.error(f"❌ Required file missing: {file}")
            return False
    
    # Create necessary directories
    os.makedirs('logs', exist_ok=True)
    os.makedirs('public', exist_ok=True)
    
    logger.info("✅ Environment setup complete")
    return True

def create_status_file():
    """Create status file for monitoring"""
    try:
        with open('bot_status.txt', 'w') as f:
            f.write(f"Bot started at {time.time()}")
        logger.info("📝 Status file created")
    except Exception as e:
        logger.error(f"Failed to create status file: {e}")

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"📡 Received signal {signum}, shutting down...")
    if 'manager' in globals():
        manager.stop_all()
    sys.exit(0)

def main():
    """Main startup function"""
    logger.info("🚀 Starting Rootzsu application...")
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Setup environment
    if not setup_environment():
        logger.error("❌ Environment setup failed")
        sys.exit(1)
    
    # Create status file
    create_status_file()
    
    # Initialize process manager
    global manager
    manager = ProcessManager()
    
    # Determine what to run based on environment
    if os.getenv('DYNO'):  # Heroku
        dyno_type = os.getenv('DYNO', '').split('.')[0]
        if dyno_type == 'web':
            manager.start_process("web_server", "python server.py")
        elif dyno_type == 'worker':
            manager.start_process("telegram_bot", "python bot.py")
    elif os.getenv('RENDER_SERVICE_TYPE'):  # Render
        service_type = os.getenv('RENDER_SERVICE_TYPE')
        if service_type == 'web':
            # On Render web service, run both server and bot
            manager.start_process("web_server", "python server.py")
            time.sleep(5)  # Give server time to start
            manager.start_process("telegram_bot", "python bot.py")
        else:
            # Background service - run bot only
            manager.start_process("telegram_bot", "python bot.py")
    else:
        # Local development - run both
        logger.info("🏠 Running in local development mode")
        manager.start_process("web_server", "python server.py")
        time.sleep(3)
        manager.start_process("telegram_bot", "python bot.py")
    
    # Start monitoring
    logger.info("👀 Starting process monitoring...")
    try:
        manager.monitor_processes()
    except KeyboardInterrupt:
        logger.info("⌨️ Keyboard interrupt received")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
    finally:
        manager.stop_all()
        logger.info("🏁 Shutdown complete")

if __name__ == "__main__":
    main()