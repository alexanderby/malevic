const gulp = require('gulp');
const path = require('path');
const merge = require('merge-stream');
const source = require('vinyl-source-stream');
const rollup = require('rollup-stream');
const typescript = require('@alexlur/rollup-plugin-typescript');
const uglify = require('rollup-plugin-uglify');
const package = require('./package');

const date = (new Date()).toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const banner = `/* ${package.name}@${package.version} - ${date} */`;

function buildJS(options, { output, ts = {}, minify = false } = {}) {
    const dir = path.dirname(output);
    const file = path.basename(output);
    const stream = rollup(Object.assign({
        strict: true,
        format: 'umd',
        banner,
        rollup: require('rollup'),
        plugins: [
            typescript(Object.assign({
                typescript: require('typescript'),
                removeComments: true
            }, ts)),
            minify ? uglify({
                output: { preamble: banner }
            }) : null
        ].filter((p) => p)
    }, options));

    return stream
        .pipe(source(file))
        .pipe(gulp.dest(dir));
}

function buildPackage({ es2015, umd, min, global, plugin }) {
    const extend = plugin ? (obj) => Object.assign(obj, {
        external: ['malevic'],
        globals: { 'malevic': 'Malevic' }
    }) : (obj) => obj;
    return [
        buildJS(extend({
            input: es2015[0],
            format: 'es',
        }), { output: es2015[1], ts: { target: 'es2015' } }),
        buildJS(extend({
            input: umd[0],
            format: 'umd',
            name: global
        }), { output: umd[1], ts: { target: 'es5' } }),
        buildJS(extend({
            input: min[0],
            format: 'umd',
            name: global
        }), { output: min[1], minify: true, ts: { target: 'es5' } }),
    ];
}

gulp.task('default', () => {
    merge(

        ...buildPackage({
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
        ...buildPackage({
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
        ...buildPackage({
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
        })
    );
});

gulp.task('build-examples', () => {
    buildJS(
        {
            input: './examples/examples.tsx',
            format: 'iife',
            exports: 'none',
            sourcemap: 'inline'
        },
        {
            output: './examples/examples.js',
            ts: {
                target: 'es5',
                jsx: 'react',
                jsxFactory: 'html'
            }
        });
});
