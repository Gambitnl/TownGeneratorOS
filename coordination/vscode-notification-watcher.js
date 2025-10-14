#!/usr/bin/env node

/**
 * VSCode Notification Watcher
 * Watches for notification files and creates user prompts
 *
 * This runs in the background and creates interactive prompts when:
 * - Claude is @mentioned in a thread
 * - Claude is the last active agent
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class VSCodeNotificationWatcher {
    constructor() {
        this.notificationsDir = './notifications';
        this.processedDir = './notifications/processed';
        this.watchInterval = 2000; // Check every 2 seconds
        this.processedFiles = new Set();
    }

    start() {
        console.log('\n👁️  VSCode Notification Watcher Starting...');
        console.log('═'.repeat(60));
        console.log(`Watching: ${path.resolve(this.notificationsDir)}`);
        console.log(`Check interval: ${this.watchInterval / 1000}s`);
        console.log('═'.repeat(60) + '\n');

        // Ensure directories exist
        if (!fs.existsSync(this.notificationsDir)) {
            fs.mkdirSync(this.notificationsDir, { recursive: true });
        }
        if (!fs.existsSync(this.processedDir)) {
            fs.mkdirSync(this.processedDir, { recursive: true });
        }

        // Start watching
        this.watch();

        // Handle shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    watch() {
        setInterval(() => {
            this.checkForNotifications();
        }, this.watchInterval);

        // Initial check
        this.checkForNotifications();
    }

    checkForNotifications() {
        try {
            const files = fs.readdirSync(this.notificationsDir)
                .filter(f => f.endsWith('.json') && !this.processedFiles.has(f))
                .sort(); // Process in chronological order

            for (const file of files) {
                this.processNotification(file);
            }
        } catch (error) {
            // Ignore errors (directory might not exist yet)
        }
    }

    async processNotification(filename) {
        const filePath = path.join(this.notificationsDir, filename);

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const notification = JSON.parse(data);

            // Mark as processed
            this.processedFiles.add(filename);

            // Show notification based on type
            if (notification.type === 'mention') {
                await this.showMentionPrompt(notification);
            } else if (notification.type === 'last_active') {
                await this.showLastActivePrompt(notification);
            }

            // Move to processed folder
            const processedPath = path.join(this.processedDir, filename);
            fs.renameSync(filePath, processedPath);

        } catch (error) {
            console.error(`Error processing ${filename}:`, error.message);
        }
    }

    async showMentionPrompt(notification) {
        console.log('\n' + '═'.repeat(70));
        console.log('🔔 NEW NOTIFICATION');
        console.log('═'.repeat(70));
        console.log(`\n📨 ${notification.title}\n`);
        console.log(notification.message);
        console.log('\n' + '─'.repeat(70));
        console.log(`\nSuggested action: ${notification.action}`);
        console.log('\n' + '═'.repeat(70));

        const response = await this.prompt(
            '\nWhat would you like to do?\n' +
            '  [1] View thread\n' +
            '  [2] Ignore for now\n' +
            '  [3] Open in VSCode\n' +
            'Choice: '
        );

        switch (response.trim()) {
            case '1':
                this.executeCommand(notification.action);
                break;
            case '3':
                console.log(`\n💡 To respond, run:`);
                console.log(`   cd coordination`);
                console.log(`   ${notification.action}`);
                console.log(`   # Then use contributeToThread() to respond\n`);
                break;
            default:
                console.log('\n✓ Notification acknowledged\n');
        }
    }

    async showLastActivePrompt(notification) {
        console.log('\n' + '═'.repeat(70));
        console.log('🚨 COORDINATION ALERT');
        console.log('═'.repeat(70));
        console.log(`\n${notification.title}\n`);
        console.log(notification.message);
        console.log('\n' + '─'.repeat(70));
        console.log(`\nInactive agents: ${notification.inactiveAgents.join(', ')}`);
        console.log('\n' + '═'.repeat(70));

        const response = await this.prompt(
            '\nWhat would you like to do?\n' +
            '  [1] Wake up inactive agents (run their sessions)\n' +
            '  [2] Continue alone\n' +
            '  [3] Remind me later\n' +
            'Choice: '
        );

        switch (response.trim()) {
            case '1':
                console.log('\n🔄 Waking up inactive agents...\n');
                for (const agent of notification.inactiveAgents) {
                    console.log(`Starting ${agent} session...`);
                    this.executeCommand(`npm run session -- ${agent}`);
                }
                break;
            case '2':
                console.log('\n✓ Continuing with Claude only\n');
                break;
            default:
                console.log('\n⏰ Will remind you in 5 minutes\n');
        }
    }

    executeCommand(command) {
        console.log(`\n▶ Executing: ${command}\n`);
        const { execSync } = require('child_process');
        try {
            execSync(command, { stdio: 'inherit', cwd: process.cwd() });
        } catch (error) {
            console.error(`Command failed: ${error.message}`);
        }
    }

    prompt(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    shutdown() {
        console.log('\n🛑 Shutting down notification watcher...\n');
        process.exit(0);
    }
}

// Start watcher if run directly
if (require.main === module) {
    const watcher = new VSCodeNotificationWatcher();
    watcher.start();
}

module.exports = VSCodeNotificationWatcher;
