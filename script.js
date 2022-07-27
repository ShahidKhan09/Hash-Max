require('dotenv').config();
const { create } = require('ipfs-http-client');

const projectId = '1wx1Gud81GmcjvVPjhyaoUtruvV'
const projectSecret = '37e95db67040df61a82e96563d1d510a'
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')


const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth
    }
})

const meta = require('./finalgen/metadata.json')
const fs = require('fs');

async function PutOnIPFS() {
    try {
        for (let value in meta) {
            console.log(value)
            if(value <= 1162){
                continue;
            }
            let image = fs.readFileSync(`./finalgen/${value}.png`)
            const cider = await ipfs.add(image);
            let data = JSON.stringify({
                name: "ZOOP " + meta[value].name,
                // description : meta[value].description,
                image: `ipfs://${cider.path}`,
                attributes: meta[value].attributes
            })
            fs.writeFileSync(`./dataForIpfs/${value}`, data)
            // if(value == 8889){
            //     break;
            // }
        }


    } catch (error) {
        console.log("errror", error)
    }
}

PutOnIPFS()