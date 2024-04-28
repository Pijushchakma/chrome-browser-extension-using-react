const PHONEME_VOCAB_swapped: any = {
  0: "_",
  1: "<bn>",
  2: "<end>",
  3: "∂",
  4: "a",
  5: "i",
  6: "u",
  7: "e",
  8: "o",
  9: "ε",
  10: "ð",
  11: "A",
  12: "I",
  13: "U",
  14: "E",
  15: "O",
  16: "Є",
  17: "ι",
  18: "θ",
  19: "μ",
  20: "y",
  21: "Y",
  22: "w",
  23: "k",
  24: "K",
  25: "g",
  26: "G",
  27: "N",
  28: "c",
  29: "C",
  30: "j",
  31: "z",
  32: "T",
  33: "т",
  34: "D",
  35: "Δ",
  36: "t",
  37: "τ",
  38: "d",
  39: "δ",
  40: "n",
  41: "p",
  42: "f",
  43: "b",
  44: "v",
  45: "m",
  46: "s",
  47: "S",
  48: "l",
  49: "r",
  50: "R",
  51: "ρ",
  52: "H",
};

function getLenUtilStop(sequence: any, endIndex: any) {
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i] === endIndex) {
      return i + 1;
    }
  }
  return sequence.length;
}

function softmax(array: any) {
  const result = [];
  for (const x of array) {
    const exp_vals = x.map((val: any) => Math.exp(val));
    const exp_sum = exp_vals.reduce((acc: any, val: any) => acc + val, 0);
    const softmax_vals = exp_vals.map((exp_val: any) => exp_val / exp_sum);
    // console.log("the softmax value is :", softmax_vals);
    result.push(softmax_vals);
  }
  return result;
}
// function decode(sequence, removeSpecialTokens = false, charRepeats = 1) {
//   let decoded = [];
//   for (let token of sequence) {
//     if (![0, 1, 2].includes(token)) {
//       if (PHONEME_VOCAB_swapped[token]) {
//         decoded.push(PHONEME_VOCAB_swapped[token]);
//       }
//     }
//   }

//   return decoded.join("");
// }
function maxValueAndIndex(arr: any) {
  const maxValues = [];
  const maxIndices = [];
  for (let row of arr) {
    let maxVal = Math.max(...row);
    let maxIndex = row.indexOf(maxVal);
    maxValues.push(maxVal);
    maxIndices.push(maxIndex);
  }
  return { maxValues, maxIndices };
}
function uniqueConsecutive(inputList: any) {
  const uniqueConsecutiveValues = [];
  let prevValue = null;
  for (let value of inputList) {
    if (value !== prevValue) {
      uniqueConsecutiveValues.push(value);
    }
    prevValue = value;
  }
  return uniqueConsecutiveValues;
}
function getDedupTokens(logitsBatchList: any) {
  // console.log("type of logit batch lISt : ", logitsBatchList);

  const logitsBatch = [];
  for (let batch of logitsBatchList) {
    // console.log("each batch is : ", batch);
    const tmpBatch = softmax(batch);
    logitsBatch.push(tmpBatch);
  }
  // console.log("logit batch is : ", logitsBatch);

  const outTokens = [];
  for (let i = 0; i < logitsBatch.length; i++) {
    const logits = logitsBatch[i];

    // const maxLogits = maxValueAndIndex(logits).maxValues;
    const maxIndices = maxValueAndIndex(logits).maxIndices;
    const consTokens = uniqueConsecutive(maxIndices);
    outTokens.push(consTokens);
  }

  return outTokens;
}
function decode(
  sequence: any,
  remove_special_tokens = false,
  char_repeats = 1
) {
  let decoded = [];

  for (const token of sequence) {
    if (![0, 1, 2].includes(token)) {
      const t = parseInt(token);
      if (PHONEME_VOCAB_swapped[t] !== undefined) {
        decoded.push(PHONEME_VOCAB_swapped[t]);
      }
    }
  }

  return decoded.join("");
}

export const postProcessing = (
  logitsBatches: any,
  textBatch: any,
  endIndex = 2
) => {
  const tokens = getDedupTokens(logitsBatches);
  // console.log("tokens are : ", tokens);
  const predictions: any = {};
  for (let i = 0; i < textBatch.length; i++) {
    const text = textBatch[i];
    const output = tokens[i];
    const seqLen = getLenUtilStop(output, endIndex);
    predictions[text] = decode(output.slice(0, seqLen));
  }
  // console.log("the prediction is :", predictions);
  return predictions;
};
