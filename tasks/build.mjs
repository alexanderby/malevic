import {readFileSync} from 'fs';
import {rollup} from 'rollup';
import rollupPluginTerser from '@rollup/plugin-terser';
import rollupPluginTypescript from '@rollup/plugin-typescript';

const pkg = JSON.parse(readFileSync('./package.json'));
console.log(process.cwd())

const date = new Date().toLocaleDateString('en-us', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
});
const banner = `/* ${pkg.name}@${pkg.version} - ${date} */`;

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
    console.time(dest);

    const bundle = await rollup({
        input: src,
        external: dependencies ? Object.keys(dependencies) : null,
        plugins: [
            rollupPluginTypescript({
                ...ts,
                removeComments: true,
                noEmitOnError: true,
            }),
            minify ? rollupPluginTerser() : null,
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

    console.timeEnd(dest);
}

async function buildPackage({src, esm, umd, min, global, dependencies = {}}) {
    const packages = {
        [esm]: {
            moduleFormat: 'es',
            ts: {target: 'es2015'},
        },
        [umd]: {
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'},
        },
        [min]: {
            minify: true,
            globalName: global,
            moduleFormat: 'umd',
            ts: {target: 'es5'},
        },
    };
    for (const [dest, config] of Object.entries(packages)) {
        await buildJS({src, dest, dependencies, ...config});
    }
}

async function release() {
    await buildPackage({
        global: 'Malevic',
        src: 'src/index.ts',
        esm: 'index.mjs',
        umd: 'umd/index.js',
        min: 'umd/index.min.js',
    });
    await buildPackage({
        global: 'Malevic.Animation',
        src: 'src/animation/index.ts',
        dependencies: {
            'malevic/dom': 'Malevic.DOM',
            'malevic/string': 'Malevic.String',
        },
        esm: 'animation.mjs',
        umd: 'umd/animation.js',
        min: 'umd/animation.min.js',
    });
    await buildPackage({
        global: 'Malevic.Canvas',
        src: 'src/canvas/index.ts',
        esm: 'canvas.mjs',
        umd: 'umd/canvas.js',
        min: 'umd/canvas.min.js',
    });
    await buildPackage({
        global: 'Malevic.DOM',
        src: 'src/dom/index.ts',
        esm: 'dom.mjs',
        umd: 'umd/dom.js',
        min: 'umd/dom.min.js',
    });
    await buildPackage({
        global: 'Malevic.Forms',
        src: 'src/forms/index.ts',
        dependencies: {
            'malevic/dom': 'Malevic.DOM',
        },
        esm: 'forms.mjs',
        umd: 'umd/forms.js',
        min: 'umd/forms.min.js',
    });
    await buildPackage({
        global: 'Malevic.State',
        src: 'src/state/index.ts',
        dependencies: {
            'malevic/dom': 'Malevic.DOM',
        },
        esm: 'state.mjs',
        umd: 'umd/state.js',
        min: 'umd/state.min.js',
    });
    await buildPackage({
        global: 'Malevic.String',
        src: 'src/string/index.ts',
        esm: 'string.mjs',
        umd: 'umd/string.js',
        min: 'umd/string.min.js',
    });
    await buildJS({
        src: 'src/full.ts',
        dest: 'umd/malevic.min.js',
        minify: true,
        dependencies: {},
        globalName: 'Malevic',
        moduleFormat: 'umd',
        ts: {target: 'es5'},
    });
}

async function examples() {
    await buildJS({
        src: 'examples/index.tsx',
        dest: 'examples/index.js',
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
