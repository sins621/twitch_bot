async function step1() {
  console.log("Step 1 starting...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("Step 1 done");
}

async function step2() {
  console.log("Step 2 starting...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Step 2 done");
}

async function runSteps() {
  await step1();
  await step2();
}

runSteps();
