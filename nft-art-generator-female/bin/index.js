//TODO
//CHECK FOR TRAILING SLASHES ON ALL INPUTS

//IMPORTS
const chalk = require('chalk');
const boxen = require('boxen');
const ora = require('ora');
const inquirer = require('inquirer');
const fs = require('fs');
const mergeImages = require('merge-images');
const { Image, Canvas } = require('canvas');
const ImageDataURI = require('image-data-uri');
const csv = require('csv-parser');

//SETTINGS
let basePath;
let outputPath;
let traits;
let traitsToSort = [];
let order = [];
let weights = [];
let names = {};
let weightedTraits = [];
let seen = [];
let metaData = {};
let name;
let description;
let imageUrl;
let deleteDuplicates = true;
let generateMetadata = true;

//DEFINITIONS
const getDirectories = source =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

//OPENING
console.log(
  boxen(
    chalk.blue(
      ' /$$   /$$ /$$$$$$$$ /$$$$$$$$        /$$$$$$  /$$$$$$$  /$$$$$$$$        /$$$$$$  /$$$$$$$$ /$$   /$$ /$$$$$$$$ /$$$$$$$   /$$$$$$  /$$$$$$$$ /$$$$$$  /$$$$$$$ \n' +
      '| $$$ | $$| $$_____/|__  $$__/       /$$__  $$| $$__  $$|__  $$__/       /$$__  $$| $$_____/| $$$ | $$| $$_____/| $$__  $$ /$$__  $$|__  $$__//$$__  $$| $$__  $$\n' +
      '| $$$$| $$| $$         | $$         | $$  \\ $$| $$  \\ $$   | $$         | $$  \\__/| $$      | $$$$| $$| $$      | $$  \\ $$| $$  \\ $$   | $$  | $$  \\ $$| $$  \\ $$\n' +
      '| $$ $$ $$| $$$$$      | $$         | $$$$$$$$| $$$$$$$/   | $$         | $$ /$$$$| $$$$$   | $$ $$ $$| $$$$$   | $$$$$$$/| $$$$$$$$   | $$  | $$  | $$| $$$$$$$/\n' +
      '| $$  $$$$| $$__/      | $$         | $$__  $$| $$__  $$   | $$         | $$|_  $$| $$__/   | $$  $$$$| $$__/   | $$__  $$| $$__  $$   | $$  | $$  | $$| $$__  $$\n' +
      '| $$\\  $$$| $$         | $$         | $$  | $$| $$  \\ $$   | $$         | $$  \\ $$| $$      | $$\\  $$$| $$      | $$  \\ $$| $$  | $$   | $$  | $$  | $$| $$  \\ $$\n' +
      '| $$ \\  $$| $$         | $$         | $$  | $$| $$  | $$   | $$         |  $$$$$$/| $$$$$$$$| $$ \\  $$| $$$$$$$$| $$  | $$| $$  | $$   | $$  |  $$$$$$/| $$  | $$\n' +
      '|__/  \\__/|__/         |__/         |__/  |__/|__/  |__/   |__/          \\______/ |________/|__/  \\__/|________/|__/  |__/|__/  |__/   |__/   \\______/ |__/  |__/\n \n' +
      'Made with '
    ) +
    chalk.red('❤') +
    chalk.blue(' by NotLuksus'),
    { borderColor: 'red', padding: 3 }
  )
);
main();

async function main() {
  try {
    await getBasePath();
    await getOutputPath();
    await checkForDuplicates();
    await generateMetadataPrompt();
    if (generateMetadata) {
      await metadataSettings();
    }
    const loadingDirectories = ora('Loading traits');
    loadingDirectories.color = 'yellow';
    loadingDirectories.start();
    traits = getDirectories(basePath);
    traitsToSort = [...traits];
    setTimeout(async () => {
      loadingDirectories.succeed();
      loadingDirectories.clear();
      await traitsOrder(true);
      await asyncForEach(traits, async trait => {
        await setNames(trait);
      });
      await asyncForEach(traits, async trait => {
        await setWeights(trait);
      });
      // process.exit(-1)
      await generateImages();
      const generatingImages = ora('Generating images');
      generatingImages.color = 'yellow';
      generatingImages.start();
      setTimeout(async () => {
        generatingImages.succeed('All images generated!');
        generatingImages.clear();
        if (generateMetadata) {
          await writeMetadata();
          const writingMetadata = ora('Exporting metadata');
          writingMetadata.color = 'yellow';
          writingMetadata.start();
          setTimeout(() => {
            writingMetadata.succeed('Exported metadata successfull');
            writingMetadata.clear();
          }, 500);
        }
      }, 2000);
    }, 2000);
  } catch (error) {
    console.log("error", error);
  }
}

