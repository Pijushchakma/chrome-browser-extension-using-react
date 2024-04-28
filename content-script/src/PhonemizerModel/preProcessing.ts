const TEXT_VOCAB: { [key: string]: number } = {
  _: 0,
  "<bn>": 1,
  "<end>": 2,
  "ঁ": 3,
  "ং": 4,
  "ঃ": 5,
  অ: 6,
  আ: 7,
  ই: 8,
  ঈ: 9,
  উ: 10,
  ঊ: 11,
  ঋ: 12,
  এ: 13,
  ঐ: 14,
  ও: 15,
  ঔ: 16,
  ক: 17,
  খ: 18,
  গ: 19,
  ঘ: 20,
  ঙ: 21,
  চ: 22,
  ছ: 23,
  জ: 24,
  ঝ: 25,
  ঞ: 26,
  ট: 27,
  ঠ: 28,
  ড: 29,
  ঢ: 30,
  ণ: 31,
  ত: 32,
  থ: 33,
  দ: 34,
  ধ: 35,
  ন: 36,
  প: 37,
  ফ: 38,
  ব: 39,
  ভ: 40,
  ম: 41,
  য: 42,
  র: 43,
  ল: 44,
  শ: 45,
  ষ: 46,
  স: 47,
  হ: 48,
  ড়: 49,
  ঢ়: 50,
  য়: 51,
  "া": 52,
  "ি": 53,
  "ী": 54,
  "ু": 55,
  "ূ": 56,
  "ৃ": 57,
  "ে": 58,
  "ৈ": 59,
  "ো": 60,
  "ৌ": 61,
  "্": 62,
  ৎ: 63,
  "\u200c": 64,
  "\u200d": 65,
};

// For character normalizing
export const charNormalize = (chars: string): string => {
  chars = chars.replace(
    String.fromCharCode(2437) + String.fromCharCode(2494),
    String.fromCharCode(2438)
  ); // অ + া = আ
  chars = chars.replace(
    String.fromCharCode(2503) + String.fromCharCode(2494),
    String.fromCharCode(2507)
  ); // ে + া = ো
  chars = chars.replace(
    String.fromCharCode(2503) + String.fromCharCode(2519),
    String.fromCharCode(2508)
  ); // ে + ৗ  = ৌ
  chars = chars.replace(
    String.fromCharCode(2494) + String.fromCharCode(2503),
    String.fromCharCode(2507)
  ); // া + ে= ো
  chars = chars.replace(
    String.fromCharCode(2519) + String.fromCharCode(2503),
    String.fromCharCode(2508)
  ); // ৗ  +  ে  = ৌ
  chars = chars.replace(
    String.fromCharCode(2476) + String.fromCharCode(2492),
    String.fromCharCode(2480)
  ); // ব + ় = র
  chars = chars.replace(
    String.fromCharCode(2465) + String.fromCharCode(2492),
    String.fromCharCode(2524)
  ); // ড + ় = ড়
  chars = chars.replace(
    String.fromCharCode(2466) + String.fromCharCode(2492),
    String.fromCharCode(2525)
  ); // ঢ + ় = ঢ়
  chars = chars.replace(
    String.fromCharCode(2479) + String.fromCharCode(2492),
    String.fromCharCode(2527)
  ); // য + ় = য়
  chars = chars.replace(String.fromCharCode(8204), ""); // zero width non-joiner = ''
  chars = chars.replace(String.fromCharCode(8205), ""); // zero width joiner = ''
  chars = chars.replace(String.fromCharCode(65279), "");
  chars = chars.replace(String.fromCharCode(2544), String.fromCharCode(2480));
  chars = chars.replace(String.fromCharCode(2545), String.fromCharCode(2480));
  chars = chars.trim();
  return chars;
};

export const removePunctuationAndSplit = (text: string): string[] => {
  var pattern = /[,।?!;:—“”‘’'"\\.…\-]/g;
  text = text.replace(pattern, "");
  var wordList = text.split(/\s+/);
  return wordList;
};

export const getBatch = (
  sortedList: string[],
  batchSize: number,
  n_repeat: number,
  lastWordLen: number
): [number[][][], string[][]] => {
  var wordBatches: string[][] = [];
  var newBatch: string[] = [];
  var count = 0;

  for (var i = 0; i < sortedList.length; i++) {
    var item = sortedList[i];
    if (count === batchSize) {
      wordBatches.push(newBatch);
      newBatch = [];
      count = 0;
    }
    newBatch.push(item);
    count++;
  }
  if (count !== 0) {
    wordBatches.push(newBatch);
  }

  var finalBatches: number[][][] = [];

  for (var j = 0; j < wordBatches.length; j++) {
    var batch = wordBatches[j];
    var tempBatch: number[][] = [];

    for (var k = 0; k < batch.length; k++) {
      var word = batch[k];
      var tempArray: number[] = [];
      for (var l = 0; l < word.length; l++) {
        var char = word[l];
        if (TEXT_VOCAB[char]) {
          for (var m = 0; m < n_repeat; m++) {
            tempArray.push(TEXT_VOCAB[char]);
          }
        }
      }
      tempArray.unshift(1);
      tempArray.push(2);
      tempArray = tempArray.concat(
        Array(lastWordLen - tempArray.length).fill(0)
      );
      tempBatch.push(tempArray);
    }
    finalBatches.push(tempBatch);
  }
  return [finalBatches, wordBatches];
};
