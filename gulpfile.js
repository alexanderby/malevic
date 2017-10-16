const gulp = require('gulp');
const path = require('path');
const rename = require('gulp-rename');
const merge = require('merge-stream');
const source = require('vinyl-source-stream');
const rollup = require('rollup-stream');
const typescript = require('@alexlur/rollup-plugin-typescript');
const uglify = require('rollup-plugin-uglify');
const less = require('gulp-less');
const cssmin = require('gulp-cssmin');
const autoprefix = require('gulp-autoprefixer');
const package = require('./package');

const date = (new Date()).toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const banner = `/* ${package.name}@${package.version} - ${date} */`;

function buildJS(options, { out, ts = {}, minify = false } = {}) {
    const dir = path.dirname(out);
    const file = path.basename(out);
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

function buildCSS({ input, out, minify = false }) {
    const dir = path.dirname(out);
    const file = path.basename(out);
    let stream = gulp.src(input)
        .pipe(less())
        .pipe(autoprefix({
            browsers: ['last 2 versions']
        }))
        .pipe(rename(file));
    if (minify) {
        stream = stream.pipe(cssmin());
    }
    return stream
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

        buildJS({
            input: './entries/index.ts',
            format: 'es',
        }, { out: './index.js', ts: { target: 'es2015' } }),
        buildJS({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, { out: './umd/index.js', ts: { target: 'es5' } }),
        buildJS({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, { out: './umd/index.min.js', minify: true, ts: { target: 'es5' } }),

        buildJS(plugin({
            input: './entries/animation.ts',
            format: 'es',
        }), { out: './animation.js', ts: { target: 'es2015' } }),
        buildJS(plugin({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }), { out: './umd/animation.js', ts: { target: 'es5' } }),
        buildJS(plugin({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }), { out: './umd/animation.min.js', minify: true, ts: { target: 'es5' } }),

        buildJS(plugin({
            input: './entries/controls.ts',
            format: 'es',
        }), { out: './controls.js', ts: { target: 'es2015' } }),
        buildJS(plugin({
            input: './entries/controls.ts',
            format: 'umd',
            name: 'MalevicControls'
        }), { out: './umd/controls.js', ts: { target: 'es5' } }),
        buildJS(plugin({
            input: './entries/controls.ts',
            format: 'umd',
            name: 'MalevicControls'
        }), { out: './umd/controls.min.js', minify: true, ts: { target: 'es5' } }),
        buildCSS({
            input: './entries/controls.less',
            out: './umd/controls.css'
        }),
        buildCSS({
            input: './entries/controls.less',
            out: './umd/controls.min.css',
            minify: true
        })
    );
});

gulp.task('build-examples', () => {
    merge(
        buildJS({
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
            }),
        buildCSS({
            input: './examples/style.less',
            out: './examples/style.css'
        })
    );
});
