const gulp = require('gulp');
const merge = require('merge-stream');
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');
const typescript = require('rollup-plugin-typescript');

function build(options, dir, file) {
    let stream = rollup(Object.assign({
        strict: true,
        exports: 'named',
        format: 'umd',
        rollup: require('rollup'),
        plugins: [
            require('rollup-plugin-typescript')({
                typescript: require('typescript')
            })
        ]
    }, options));

    return stream
        .pipe(source(file))
        .pipe(gulp.dest(dir));
}

gulp.task('default', () => {
    merge(
        build({
            input: './index.ts',
            name: 'Malevic'
        }, './', 'index.js'),
        build({
            input: './plugins/animation.ts',
            name: 'MalevicAnimation',
            exports: 'default'
        }, './plugins/', 'animation.js'),
        build({
            input: './plugins/svg.ts',
            name: 'MalevicSVG',
            exports: 'default'
        }, './plugins/', 'svg.js')
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
