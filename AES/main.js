let aesRoundsData = [];
let currentRoundIndex = 0;
let currentStepIndex = 0;
const stepNames = ["input", "key", "subBytes", "shiftRows", "mixColumns", "addRoundKey"]; 

Array.prototype.rotate = (function() {
  // save references to array functions to make lookup faster
  var push = Array.prototype.push,
      splice = Array.prototype.splice;

  return function(count) {
      var len = this.length >>> 0, // convert to uint
          count = count >> 0; // convert to int

      // convert count to value in range [0, len)
      count = ((count % len) + len) % len;

      // use splice.call() instead of this.splice() to make function generic
      push.apply(this, splice.call(this, 0, count));
      return this;
  };
})();

//gives padded binary string matrix from decimal matrix
function dec2binMatrix(arr) {
  let newarr = [];

  for(let i=0; i<arr.length; i++) {
    newarr[i] = [];
    for(let j=0; j<arr.length; j++) {
      const bin = dec2bin(arr[i][j]);
      let padding = '';
      for(let k=0; k<(8-bin.length); k++) {
        padding += '0';
      }
      newarr[i][j] = padding + bin;
    }
  }

  return newarr;
}

//b matrix should be binary string
function matrixMultiply(m1, m2) {
  var result = [];
  for (var i = 0; i < m1.length; i++) {
    result[i] = [];
    for (var j = 0; j < m2[0].length; j++) {
        var sum = 0;
        for (var k = 0; k < m1[0].length; k++) {
            const m2_val = parseInt(m2[k][j], 2);
            const multiplied = GFmultiply(m1[i][k], m2_val, 8);
            sum ^= parseInt(multiplied,2);
        }
        result[i][j] = sum;
    }
  }
  result = dec2binMatrix(result);
  return result;
}

function dec2bin(dec){
  return (dec >>> 0).toString(2);
}

function sbox(row, col) {
  const sbox = [[99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118],[202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192],[183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21],[4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117],[9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132],[83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207],[208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168],[81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210],[205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115],[96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219],[224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121],[231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8],[186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138],[112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158],[225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223],[140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22]];

  let bin = dec2bin(sbox[row][col]);
  let padding = '';
  for(let k=0; k<(8-bin.length); k++) {
    padding += '0';
  }
  return (padding+bin);
}

//takes string and gives 4x4 matrix with binary in strings, if no string then plain matrix
function get4x4matrix(str) {
  //creating matrix
  let arr = [];
  for(let i=0; i<4; i++) {
    arr[i] = [];
    for(let j=0; j<4; j++) {
      arr[i][j] = '00000000';
    }
  }

  if(str) {
    //adding string into input matrix
    for(let i=0, ctr=0; i<4; i++) {
      for(let j=0; j<4; j++) {
        if(ctr < str.length) {
          const bin = dec2bin(str.charCodeAt(ctr));
          let padding = "";
          for(let k=0; k<(8-bin.length); k++) {
            padding += '0';
          }
          arr[j][i] = padding + bin;
        }
        ctr++;
      }
    }
  }

  return arr;
}

// takes a key and gives next key
function getNextKey(key, round) {
  let lastCol = [];
  const roundConstant = [];

  const rc = [1,2,4,8,16,32,64,128,27,54];

  //making roundConstant
  roundConstant[0] = rc[round-1];
  for(let i=1; i<4; i++) {
    roundConstant[i] = 0;
  }

  for(let i=0; i<4; i++) {
    lastCol.push(key[i][3]);
  }
  lastCol.rotate(1);

  //substituting that col, and xor'ing with round constant
  for(let i=0; i<4; i++) {
    const first4 = lastCol[i].substring(0,4);
    const last4 = lastCol[i].substring(4);
    const row = parseInt(first4, 2);
    const col = parseInt(last4, 2);
    let valFromSbox = parseInt(sbox(row,col), 2);
    lastCol[i] = valFromSbox ^ roundConstant[i];
  }

  //for name sake...
  const theCol = lastCol;

  let nextKey = get4x4matrix();

  //xoring theCol with key cols, and updating theCol after each col
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      const keyVal_ji = parseInt(key[j][i], 2);
      nextKey[j][i] = keyVal_ji ^ theCol[j];
      theCol[j] = nextKey[j][i];
    }
  }

  //converting nextKey matrix from decimal to padded binary
  nextKey = dec2binMatrix(nextKey);

  return nextKey;
}

function addRoundKey(arr, key) {

  let newarr = get4x4matrix();

  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      const val1 = parseInt(arr[j][i],2);
      const val2 = parseInt(key[j][i], 2);
      const xored = val1 ^ val2;
      const bin = dec2bin(xored);
      let padding = "";
      for(let k=0; k<(8-bin.length); k++) {
        padding += '0';
      }
      newarr[j][i] = padding + bin;
    }
  }

  return newarr;
}

