/**
 *  * Collects all values from an (async) iterable into an array and returns it.
 *  
 *   @template T
 *   @param {AsyncIterable<T>|Iterable<T>} source
*/
	function iterator (source) {
		  const arr = []

		  for (const entry of source) {
			      arr.push(entry)
			    }

		  return arr
	}


// This can also be an iterator, async iterator, generator, etc
 const values = [0, 1, 2, 3, 4]
//  
  const result = iterator(values)
//   
   console.info(result) // 0, 1, 2, 3, 4
