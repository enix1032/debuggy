import debuggy from "@en32/debuggy";

const warn = debuggy.buffered("<hYb>WARNING<s>", "myCustom", {
  mode: "interval",
  interval: 2000,
});

for (let i = 0; i < 5; i++) {
  warn({ id: i, msg: `batched warning ${i}` });
}

// berhentikan interval & bersihkan buffer
setTimeout(() => {
  warn.dispose();
}, 10000);

const asyncLogger = debuggy.buffered("<hg>ASYNC<s>", "default", { mode: "async" });

(async () => {
  for await (const entry of asyncLogger.stream) {
    console.log("Received:", entry);
  }
})();

asyncLogger.log({ foo: 1 });
asyncLogger.log({ foo: 2 });

// hentikan stream
setTimeout(() => {
  asyncLogger.dispose();
}, 5000);