function substituteBytes(arr) {
  let newarr = get4x4matrix();
  for(let i=0; i<4; i++) {
    for(let j=0; j<4; j++) {
      const bin = arr[j][i];
      const first4 = bin.substring(0,4);
      const last4 = bin.substring(4);
      const row = parseInt(first4, 2);
      const col = parseInt(last4, 2);
      newarr[j][i] = sbox(row,col);
    }
  }
  return newarr;
}

function shiftRows(arr) {
  // Create a deep copy of the original array so that the input array remains unchanged
  const newArr = arr.map(row => [...row]);  // Make a shallow copy of each row

  // Perform rotations on the new array
  for (let i = 0; i < 4; i++) {
    const row = newArr[i];
    for (let j = 0; j < i; j++) {
      row.push(row.shift());  // Rotate left and move the first element to the end
    }
  }
  return newArr;
}

function mixColumns(arr) {
  const mix_col_matrix = [[2,3,1,1], [1,2,3,1], [1,1,2,3], [3,1,1,2]];
  return matrixMultiply(mix_col_matrix, arr);
}

function printHexTable(arr) {
  let newarr = getHexTable(arr);
  console.table(newarr);
}

function getHexTable(arr) {
  let newarr = [];
  for(let i=0; i<arr.length; i++) {
    newarr[i] = [];
    for(let j=0; j<arr[i].length; j++) {
      let dec = parseInt(arr[i][j],2);
      let hex = dec.toString(16);
      if(hex.length == 1) hex = '0' + hex;
      hex = hex.toUpperCase();
      newarr[i][j] = hex;
    }
  }
  return newarr;
}

function aes_init() {
  const plain_text = document.querySelector("#plain_text").value;
  const ikey = document.querySelector("#key").value;

  if(plain_text.length == 0 || ikey.length == 0) {
    alert('enter something');
    return;
  }

  // const plain_text = "Two One Nine Two";
  // const ikey = "Thats my Kung Fu";

  let input = get4x4matrix(plain_text); // input matrix
  let key = get4x4matrix(ikey);         // key matrix
  let state_arr = addRoundKey(input, key); // initial Add Round Key

  aesRoundsData = []; // Reset data for new encryption
  storeRoundData(0, { input, key, addRoundKey: state_arr });

  const TOTAL_ROUNDS = 10;
  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    let roundData = {};

    // Substitution Bytes
    state_arr = substituteBytes(state_arr);
    roundData.subBytes = state_arr;

    // Shift Rows
    state_arr = shiftRows(state_arr);
    roundData.shiftRows = state_arr;

    // Mix Columns (skip on last round)
    if (round !== TOTAL_ROUNDS) {
      state_arr = mixColumns(state_arr);
      roundData.mixColumns = state_arr;
    }

    // Generate New Key and Add Round Key
    key = getNextKey(key, round);
    roundData.key = key;
    state_arr = addRoundKey(state_arr, key);
    roundData.addRoundKey = state_arr;

    // Store round data in JSON
    storeRoundData(round, roundData);
  }

  // Show the first round and reveal navigation buttons
  currentRoundIndex = 0;
  currentStepIndex = 0;
  displayRound(currentRoundIndex);
  showNavigationButtons(true);
}

function storeRoundData(roundNumber, roundData) {
  aesRoundsData.push({ round: roundNumber, data: roundData });
}