//GET THE BASEPATH FOR THE IMAGES
async function getBasePath() {
  const { base_path } = await inquirer.prompt([
    {
      type: 'list',
      name: 'base_path',
      message: 'Where are your images located?',
      choices: [
        { name: 'In the current directory', value: 0 },
        { name: 'Somewhere else on my computer', value: 1 },
      ],
    },
  ]);
  if (base_path === 0) {
    basePath = process.cwd() + '/images/';
  } else {
    const { file_location } = await inquirer.prompt([
      {
        type: 'input',
        name: 'file_location',
        message: 'Enter the path to your image files (Absolute filepath)',
      },
    ]);
    let lastChar = file_location.slice(-1);
    if (lastChar === '/') basePath = file_location;
    else basePath = file_location + '/';
  }
}

//GET THE OUTPUTPATH FOR THE IMAGES
async function getOutputPath() {
  const { output_path } = await inquirer.prompt([
    {
      type: 'list',
      name: 'output_path',
      message: 'Where should the generated images be exported?',
      choices: [
        { name: 'In the current directory', value: 0 },
        { name: 'Somewhere else on my computer', value: 1 },
      ],
    },
  ]);
  if (output_path === 0) {
    outputPath = process.cwd() + '/output/';
  } else {
    const { file_location } = await inquirer.prompt([
      {
        type: 'input',
        name: 'file_location',
        message:
          'Enter the path to your output_old directory (Absolute filepath)',
      },
    ]);
    let lastChar = file_location.slice(-1);
    if (lastChar === '/') outputPath = file_location;
    else outputPath = file_location + '/';
  }
}

async function checkForDuplicates() {
  let { checkDuplicates } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'checkDuplicates',
      message:
        'Should duplicated images be deleted? (Might result in less images then expected)',
    },
  ]);
  deleteDuplicates = checkDuplicates;
}

async function generateMetadataPrompt() {
  let { createMetadata } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createMetadata',
      message: 'Should metadata be generated?',
    },
  ]);
  generateMetadata = createMetadata;
}

async function metadataSettings() {
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'metadataName',
      message: 'What should be the name? (Generated format is NAME#ID)',
    },
    {
      type: 'input',
      name: 'metadataDescription',
      message: 'What should be the description?',
    },
    {
      type: 'input',
      name: 'metadataImageUrl',
      message: 'What should be the image url? (Generated format is URL/ID)',
    },
  ]);
  name = responses.metadataName;
  description = responses.metadataDescription;
  let lastChar = responses.metadataImageUrl.slice(-1);
  if (lastChar === '/') imageUrl = responses.metadataImageUrl;
  else imageUrl = responses.metadataImageUrl + '/';
}

//SELECT THE ORDER IN WHICH THE TRAITS SHOULD BE COMPOSITED
async function traitsOrder(isFirst) {
  const traitsPrompt = {
    type: 'list',
    name: 'selected',
    choices: [],
  };
  traitsPrompt.message = 'Which trait should be on top of that?';
  if (isFirst === true) traitsPrompt.message = 'Which trait is the background?';
  traitsToSort.forEach(trait => {
    const globalIndex = traits.indexOf(trait);
    traitsPrompt.choices.push({
      name: trait.toUpperCase(),
      value: globalIndex,
    });
  });
  const { selected } = await inquirer.prompt(traitsPrompt);
  order.push(selected);
  let localIndex = traitsToSort.indexOf(traits[selected]);
  traitsToSort.splice(localIndex, 1);
  if (order.length === traits.length) return;
  await traitsOrder(false);
}

