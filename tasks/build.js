const rollup = require('rollup');
const rollupPluginTypescript = require('rollup-plugin-typescript');
const rollupPluginUglify = require('rollup-plugin-uglify');
const typescript = require('typescript');
const package = require('../package');

const date = (new Date()).toLocaleDateString('en-us', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
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
            rollupPluginTypescript(Object.assign({
                typescript,
                removeComments: true
            }, ts)),
            minify ? rollupPluginUglify.uglify({
                output: {preamble: banner}
            }) : null
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

async function buildPackage({es2015, umd, min, global, plugin}) {
    const dependencies = plugin ? {'malevic': 'Malevic'} : null;
    await Promise.all([
        buildJS({
            src: es2015[0],
            dest: es2015[1],
            dependencies,
            moduleFormat: 'es',
            ts: {target: 'es2015'}
        }),
        buildJS({
            src: umd[0],
            dest: umd[1],
            dependencies,
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'}
        }),
        buildJS({
            src: min[0],
            dest: min[1],
            minify: true,
            dependencies,
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'}
        }),
    ]);
}

async function release() {
    await Promise.all([
        buildPackage({
            global: 'Malevic',
            es2015: [
                './entries/index.ts',
                './index.js'
            ],
            umd: [
                './entries/index.ts',
                './umd/index.js'
            ],
            min: [
                './entries/index.ts',
                './umd/index.min.js'
            ]
        }),
        buildPackage({
            plugin: true,
            global: 'Malevic.Animation',
            es2015: [
                './entries/animation.ts',
                './animation.js'
            ],
            umd: [
                './entries/animation-umd.ts',
                './umd/animation.js'
            ],
            min: [
                './entries/animation-umd.ts',
                './umd/animation.min.js'
            ]
        }),
        buildPackage({
            plugin: true,
            global: 'Malevic.Forms',
            es2015: [
                './entries/forms.ts',
                './forms.js'
            ],
            umd: [
                './entries/forms.ts',
                './umd/forms.js'
            ],
            min: [
                './entries/forms.ts',
                './umd/forms.min.js'
            ]
        }),
    ]);
}

async function debug() {
    await buildJS(
        {
            src: './examples/examples.tsx',
            dest: './examples/examples.js',
            moduleFormat: 'iife',
            moduleExports: 'none',
            sourceMaps: 'inline',
            ts: {
                target: 'es5',
                jsx: 'react',
                jsxFactory: 'm'
            },
        });
}

async function run() {
    const args = process.argv.slice(2);
    if (args.includes('--release')) {
        await release();
    }
    if (args.includes('--debug')) {
        await debug();
    }
}

run();
