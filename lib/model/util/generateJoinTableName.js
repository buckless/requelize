/**
 * Generate a jointable name based on two model names
 * @internal
 * @param  {string} a Model A name
 * @param  {string} b Model B name
 * @return {string} join table name
 */
module.exports = (a, b) => {
  return [a, b]
    .sort((n1, n2) => n1.toLowerCase().localeCompare(n2.toLowerCase()))
    .join('_')
}