//SET NAMES FOR EVERY TRAIT
async function setNames(trait) {
  const files = fs.readdirSync(basePath + '/' + trait);
  const namePrompt = [];
  files.forEach((file, i) => {
    namePrompt.push({
      type: 'input',
      name: trait + '_name_' + i,
      message: 'What should be the name of the trait shown in ' + file + '?',
    });
  });
  // const selectedNames = await inquirer.prompt(namePrompt);
  files.forEach((file, i) => {
    // names[file] = selectedNames[trait + '_name_' + i];
    names[file] = file.split('.png')[0];
  });
}
//SET WEIGHTS FOR EVERY TRAIT
async function setWeights(trait) {
  let rarirty = await readRarity()
  const files = fs.readdirSync(basePath + '/' + trait);
  // const weightPrompt = [];
  // files.forEach((file, i) => {
  //   weightPrompt.push({
  //     type: 'input',
  //     name: names[file] + '_weight',
  //     message: 'How many ' + names[file] + ' ' + trait + ' should there be?',
  //   });
  // });
  // const selectedWeights = await inquirer.prompt(weightPrompt);


  files.forEach((file, i) => {
    let toMatch = file;
    toMatch = toMatch.split('.png')[0];
    toMatch = toMatch + " " + trait;
    let rar = rarirty.find(e => e.name == toMatch);
    console.log('rarirty:::::', rar, toMatch)
    weights[file] = parseInt(rar.rarity);
  

    // weights[file] = Math.round(Math.random() * (5000 - 4500) + 4500);
    // weights[file] = selectedWeights[names[file] + '_weight'];

  });
}



function readRarity() {
  return new Promise((resolve, reject) => {
    let addressesListFile = [];
    fs.createReadStream('rarity.csv').pipe(csv({})).on('data', (data) => addressesListFile.push(data)).on('end', async () => {
      resolve(addressesListFile);
    });

  })

}

//ASYNC FOREACH
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

//GENERATE WEIGHTED TRAITS
async function generateWeightedTraits() {
  traits.forEach(trait => {
    const traitWeights = [];
    const files = fs.readdirSync(basePath + '/' + trait);
    files.forEach(file => {
      for (let i = 0; i < weights[file]; i++) {
        traitWeights.push(file);
      }
    });
    weightedTraits.push(traitWeights);
  });
}

