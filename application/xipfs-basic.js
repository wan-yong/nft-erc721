'use strict'

/* import the ipfs-http-client library */
const { create } = require('ipfs-http-client')
//const { all } = require('it-all')
const uint8ArrayConcat = require('uint8arrays/concat')

async function main() {

  /* Create an instance of the client */
  const client = create('https://ipfs.infura.io:5001/api/v0');

  /* upload the file */
  //const added = await client.add(file);

  /* or a string */
 // const inputStr = `hello world${Date.now()}`
 // const added = await client.add(inputStr)
 // console.log(`*** Result: ${added.path}`)

  const arr = uint8ArrayConcat(await iterator(client.cat(`QmNfweRQ2EqR1PPz1wAC8m7zu6j3nbvDkbt38e3AJYGqUD`)))
  console.log(`*** Arr: ${arr}`)
}

async function iterator(source){
const arr = []

for await (const entry of source) {
  arr.push(entry)
  }

  return arr
}

main()
