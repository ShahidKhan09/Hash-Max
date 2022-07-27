const commander = require('commander');
const chalk = require('chalk');
const fs = require("fs")
const path = require("path")
const ipfsClient = require('ipfs-http-client')

const projectId = '1wx1Gud81GmcjvVPjhyaoUtruvV'
const projectSecret = '37e95db67040df61a82e96563d1d510a'
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

const packageJson = require('../package.json');

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments('<folder-to-upload> <ipfs-node-url>')
    .usage(`${chalk.green('<project-directory>')} ${chalk.green('<ipfs-node-url>')} [options]`)
    .description(`Adds ${chalk.green('<project-directory>')} recursively to the IPFS node specified in ${chalk.green('<ipfs-node-url>')} ('http://ipfs.mydomain.com:5001/').`)
    .action((path, url) => {
        folderPath = path;
        nodeUrl = url;
    })
    .option('-p, --pin', 'pin uploaded folders and files')
    .option('-q, --quiet', 'Will only print the result hash of the root folder once complete')
    .parse(process.argv);

addFolder(
    folderPath,
    nodeUrl,
    program.pin,
    program.quiet);

function addFolder(
    folderPath,
    nodeUrl,
    pin,
    quiet
) {
    files = getAllFiles(folderPath);
    ipfs = ipfsClient({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: auth
        }
    });
    rootFolder = `/${path.relative(path.resolve(process.argv[2], ".."), process.argv[2])}`;
    ipfs.add(files, { pin: true })
        .then(result => {
            console.log(result)
            rootItem = `/ipfs/${result.cid}`;
            if (!quiet) {
                console.info('')
                console.info(`Copying from ${rootItem} to ${rootFolder}`);
            }

            // ipfs.files.cp(rootItem, rootFolder);

            if (quiet) {
                console.info('here:,', result);
            }
        })
        .catch(error => {
            console.error(error)
        });
}

function getAllFiles(
    dirPath,
    originalPath,
    arrayOfFiles
) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];
    originalPath = originalPath || path.resolve(dirPath, "..");


    folder = path.relative(originalPath, path.join(dirPath, "/"));

    // arrayOfFiles.push({
    //     path: folder.replace(/\\/g, "/"),
    //     mtime: fs.statSync(folder).mtime
    // });
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, originalPath, arrayOfFiles);
        } else {
            fileTo = path.join(dirPath, "/", file);
            arrayOfFiles.push({
                path: `dataForIpfs/${file}`,
                content: fs.readFileSync(fileTo),
                mtime: fs.statSync(fileTo).mtime
            });
        }
    });

    return arrayOfFiles;
}