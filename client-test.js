// list global objects of phantom instance
Object.keys(this).sort().forEach(function(key) {
  console.log(key)
})