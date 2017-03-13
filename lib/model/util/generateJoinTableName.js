module.exports = (a, b) => {
  return [a, b]
    .sort((n1, n2) => n1.toLowerCase().localeCompare(n2.toLowerCase()))
    .join('_')
}
