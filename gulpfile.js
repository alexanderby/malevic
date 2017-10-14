const gulp = require('gulp');
const path = require('path');
const merge = require('merge-stream');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const typescript = require('rollup-plugin-typescript');
const package = require('./package');

const date = (new Date()).toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const banner = `/* ${package.name}@${package.version} - ${date} */`;

function build(options, { out, ts = {}, uglify = false } = {}) {
    const dir = path.dirname(out);
    const file = path.basename(out);
    const stream = rollup(Object.assign({
        strict: true,
        format: 'umd',
        banner,
        rollup: require('rollup'),
        plugins: [
            require('rollup-plugin-typescript')(Object.assign({
                typescript: require('typescript'),
                removeComments: true
            }, ts)),
            uglify ? require('rollup-plugin-uglify')({
                output: { preamble: banner }
            }) : null
        ].filter((p) => p)
    }, options));

    return stream
        .pipe(source(file))
        .pipe(gulp.dest(dir));
}

function plugin(rollupConfig) {
    return Object.assign(rollupConfig, {
        external: [
            'malevic'
        ],
        globals: {
            'malevic': 'Malevic'
        }
    });
}

gulp.task('default', () => {
    merge(

        build({
            input: './entries/index.ts',
            format: 'es',
        }, { out: './index.js', ts: { target: 'es2015' } }),
        build({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, { out: './umd/index.js', ts: { target: 'es5' } }),
        build({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, { out: './umd/index.min.js', uglify: true, ts: { target: 'es5' } }),

        build(plugin({
            input: './entries/animation.ts',
            format: 'es',
        }), { out: './animation.js', ts: { target: 'es2015' } }),
        build(plugin({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }), { out: './umd/animation.js', ts: { target: 'es5' } }),
        build(plugin({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }), { out: './umd/animation.min.js', uglify: true, ts: { target: 'es5' } })
    );
});

gulp.task('build-examples', () => {
    merge(
        build({
            input: './examples/examples.tsx',
            format: 'iife',
            exports: 'none',
            sourcemap: 'inline'
        }, {
                out: './examples/examples.js',
                ts: {
                    target: 'es5',
                    jsx: 'react',
                    jsxFactory: 'html'
                }
            })
    );
});
