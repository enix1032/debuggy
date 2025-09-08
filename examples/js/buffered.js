import { buffered } from "@en32/debuggy/buffered";

// --- Interval mode example ---
const warn = buffered("<hYb>WARNING<s>", "myCustom", { mode: "interval", interval: 2000 });

// Push multiple logs quickly → they will be flushed together every 2 seconds
for (let i = 0; i < 5; i++) {
  warn({ id: i, msg: `batched warning ${i}` });
}

// --- Async mode example ---
const { log: errorLog, stream } = buffered("<rh>ERROR<s>", "myCustom", { mode: "async" });

// Produce logs
for (let i = 0; i < 3; i++) {
  errorLog({ id: i, msg: `async error ${i}` });
}

// Consume logs as an async stream
(async () => {
  console.log("--- Start consuming async stream ---");
  let count = 0;
  for await (const entry of stream) {
    console.log(">>> Stream received:", entry);
    count++;
    if (count >= 3) {
      console.log("--- Stopping async consumer ---");
      break; // stop after 3 entries
    }
  }
})();

// Auto-stop after first interval flush
setTimeout(() => {
  console.log("\n=== Interval flush should have happened above ===");
  console.log("--- Exiting now ---\n");
  process.exit(0);
}, 2500);
