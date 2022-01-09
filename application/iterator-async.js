
async function main(){

  // This can also be an iterator, async iterator, generator, etc
  const values = [10, 11, 12, 13, 14]
  const result = await iterator(values)
   
  console.info(result) // 0, 1, 2, 3, 4
}

//////////////////////////////////////////////
// -------- Iterator helpers
//////////////////////////////////////////////

/**
 *  * Collects all values from an (async) iterable into an array and returns it.
 *  
 *   @template T
 *   @param {AsyncIterable<T>|Iterable<T>} source
*/
async function iterator(source) {
  const arr = []

  for await (const entry of source) {
    arr.push(entry)
  }

  return arr
}

main();