function displayRound(roundIndex) {
  const roundInfo = aesRoundsData[roundIndex];
  const stepsBox = document.querySelector("#results-container");

  // Clear previous results
  stepsBox.innerHTML = '';

  const isFinalRound = roundIndex === aesRoundsData.length - 1;
  const headingText = isFinalRound ? "Final Round Result" : `ROUND : ${roundInfo.round}`;
  stepsBox.innerHTML = `<h2>${headingText}</h2> <br>`;

  // Step B: INPUT
  const inputMatrix = roundInfo.data.input;
  if (inputMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-A";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Input"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(inputMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step A: KEY
  const key0Matrix = roundInfo.data.key;
  if (key0Matrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-B";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Key"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(key0Matrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step 1: SUBSTITUTION BYTES
  const subBytesMatrix = roundInfo.data.subBytes;
  if (subBytesMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-0";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Substitution Bytes"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(subBytesMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step 2: SHIFT ROWS
  const shiftRowsMatrix = roundInfo.data.shiftRows;
  if (shiftRowsMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-1";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Shift Rows"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(shiftRowsMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step 3: MIX COLUMNS
  const mixColumnsMatrix = roundInfo.data.mixColumns;
  if (mixColumnsMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-2";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Mix Columns"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(mixColumnsMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step 4: GENERATING NEW KEY (Key expansion)
  const keyMatrix = roundInfo.data.key;
  if (keyMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-3";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Generating New Key"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(keyMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Step 5: ADD ROUND KEY
  const addRoundKeyMatrix = roundInfo.data.addRoundKey;
  if (addRoundKeyMatrix) {
    const stepContainer = document.createElement("div");
    stepContainer.classList.add("step");
    stepContainer.id = "step-4";

    const stepTitle = document.createElement("h3");
    stepTitle.innerHTML = "Add Round Key"; // Display the step name
    stepContainer.appendChild(stepTitle);

    const tableContainer = document.createElement("table");
    tableContainer.classList.add("step-table");
    tableContainer.appendChild(createTable(getHexTable(addRoundKeyMatrix)));
    stepContainer.appendChild(tableContainer);
    stepsBox.appendChild(stepContainer);
  }

  // Update navigation button visibility
  updateButtonVisibility();
}
function updateButtonVisibility() {
  // document.getElementById("prevStepBtn").disabled = currentStepIndex === 0;
  // document.getElementById("nextStepBtn").disabled = currentStepIndex === stepNames.length - 1;
  document.getElementById("prevRoundBtn").disabled = currentRoundIndex === 0;
  document.getElementById("nextRoundBtn").disabled = currentRoundIndex === aesRoundsData.length - 1;
}

// Show/hide navigation buttons based on encryption state
function showNavigationButtons(show) {
  document.getElementById("prevRoundBtn").style.display = show ? "inline-block" : "none";
  document.getElementById("nextRoundBtn").style.display = show ? "inline-block" : "none";
  document.getElementById("prevStepBtn").style.display = show ? "inline-block" : "none";
  document.getElementById("nextStepBtn").style.display = show ? "inline-block" : "none";
}

// Step navigation functions
function nextStep() {
  if (currentStepIndex < stepNames.length - 1) {
    currentStepIndex++;
    displayRound(currentRoundIndex);
  } else if (currentRoundIndex < aesRoundsData.length - 1) {
    currentRoundIndex++;
    currentStepIndex = 0;
    displayRound(currentRoundIndex);
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    displayRound(currentRoundIndex);
  } else if (currentRoundIndex > 0) {
    currentRoundIndex--;
    currentStepIndex = stepNames.length - 1;
    displayRound(currentRoundIndex);
  }
}

// Round navigation functions
function prevRound() {
  if (currentRoundIndex > 0) {
    currentRoundIndex--;
    currentStepIndex = 0;
    displayRound(currentRoundIndex);
  }
}

function nextRound() {
  if (currentRoundIndex < aesRoundsData.length - 1) {
    currentRoundIndex++;
    currentStepIndex = 0;
    displayRound(currentRoundIndex);
  }
}

//rotates left with 1 unit
function rotateLeftOneUnit(l){
  let temp = []
  temp = l.slice(1)
  temp.push(l[0])
  return temp
}

function leftShift(l, shiftBy){
  for(let i=0;i<shiftBy;i++){
    l = rotateLeftOneUnit(l)
  }
  return l
}

function xorList(l1,l2){
  let res = []
  for(let i=0;i<l1.length;i++){
    res.push(l1[i]^l2[i])
  }
  return res
}

function padTo15(str) {
  let padding = '';
  for(let i=0; i<15-str.length; i++) {
    padding += '0';
  }
  return padding + str;
}

function count(l,num){
  let count = 0
  for(let i=0;i<l.length;i++)
    if(l[i]==num){
      count++
    }
  return count
}

function GFmultiply(A,B,N){ //145
  A = dec2bin(A);
  B = dec2bin(B);
  A = padTo15(A);
  B = padTo15(B);
  let tempA = []
  let tempB = []
  for(let i=0;i<A.length;i++){
    tempA.push(parseInt(A.charAt(i)))
    tempB.push(parseInt(B.charAt(i)))
  }
  A = tempA
  B = tempB
  if(count(A,0)==2*N-1 || count(B,0)==2*N-1){
    return A
  }
  let res = []
  for(let i=0;i<2*N-1;i++){
    res[i] = 0
  }
  let shift_count = 2*(N-1)
  for(let i = 0;i<B.length;i++){
    if(B[i]==1){
      res = xorList(res, leftShift(A, shift_count))
    }
    shift_count -= 1
  }
  if(N == 8){
    let nonRed = [0,0,0,0,0,0,1,0,0,0,1,1,0,1,1]
    while(res.indexOf(1)<=6){
      let temp = res.indexOf(1)
      let count = 6 - temp
      let L = leftShift(nonRed, count)
      res = xorList(res, L)
    }
  }
  res_string = '';
  for(let ch of res) {
    res_string += ch;
  }
  return res_string.substring(7);
}

function hexToBinary(hex) {
  return parseInt(hex, 16).toString(2).padStart(8, '0');
}

function createTable(tableData) {
  var table = document.createElement('table');
  var tableBody = document.createElement('tbody');

  tableData.forEach(function(rowData) {
    var row = document.createElement('tr');

    rowData.forEach(function(cellData) {
      var cell = document.createElement('td');
      var binaryData = hexToBinary(cellData);
      cell.title = binaryData;
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);

  return table;
}
