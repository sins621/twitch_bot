let foo = "this is a word"

const [command, ...args] = foo.split(" ");

console.log(args.join(" "));