//GENARATE IMAGES
async function generateImages() {
  try {
    let noMoreMatches = 0;
    let images = [];
    let id = 0;
    await generateWeightedTraits();
    if (deleteDuplicates) {
      let breakLoop = 0;
      while (weightedTraits[0].length > 0 && noMoreMatches < 20) {

        console.log(breakLoop);
        let picked = [];
        let backhair;
        let fronthair;
        let backAccesssory;
        let bagPicked = false;
        let wingPicked = false;
        let accPicked = false;
        let clothPicked = false
        let pets = "";
        let frontclothes;
        let backclothes = "";
        let petspicked = false;
        let backclothespicked = false;
        let frontclothespicked = false;
        let fronthairpicked = false;
        let backhairpicked = false;
        let backhairpickedwithacc = false;
        let noearingpicked = false;
        let nohairpicked = false;
        let bluepicked = false;
        order.forEach(id => {
          let pickedImgId = pickRandom(weightedTraits[id]);
          let pickedImg = weightedTraits[id][pickedImgId];
          console.log("id:::::::" , id , traits[id])
          // hair check
          if (id == 5) {
            if (bagPicked) {
              if (
              pickedImg == "2 black green.png" || pickedImg == "2 black.png" || pickedImg == "2 blue.png"  || pickedImg == "2 pink.png" || pickedImg == "2 purple.png"  || pickedImg == "2 red.png" || pickedImg == "2 yellow.png" || pickedImg == "2.png" ||
              pickedImg == "3 black green.png" || pickedImg == "3 black.png" || pickedImg == "3 blue.png"  || pickedImg == "3 gray.png" || pickedImg == "3 purple.png"  || pickedImg == "3 red.png" || pickedImg == "3 yellow.png" || pickedImg == "3.png"  
              ) {
                return;
              }
            }
            backhair = pickedImg;
          }
          if (id == 8) {
            if (pickedImg != backhair) {
              return;
            }
          }

          // wing check
          if (id == 9) {
            if (pickedImg == '1.png') {
              wingPicked = true;
            }
          }

          // bag check
          if (id == 0) {
            if (wingPicked) {
              if (pickedImg == "bag 1.png" || pickedImg == "bag 2.png") {
                return;
              }
            }

            if (pickedImg == "bag 1.png" || pickedImg == "bag 2.png" || pickedImg == "1.png" || pickedImg == "3.png" || pickedImg == "7.png") {
              accPicked = true;
              backAccesssory = pickedImg;
            }

            if (pickedImg == "bag 1.png" || pickedImg == "bag 2.png") {
              bagPicked = true;
            }
          }

          if (id == 1) {
            if (accPicked) {
              if (pickedImg != backAccesssory) {
                return;
              }
            } else {
              if (pickedImg == "1.png" || pickedImg == "bag 1.png" || pickedImg == "bag 2.png" || pickedImg == "3.png" || pickedImg == "7.png") {
                return;
              }
            }

            if (clothPicked) {
              if (pickedImg == "2.png" || pickedImg == "6.png" || pickedImg == "11.png") {
                return;
              }
            }
          }

          if (id == 2) {
            if (backhair == "8.png" || backhair == "5.png") {
              if (pickedImg == "3.png" || pickedImg == "5.png" || pickedImg == "7.png" || pickedImg == "9.png") {
                return;
              }
            }

            if (backhair == "7.png") {
              if (pickedImg == "3.png") {
                return;
              }
            }

            if (backhair == "6.png") {
              if (pickedImg == "5.png") {
                return;
              }
            }

            if (backhair == "3.png") {
              if (pickedImg == "5.png" || pickedImg == "7.png" || pickedImg == "7(1).png") {
                return;
              }
            }

            if (backhair == "4.png" || backhair == "1.png") {
              if (pickedImg == "2.png" || pickedImg == "6.png" || pickedImg == "11.png") {
                return;
              }
            }
          }

          // clothes check with necklace

          // if (id == 5) {
          //   if (
          //     // pickedImg == '1.png' || pickedImg == '2.png' || pickedImg == '5.png' || pickedImg == '6.png'
          //     pickedImg == "1 black green.png" || pickedImg == "1 black.png" || pickedImg == "1 blue.png" || pickedImg == "1 gray.png" || pickedImg == "1 pink.png" || pickedImg == "1 purple.png" || pickedImg == "1 yellow.png" || pickedImg == "1.png"  ||
          //     pickedImg == "2 black green.png" || pickedImg == "2 black.png" || pickedImg == "2 blue.png"  || pickedImg == "2 pink.png" || pickedImg == "2 purple.png"  || pickedImg == "2 red.png" || pickedImg == "2 yellow.png" || pickedImg == "2.png" ||
          //     pickedImg == "5 black green.png" || pickedImg == "5 black.png" || pickedImg == "5 gray.png"  || pickedImg == "5 pink.png" || pickedImg == "5 purple.png"  || pickedImg == "5 red.png" || pickedImg == "5 yellow.png" || pickedImg == "5.png" ||
          //     pickedImg == "6 black green.png" || pickedImg == "6 black.png" || pickedImg == "6 blue.png"  || pickedImg == "6 gray.png" || pickedImg == "2 pink.png"  || pickedImg == "6 red.png" || pickedImg == "6 yellow.png" || pickedImg == "6.png" 

          //     ) {
          //     clothPicked = true;
          //   }
          // }

        //  Pets checks with front-Pets and back-Pets

          if (id == 11) {
            if (pickedImg == "dragon.png" || pickedImg == "snake.png") {
              pets = pickedImg;
              petspicked = true;
            }
          }

          if (id == 12) {
            if (petspicked) {
              if (pets != pickedImg) {
                return;
              }
            } else {
              if (pickedImg == "dragon.png" || pickedImg == "snake.png") {
                return;
              }
            }
          }
          // Clothes Front 4 Is Equal to Clothes Back 4.
          if(id == 4) {
            if (pickedImg == "4.png" || pickedImg == "9.png" || pickedImg == "5.png" || pickedImg == "2.png" || pickedImg == "6.png") {
              backclothes = pickedImg;
              backclothespicked = true;
            }
          }

          if (id == 6) {
            if (backclothespicked) {
              if (backclothes != pickedImg) {
                return;
              }
            } else {
              if (pickedImg == "4.png" || pickedImg == "9.png" || pickedImg == "5.png" || pickedImg == "2.png" || pickedImg == "6.png") {
                return;
              }
            }

          }
          //Necklaces Is Not Equal to Clothes 1 , 2 , 5 , 6.
          if (id == 6) {
              if (pickedImg == "1.png" || pickedImg == "2.png" || pickedImg == "5.png" || pickedImg == "6.png") {
                frontclothespicked = true
              }
          }


          if (id == 10) {
            if(frontclothespicked){
              if (pickedImg == "2.png" || pickedImg == "6.png" || pickedImg == "11.png") {
                return;
              }
            }
           
          }
      //    Necklaces Is Not Equal to hair Front 1 , 2 , 4.
          if (id == 8) {
              if (pickedImg == "1 black green.png" || pickedImg == "1 black.png"  || pickedImg == "1 blue.png"  || pickedImg == "1 gray.png" || pickedImg == "1 pink.png" || pickedImg == "1 purple.png" || pickedImg == "1 yellow.png" || pickedImg == "1.png" 
              || pickedImg == "2 black green.png"  || pickedImg == "2 black.png"  || pickedImg == "2 blue.png"  || pickedImg == "2 pink.png"  || pickedImg == "2 purple.png"  || pickedImg == "2 red.png"  || pickedImg == "2 yellow.png"  || pickedImg == "2.png"  
              || pickedImg == "4 black green.png"  || pickedImg == "4 black.png"  || pickedImg == "4 blue.png"  || pickedImg == "4 gray.png"  || pickedImg == "4 pink.png"  || pickedImg == "4 purple.png"  || pickedImg == "4 red.png"  || pickedImg == "4.png"  
              || pickedImg == "veil 1 black green.png"  || pickedImg == "veil 1 black.png"  || pickedImg == "veil 1 blue.png"  || pickedImg == "veil 1 gray.png"  || pickedImg == "veil 1 pink.png"  || pickedImg == "veil 1 purple.png"  || pickedImg == "veil 1 yellow.png"  || pickedImg == "veil 1.png"   
              || pickedImg == "veil 2 black green.png"   || pickedImg == "veil 2 black.png"   || pickedImg == "veil 2 blue.png"   || pickedImg == "veil 2 pink.png"   || pickedImg == "veil 2 purple.png"   || pickedImg == "veil 2 red.png"   || pickedImg == "veil 2 yellow.png"   || pickedImg == "veil 2.png"
              || pickedImg == "veil 4 black green.png"   || pickedImg == "veil 4 black.png"   || pickedImg == "veil 4 blue.png"   || pickedImg == "veil 4 gray.png"   || pickedImg == "veil 4 pink.png"   || pickedImg == "veil 4 purple.png"   || pickedImg == "veil 4 red.png"   || pickedImg == "veil 4.png" 
              ) {
                fronthairpicked = true
              }
          }

          if (id == 10) {
            if(fronthairpicked){
              if (pickedImg == "2.png" || pickedImg == "6.png" || pickedImg == "11.png") {
                return;
              }
            }
          }

          //Veil Is Not Equal to Hair Front 6 & Hair Back 6.
          // waleed bhai 
        //   if (id == 5) {
        //     if (
        //       // pickedImg == "1.png" || pickedImg == "6.png"
        //       pickedImg == "1 black green.png" || pickedImg == "1 black.png" || pickedImg == "1 blue.png" || pickedImg == "1 gray.png" || pickedImg == "1 pink.png" || pickedImg == "1 purple.png" || pickedImg == "1 yellow.png" || pickedImg == "1.png"  ||
        //       pickedImg == "6 black green.png" || pickedImg == "6 black.png" || pickedImg == "6 blue.png"  || pickedImg == "6 gray.png" || pickedImg == "2 pink.png"  || pickedImg == "6 red.png" || pickedImg == "6 yellow.png" || pickedImg == "6.png"
        //       ) {
        //       backhairpicked = true
        //     }
        // }
//////////////////id == 1
        // if (id == 1) {
        //   if(backhairpicked){
        //     if (pickedImg == "veil.png" ) {
        //       return;
        //     }
        //   }
        // }
        //blue kapron k sth bags ni ayenge
        if (id == 4) {
          if(bagPicked){
            if (pickedImg == "3.png" || pickedImg == "4.png") {
              return;
            }
          }
        
      }


      //acc 3, 7 is not equal to hair 8
      if (id == 0) {
        if (pickedImg == "3.png" || pickedImg == "7.png") {
          backhairpicked = true
         }
      }
/////veil id == 5
      // if (id == 5) {
      //  if(backhairpicked){
      //   if (
      //   pickedImg == "8 black green.png"   || pickedImg == "8 blue.png"   || pickedImg == "8 gray.png"   || pickedImg == "8 pink.png" 
      //   || pickedImg == "8 purple.png"   || pickedImg == "8 red.png"   || pickedImg == "8 yellow.png"   || pickedImg == "8.png" 
      //   || pickedImg == "veil 8 black.png"   || pickedImg == "veil 8 blue.png"   || pickedImg == "veil 8 gray.png"   
      //   || pickedImg == "veil 8 pink.png"   || pickedImg == "veil 8 purple.png"   || pickedImg == "veil 8 red.png" 
      //   || pickedImg == "veil 8 yellow.png"   || pickedImg == "veil 8.png" 
      //   ) {
      //     return;
      //   }
      //  }
      // }

      //acc 8 , 10 is not equal to hair 8

      if (id == 1) {
       if(backhairpickedwithacc){
        if (pickedImg == "8.png" || pickedImg == "10.png" ) {
          return;
        }
       }
      }
      /////veil id == 5
      // if (id == 5) {
      //   if (pickedImg == "8 black green.png" || pickedImg == "8 blue.png" || pickedImg == "8 gray.png" || pickedImg == "8 purple.png" 
      //   || pickedImg == "8 red.png" || pickedImg == "8 yellow.png" || pickedImg == "8 pink.png" || pickedImg == "8.png" 
      //   || pickedImg == "veil 8 black.png" || pickedImg == "veil 8 blue.png" || pickedImg == "veil 8 gray.png" 
      //   || pickedImg == "veil 8 pink.png" || pickedImg == "veil 8 purple.png" || pickedImg == "veil 8 red.png" 
      //   || pickedImg == "veil 8 yellow.png" || pickedImg == "veil 8.png" ) {
      //     backhairpickedwithacc = true
      //    }
      // }
///////////////////////id == 1 notworking
      //2 ,3 ,5  no earing with accessories front
      if (id == 8) {
        if (
        // pickedImg == "2.png" || pickedImg == "3.png" || pickedImg == "5.png" || pickedImg == "8.png" || pickedImg == "veil 2.png" 
        // || pickedImg == "veil 3.png" || pickedImg == "veil 5.png" || pickedImg == "veil 8.png"
        // pickedImg == "2 black green.png" || pickedImg == "2 black.png" || pickedImg == "2 blue.png" || pickedImg == "2 pink.png" || pickedImg == "2 purple.png" || pickedImg == "2 red.png" || pickedImg == "2 yellow.png"|| pickedImg == "2.png"
        pickedImg == "2 black green.png" || pickedImg == "2 black.png" || pickedImg == "2 blue.png" || pickedImg == "2 pink.png" || pickedImg == "2 purple.png" || pickedImg == "2 red.png" || pickedImg == "2 yellow.png"|| pickedImg == "2.png"
        || pickedImg == "3 black green.png" || pickedImg == "3 black.png" || pickedImg == "3 blue.png" || pickedImg == "3 gray.png" || pickedImg == "3 purple.png" || pickedImg == "3 red.png" || pickedImg == "3 yellow.png"|| pickedImg == "3.png"
        || pickedImg == "5 black green.png" || pickedImg == "5 black.png" || pickedImg == "5 gray.png" || pickedImg == "5 pink.png" || pickedImg == "5 purple.png" || pickedImg == "5 red.png" || pickedImg == "5 yellow.png"|| pickedImg == "5.png"
        || pickedImg == "8 black.png" || pickedImg == "8 blue.png" || pickedImg == "8 gray.png" || pickedImg == "8 pink.png" || pickedImg == "8 purple.png" || pickedImg == "8 red.png" || pickedImg == "8 yellow.png"|| pickedImg == "8.png"
        || pickedImg == "veil 2 black green.png" || pickedImg == "veil 2 black.png" || pickedImg == "veil 2 blue.png" || pickedImg == "veil 2 pink.png" || pickedImg == "veil 2 purple.png" || pickedImg == "veil 2 red.png" || pickedImg == "veil 2 yellow.png"|| pickedImg == "veil 2.png"
        || pickedImg == "veil 3 black green.png" || pickedImg == "veil 3 black.png" || pickedImg == "veil 3 blue.png" || pickedImg == "veil 3 gray.png" || pickedImg == "veil 3 purple.png" || pickedImg == "veil 3 red.png" || pickedImg == "veil 3 yellow.png"|| pickedImg == "veil 3.png"
        || pickedImg == "veil 5 black green.png" || pickedImg == "veil 5 black.png" || pickedImg == "veil 5 gray.png" || pickedImg == "veil 5 pink.png" || pickedImg == "veil 5 purple.png" || pickedImg == "veil 5 red.png" || pickedImg == "veil 5 yellow.png"|| pickedImg == "veil 5.png"
        || pickedImg == "veil 8 black.png" || pickedImg == "veil 8 blue.png" || pickedImg == "veil 8 gray.png" || pickedImg == "veil 8 pink.png" || pickedImg == "veil 8 purple.png" || pickedImg == "veil 8 red.png" || pickedImg == "veil 8 yellow.png"|| pickedImg == "veil 8.png"
        ) {
          noearingpicked = true
         }
      }

      if (id == 1) {
       if(noearingpicked){
        if (pickedImg == "3.png" || pickedImg == "5.png" || pickedImg == "7.png"|| pickedImg == "9.png") {
          return;
        }
       }
      } 

      //hair 1, 3, 4 no bags
      if (id == 0) {
        if (pickedImg == "bag 1.png" || pickedImg == "bag 2.png" ) {
          nohairpicked = true
         }
      }
///veil id == 5
      // if (id == 5) {
      //  if(nohairpicked){
      //   // if (pickedImg == "1.png" || pickedImg == "3.png" || pickedImg == "4.png" || pickedImg == "veil 1.png" || pickedImg == "veil 2.png" || pickedImg == "veil 3.png" || pickedImg == "veil 4.png" || pickedImg == "veil 5.png" || pickedImg == "veil 6.png" || pickedImg == "veil 7.png" || pickedImg == "veil 8.png") {
      //   if (
      //   pickedImg == "1 black green.png" || pickedImg == "1 black.png" || pickedImg == "1 blue.png" || pickedImg == "1 gray.png" || pickedImg == "1 pink.png" || pickedImg == "1 purple.png" || pickedImg == "1 yellow.png" || pickedImg == "1.png" 
      //   || pickedImg == "3 black green.png" || pickedImg == "3 black.png" || pickedImg == "3 blue.png"  || pickedImg == "3 gray.png" || pickedImg == "3 purple.png"  || pickedImg == "3 red.png" || pickedImg == "3 yellow.png" || pickedImg == "3.png"  
      //   || pickedImg == "4 black green.png"  || pickedImg == "4 black.png"  || pickedImg == "4 blue.png"  || pickedImg == "4 gray.png"  || pickedImg == "4 pink.png"  || pickedImg == "4 purple.png"  || pickedImg == "4 red.png"  || pickedImg == "4.png"  
      //   || pickedImg == "veil 1 black green.png"  || pickedImg == "veil 1 black.png"   || pickedImg == "veil 1 blue.png"   || pickedImg == "veil 1 gray.png"   || pickedImg == "veil 1 pink.png"   || pickedImg == "veil 1 purple.png"   || pickedImg == "veil 1 yellow.png"   || pickedImg == "veil 1.png" 
      //   || pickedImg == "veil 2 black green.png"  || pickedImg == "veil 2 black.png"   || pickedImg == "veil 2 blue.png"   || pickedImg == "veil 2 pink.png"   || pickedImg == "veil 2 purple.png"   || pickedImg == "veil 2 red.png"   || pickedImg == "veil 2 yellow.png"   || pickedImg == "veil 2.png" 
      //   || pickedImg == "veil 3 black green.png"  || pickedImg == "veil 3 black.png"   || pickedImg == "veil 3 blue.png"   || pickedImg == "veil 3 gray.png"   || pickedImg == "veil 3 purple.png"   || pickedImg == "veil 3 red.png"   || pickedImg == "veil 3 yellow.png"   || pickedImg == "veil 3.png" 
      //   || pickedImg == "veil 4 black green.png"  || pickedImg == "veil 4 black.png"   || pickedImg == "veil 4 blue.png"   || pickedImg == "veil 4 gray.png"   || pickedImg == "veil 4 pink.png"   || pickedImg == "veil 4 purple.png"   || pickedImg == "veil 4 red.png"   || pickedImg == "veil 4.png" 
      //   || pickedImg == "veil 5 black green.png"  || pickedImg == "veil 5 black.png"   || pickedImg == "veil 5 gray.png"   || pickedImg == "veil 5 pink.png"   || pickedImg == "veil 5 purple.png"   || pickedImg == "veil 5 red.png"   || pickedImg == "veil 5 yellow.png"   || pickedImg == "veil 5.png" 
      //   || pickedImg == "veil 6 black green.png"  || pickedImg == "veil 6 black.png"   || pickedImg == "veil 6 blue.png"   || pickedImg == "veil 6 gray.png"   || pickedImg == "veil 6 pink.png"   || pickedImg == "veil 6 red.png"   || pickedImg == "veil 6 yellow.png"   || pickedImg == "veil 6.png" 
      //   || pickedImg == "veil 7 black green.png"  || pickedImg == "veil 7 blue.png"   || pickedImg == "veil 7 gray.png"   || pickedImg == "veil 7 pink.png"   || pickedImg == "veil 7 purple.png"   || pickedImg == "veil 7 red.png"   || pickedImg == "veil 7 yellow.png"   || pickedImg == "veil 7.png" 
      //   || pickedImg == "veil 8 black.png"  || pickedImg == "veil 8 blue.png"   || pickedImg == "veil 8 gray.png"   || pickedImg == "veil 8 pink.png"   || pickedImg == "veil 8 purple.png"   || pickedImg == "veil 8 red.png"   || pickedImg == "veil 8 yellow.png"   || pickedImg == "veil 8.png" 
      //   ) {
      //     return;
      //   }
      //  }
      // } 


          picked.push(pickedImgId);
          images.push(basePath + traits[id] + '/' + pickedImg);
        });

        if (images.length < 13) {
          images = [];
          continue;
        }
        if (existCombination(images)) {
          noMoreMatches++;
          images = [];
        } else {
          generateMetadataObject(id, images);
          noMoreMatches = 0;
          order.forEach((id, i) => {
            remove(weightedTraits[id], picked[i]);
          });
          seen.push(images);
          let undefinedImage = images.filter(e => e.includes('undefined'));
          console.log(undefinedImage);
         const b64 = await mergeImages(images, { Canvas: Canvas, Image: Image, quality: 20000 });
          await ImageDataURI.outputFile(b64, outputPath + `${id}.png`);
          images = [];
          id++;
          breakLoop++;
        }
        if (breakLoop == 4445) {
          console.log('Break loop')
          break;
        }
      }
    } else {
      while (weightedTraits[0].length > 0) {
        order.forEach(id => {
          images.push(
            basePath + traits[id] + '/' + pickRandomAndRemove(weightedTraits[id])
          );
        });
        generateMetadataObject(id, images);
        const b64 = await mergeImages(images, { Canvas: Canvas, Image: Image });
        await ImageDataURI.outputFile(b64, outputPath + `${id}.png`);
        images = [];
        id++;
      }
    }
  } catch (error) {
    console.log('error in generateImages:::', error);
  }
}

