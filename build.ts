// Bun

const build = async (entrypoints: string[]) => {
  await Bun.build({
    entrypoints,
    outdir: './dist',
    naming: "[dir]/[name].[ext]", // default
    // @ts-ignore
    splitting: false,
    minify: false,
    format: "esm",
    target: "node",
  })
}

build([
  './src/debuggy.ts',
  './src/utils.ts',
  './src/buffered.ts',
])
