const {exec} = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..", "..");
const dist = path.resolve(root, "dist");

const files = [
    {
        name: "betterdiscord",
        get files() {
            return [path.resolve(dist, fs.readdirSync(dist).find(e => e.endsWith(".plugin.js")))];
        }
    },
    {
        name: "powercord",
        get files() {
            const pc = path.resolve(dist, "powercord");

            return fs.readdirSync(pc).map(e => path.resolve(pc, e));
        }
    },
    {
        name: "astra",
        get files() {
            const pc = path.resolve(dist, "astra");

            return fs.readdirSync(pc).map(e => path.resolve(pc, e));
        }
    },
    {
        name: "unbound",
        get files() {
            const pc = path.resolve(dist, "unbound");

            return fs.readdirSync(pc).map(e => path.resolve(pc, e));
        }
    }
];

async function main() {
    await run("node Builder -i src");
    await run("rm -rf ./Builder/*");

    for (const file of files) {
        const {name, files} = file;

        console.log(`Deploying ${name} build...`);
        await run(`git checkout -B ${name}`);

        try {
            await run(`git rm -r "*" --cached`);

            for (const file of files) {
                const name = path.basename(file);
                const location = path.join(root, name);

                // Copy into the root
                fs.renameSync(file, location);

                await run(`git add ${path.relative(root, location)}`);
            }

            await run(`git commit -am "Deploy ${name} build"`);
            await run(`git push --set-upstream origin ${name} --force`);
        } catch (err) {
            console.error("Failed to deploy:\n", err);
            process.exit(1);
        }

        await run("git reset HEAD~1");
    }
}

main();

function run(cmd, cwd = root) {
    return new Promise((res, rej) => {
        exec(cmd, {cwd}, (error, stdout) => {
            if (error) return rej(error);

            res(stdout);
        });
    });
}