//GENERATES RANDOM NUMBER BETWEEN A MAX AND A MIN VALUE
function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

//PICKS A RANDOM INDEX INSIDE AN ARRAY RETURNS IT AND THEN REMOVES IT
function pickRandomAndRemove(array) {
  const toPick = randomNumber(0, array.length - 1);
  const pick = array[toPick];
  array.splice(toPick, 1);
  return pick;
}

//PICKS A RANDOM INDEX INSIDE AND ARRAY RETURNS IT
function pickRandom(array) {
  return randomNumber(0, array.length - 1);
}

function remove(array, toPick) {
  array.splice(toPick, 1);
}

function existCombination(contains) {
  let exists = false;
  seen.forEach(array => {
    let isEqual =
      array.length === contains.length &&
      array.every((value, index) => value === contains[index]);
    if (isEqual) exists = true;
  });
  return exists;
}

function generateMetadataObject(id, images) {
  metaData[id] = {
    name: name + '#' + id,
    description: description,
    image: imageUrl + id,
    attributes: [],
  };
  images.forEach((image, i) => {
    let pathArray = image.split('/');
    let fileToMap = pathArray[pathArray.length - 1];
    metaData[id].attributes.push({
      trait_type: traits[order[i]],
      value: names[fileToMap],
    });
  });
}

async function writeMetadata() {
  fs.writeFile(outputPath + 'metadata.json', JSON.stringify(metaData), err => {
    if (err) {
      throw err;
    }
  });
}