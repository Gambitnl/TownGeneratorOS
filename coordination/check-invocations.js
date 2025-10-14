#!/usr/bin/env node

/**
 * Check Invocations
 * Helper script for Claude Code to check for pending agent invocations
 * Run this at the start of a Claude Code session to process queued tasks
 */

const fs = require('fs');
const path = require('path');

class InvocationChecker {
    constructor() {
        this.invocationsDir = path.join(__dirname, 'invocations');
    }

    async checkInvocations() {
        // Create directory if it doesn't exist
        if (!fs.existsSync(this.invocationsDir)) {
            console.log('📭 No invocations directory found - nothing to do');
            return [];
        }

        const files = fs.readdirSync(this.invocationsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
            console.log('📭 No pending invocations');
            return [];
        }

        console.log(`\n📬 Found ${jsonFiles.length} pending invocation(s)\n`);

        const invocations = [];

        for (const file of jsonFiles) {
            const filePath = path.join(this.invocationsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (data.status === 'pending') {
                invocations.push({
                    id: path.basename(file, '.json'),
                    ...data,
                    filePath
                });
            }
        }

        return invocations;
    }

    displayInvocations(invocations) {
        if (invocations.length === 0) {
            console.log('✅ All invocations have been processed');
            return;
        }

        console.log('═══════════════════════════════════════════════════');
        console.log('🎯 PENDING AGENT INVOCATIONS');
        console.log('═══════════════════════════════════════════════════\n');

        invocations.forEach((inv, index) => {
            console.log(`${index + 1}. Agent: ${inv.agentType}`);
            console.log(`   ID: ${inv.id}`);
            console.log(`   Time: ${inv.timestamp}`);
            console.log(`   Command: ${inv.command}`);
            if (inv.context && Object.keys(inv.context).length > 0) {
                console.log(`   Context:`, JSON.stringify(inv.context, null, 2).split('\n').join('\n   '));
            }
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════\n');
        console.log('💡 To process an invocation:');
        console.log('   node check-invocations.js process <id>');
        console.log('\n💡 To mark as completed manually:');
        console.log('   node check-invocations.js complete <id>');
        console.log('');
    }

    async processInvocation(id) {
        const filePath = path.join(this.invocationsDir, `${id}.json`);

        if (!fs.existsSync(filePath)) {
            console.log(`❌ Invocation ${id} not found`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        console.log('\n🎯 Processing Invocation');
        console.log('═══════════════════════════════════════════════════');
        console.log(`Agent Type: ${data.agentType}`);
        console.log(`Command: ${data.command}`);
        console.log(`Context:`, JSON.stringify(data.context, null, 2));
        console.log('═══════════════════════════════════════════════════\n');

        // Update status to processing
        data.status = 'processing';
        data.processedAt = new Date().toISOString();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log('✅ Invocation marked as processing');
        console.log(`📁 File: ${filePath}\n`);
        console.log('💡 Execute the command above, then run:');
        console.log(`   node check-invocations.js complete ${id}\n`);
    }

    async completeInvocation(id, result = null) {
        const filePath = path.join(this.invocationsDir, `${id}.json`);

        if (!fs.existsSync(filePath)) {
            console.log(`❌ Invocation ${id} not found`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data.status = 'completed';
        data.completedAt = new Date().toISOString();
        if (result) {
            data.result = result;
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Invocation ${id} marked as completed`);

        // Move to archive
        const archiveDir = path.join(this.invocationsDir, 'archive');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }

        const archivePath = path.join(archiveDir, `${id}.json`);
        fs.renameSync(filePath, archivePath);
        console.log(`📦 Archived to: ${archivePath}`);
    }

    async cleanup(olderThanDays = 7) {
        const archiveDir = path.join(this.invocationsDir, 'archive');
        if (!fs.existsSync(archiveDir)) {
            console.log('No archive directory to clean');
            return;
        }

        const files = fs.readdirSync(archiveDir);
        const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        let cleaned = 0;

        for (const file of files) {
            const filePath = path.join(archiveDir, file);
            const stats = fs.statSync(filePath);

            if (stats.mtimeMs < cutoff) {
                fs.unlinkSync(filePath);
                cleaned++;
            }
        }

        console.log(`🗑️  Cleaned ${cleaned} archived invocation(s) older than ${olderThanDays} days`);
    }
}

// CLI
async function main() {
    const checker = new InvocationChecker();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'process':
            if (!args[1]) {
                console.log('❌ Usage: node check-invocations.js process <id>');
                process.exit(1);
            }
            await checker.processInvocation(args[1]);
            break;

        case 'complete':
            if (!args[1]) {
                console.log('❌ Usage: node check-invocations.js complete <id>');
                process.exit(1);
            }
            await checker.completeInvocation(args[1]);
            break;

        case 'cleanup':
            const days = parseInt(args[1]) || 7;
            await checker.cleanup(days);
            break;

        case 'list':
        default:
            const invocations = await checker.checkInvocations();
            checker.displayInvocations(invocations);
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = InvocationChecker;
