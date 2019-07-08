const rollup = require('rollup');
const rollupPluginTypescript = require('rollup-plugin-typescript');
const rollupPluginUglify = require('rollup-plugin-uglify');
const typescript = require('typescript');
const package = require('../package');

const date = new Date().toLocaleDateString('en-us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});
const banner = `/* ${package.name}@${package.version} - ${date} */`;

async function buildJS({
    src,
    dest,
    minify = false,
    globalName = null,
    dependencies = null,
    moduleFormat = 'umd',
    moduleExports = null,
    sourceMaps = null,
    ts = {},
}) {
    const bundle = await rollup.rollup({
        input: src,
        external: dependencies ? Object.keys(dependencies) : null,
        plugins: [
            rollupPluginTypescript(
                Object.assign(
                    {
                        typescript,
                        removeComments: true,
                    },
                    ts,
                ),
            ),
            minify
                ? rollupPluginUglify.uglify({
                      output: {preamble: banner},
                  })
                : null,
        ].filter((p) => p),
    });

    await bundle.write({
        banner,
        exports: moduleExports,
        file: dest,
        format: moduleFormat,
        globals: dependencies,
        name: globalName,
        sourcemap: sourceMaps,
        strict: true,
    });
}

async function buildPackage({src, esm, umd, min, global, dependencies = {}}) {
    await Promise.all([
        buildJS({
            src,
            dest: esm,
            dependencies,
            moduleFormat: 'es',
            ts: {target: 'es2015'},
        }),
        buildJS({
            src,
            dest: umd,
            dependencies,
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'},
        }),
        buildJS({
            src,
            dest: min,
            minify: true,
            dependencies,
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'},
        }),
    ]);
}

async function release() {
    await Promise.all([
        buildPackage({
            global: 'Malevic',
            src: './src/index.ts',
            esm: './index.mjs',
            umd: './umd/index.js',
            min: './umd/index.min.js',
        }),
        buildPackage({
            global: 'Malevic.Animation',
            src: './src/animation/index.ts',
            dependencies: {
                'malevic/dom': 'Malevic.DOM',
                'malevic/string': 'Malevic.String',
            },
            esm: './animation.mjs',
            umd: './umd/animation.js',
            min: './umd/animation.min.js',
        }),
        buildPackage({
            global: 'Malevic.Canvas',
            src: './src/canvas/index.ts',
            esm: './canvas.mjs',
            umd: './umd/canvas.js',
            min: './umd/canvas.min.js',
        }),
        buildPackage({
            global: 'Malevic.DOM',
            src: './src/dom/index.ts',
            esm: './dom.mjs',
            umd: './umd/dom.js',
            min: './umd/dom.min.js',
        }),
        buildPackage({
            global: 'Malevic.Forms',
            src: './src/forms/index.ts',
            dependencies: {
                'malevic/dom': 'Malevic.DOM',
            },
            esm: './forms.mjs',
            umd: './umd/forms.js',
            min: './umd/forms.min.js',
        }),
        buildPackage({
            global: 'Malevic.State',
            src: './src/state/index.ts',
            dependencies: {
                'malevic/dom': 'Malevic.DOM',
            },
            esm: './state.mjs',
            umd: './umd/state.js',
            min: './umd/state.min.js',
        }),
        buildPackage({
            global: 'Malevic.String',
            src: './src/string/index.ts',
            esm: './string.mjs',
            umd: './umd/string.js',
            min: './umd/string.min.js',
        }),
        buildJS({
            src: './src/full.ts',
            dest: './umd/malevic.min.js',
            minify: true,
            dependencies: {},
            globalName: 'Malevic',
            moduleFormat: 'umd',
            ts: {target: 'es5'},
        }),
    ]);
}

async function examples() {
    await buildJS({
        src: './examples/index.tsx',
        dest: './examples/index.js',
        moduleFormat: 'iife',
        moduleExports: 'none',
        sourceMaps: 'inline',
        ts: {
            target: 'es5',
            jsx: 'react',
            jsxFactory: 'm',
        },
    });
}

async function run() {
    const args = process.argv.slice(2);
    if (args.includes('--release')) {
        await release();
    }
    if (args.includes('--examples')) {
        await examples();
    }
}

run();
