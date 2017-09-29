const gulp = require('gulp');
const merge = require('merge-stream');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const typescript = require('rollup-plugin-typescript');
const package = require('./package');

const date = (new Date()).toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const banner = `/* ${package.name}@${package.version} - ${date} */`;

function build(options, dir, file, { ts = {}, uglify = false } = {}) {
    let stream = rollup(Object.assign({
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

gulp.task('default', () => {
    merge(

        build({
            input: './entries/index.ts',
            format: 'es',
        }, './', 'index.js', { ts: { target: 'es6' } }),
        build({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, './umd', 'index.js'),
        build({
            input: './entries/index-umd.ts',
            format: 'umd',
            name: 'Malevic'
        }, './umd', 'index.min.js', { uglify: true }),

        build({
            input: './entries/animation.ts',
            format: 'es',
        }, './', 'animation.js', { ts: { target: 'es6' } }),
        build({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }, './umd', 'animation.js'),
        build({
            input: './entries/animation-umd.ts',
            format: 'umd',
            name: 'MalevicAnimation'
        }, './umd', 'animation.min.js', { uglify: true }),

        build({
            input: './entries/svg.ts',
            format: 'es',
        }, './', 'svg.js', { ts: { target: 'es6' } }),
        build({
            input: './entries/svg.ts',
            format: 'umd',
            name: 'MalevicSVG'
        }, './umd', 'svg.js'),
        build({
            input: './entries/svg.ts',
            format: 'umd',
            name: 'MalevicSVG'
        }, './umd', 'svg.min.js', { uglify: true })
    );
});

gulp.task('build-examples', () => {
    merge(
        build({
            input: './examples/examples.ts',
            format: 'iife',
            exports: 'none',
            sourcemap: true
        }, './examples/', 'examples.js')
    );
});
