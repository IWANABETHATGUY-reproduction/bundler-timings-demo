import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const rolldownModule = process.env.ROLLDOWN_DIST
  ? pathToFileURL(resolve(process.env.ROLLDOWN_DIST)).href
  : 'rolldown';
const { rolldown } = await import(rolldownModule);

const sleepState = new Int32Array(new SharedArrayBuffer(4));

function delayOnce(ms) {
  let didDelay = false;

  return () => {
    if (didDelay) return;
    didDelay = true;
    Atomics.wait(sleepState, 0, 0, ms);
  };
}

function createSlowTestGroup({ chunkName, debugName, delayMs, moduleName }) {
  const delay = delayOnce(delayMs);

  return {
    ...(debugName ? { debugName } : {}),
    name() {
      return chunkName;
    },
    test(id) {
      delay();
      return id.endsWith(`/${moduleName}`);
    },
  };
}

const demos = {
  'slow-test': () => {
    return {
      description: 'Two slow group.test callbacks without debugName',
      groups: [
        createSlowTestGroup({
          chunkName: 'dep-a-chunk',
          delayMs: 1_600,
          moduleName: 'dep-a.js',
        }),
        createSlowTestGroup({
          chunkName: 'dep-b-chunk',
          delayMs: 1_800,
          moduleName: 'dep-b.js',
        }),
      ],
    };
  },
  'slow-name': () => {
    const delay = delayOnce(3_200);

    return {
      description: 'A slow group.name callback without debugName',
      groups: [
        {
          test: /dep-a\.js$/,
          name() {
            delay();
            return 'slow-name-chunk';
          },
        },
      ],
    };
  },
  'debug-name': () => {
    return {
      description: 'Two slow group.test callbacks with debugName',
      groups: [
        createSlowTestGroup({
          chunkName: 'dep-a-chunk',
          debugName: 'dependency A group',
          delayMs: 1_600,
          moduleName: 'dep-a.js',
        }),
        createSlowTestGroup({
          chunkName: 'dep-b-chunk',
          debugName: 'dependency B group',
          delayMs: 1_800,
          moduleName: 'dep-b.js',
        }),
      ],
    };
  },
};

const requestedDemo = process.argv[2] ?? 'all';
const demoNames = requestedDemo === 'all' ? Object.keys(demos) : [requestedDemo];

for (const demoName of demoNames) {
  const createDemo = demos[demoName];
  if (!createDemo) {
    throw new Error(`Unknown demo: ${demoName}`);
  }

  await runDemo(demoName, createDemo());
}

async function runDemo(demoName, { description, groups }) {
  console.log(`\n--- ${description} ---\n`);

  const bundle = await rolldown({
    cwd: import.meta.dirname,
    input: 'src/index.js',
    checks: { bundlerTimings: true },
  });

  try {
    await bundle.write({
      dir: `dist/${demoName}`,
      cleanDir: true,
      format: 'esm',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      codeSplitting: { groups },
    });
  } finally {
    await bundle.close();
  }
}
