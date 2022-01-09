'use strict'

/* import the ipfs-http-client library */
const { create } = require('ipfs-http-client')
const concatBuffers = require('concat-buffers')
const { utf8ArrayToString, base64Encode } = require('base64-utf8-array')

async function main() {

  /* Create an instance of the client */
  const client = create('https://ipfs.infura.io:5001/api/v0');

  /* upload the file */
  //const added = await client.add(file);

  /* or a string */
 // const inputStr = `hello world${Date.now()}`
 // const added = await client.add(inputStr)
 // console.log(`*** Result: ${added.path}`)

  const concatBytes = concatBuffers(await iterator(client.cat(`QmNfweRQ2EqR1PPz1wAC8m7zu6j3nbvDkbt38e3AJYGqUD`)))
  const arrStr = utf8ArrayToString(concatBytes)
  console.log(`*** Arr: ${arrStr}`)
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

main()
