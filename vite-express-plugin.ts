// vite-express-plugin.ts
import { Plugin } from 'vite';
import { spawn, ChildProcess } from 'child_process';

/**
 * Vite plugin to start an Express server alongside the Vite dev server
 * @returns A Vite plugin that starts and stops the Express server
 */
export default function expressPlugin(): Plugin {
  let serverProcess: ChildProcess | null = null;

  return {
    name: 'vite-plugin-express',
    apply: 'serve', // Only apply this plugin during development

    configureServer(server) {
      // Start the Express server when Vite starts
      server.httpServer?.once('listening', () => {
        console.log('🚀 Starting Express server...');

        // First, check if the port is already in use
        const checkPortProcess = spawn(
          'npx',
          ['kill-port', '3000'],
          {
            stdio: 'inherit',
            shell: true
          }
        );

        // Wait for the port check to complete
        checkPortProcess.on('exit', () => {
          // Start the Express server using ts-node
          serverProcess = spawn(
            'npx',
            ['ts-node', '--project', 'tsconfig.node.json', 'server.ts'],
            {
              stdio: 'inherit',
              shell: true,
              env: { ...process.env, NODE_ENV: 'development' }
            }
          );

          // Log when the server exits
          serverProcess?.on('exit', (code) => {
            console.log(`Express server exited with code ${code}`);
          });

          // Log any errors
          serverProcess?.on('error', (err) => {
            console.error('Failed to start Express server:', err);
          });
        });
      });
    },

    // This hook is called when Vite is closed
    closeBundle() {
      this.closeServer();
    },

    // This hook is called when Vite is closed in dev mode
    buildEnd() {
      this.closeServer();
    },

    // Custom method to close the server
    closeServer() {
      if (serverProcess) {
        console.log('Stopping Express server...');

        // On Windows, we need to use a different approach to kill the process
        if (process.platform === 'win32') {
          try {
            spawn('taskkill', ['/pid', serverProcess.pid?.toString() || '0', '/f', '/t'], {
              stdio: 'inherit',
              shell: true
            });
          } catch (err) {
            console.error('Error killing Express server process:', err);
          }
        } else {
          serverProcess.kill();
        }

        serverProcess = null;
      }
    }
  };
}
