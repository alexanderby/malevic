const gulp = require('gulp');
const gulpConnect = require('gulp-connect');
const mergeStream = require('merge-stream');
const path = require('path');
const rollupStream = require('rollup-stream');
const sourceStream = require('vinyl-source-stream');
const typescriptPlugin = require('rollup-plugin-typescript');
const uglifyPlugin = require('rollup-plugin-uglify');
const package = require('./package');

const date = (new Date()).toLocaleDateString('en-us', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const banner = `/* ${package.name}@${package.version} - ${date} */`;

function buildJS({
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
    const dir = path.dirname(dest);
    const file = path.basename(dest);
    const stream = rollupStream({
        input: src,
        rollup: require('rollup'),
        external: dependencies ? Object.keys(dependencies) : null,
        globals: dependencies,
        output: {
            banner,
            exports: moduleExports,
            format: moduleFormat,
            name: globalName,
            sourcemap: sourceMaps,
            strict: true,
        },
        plugins: [
            typescriptPlugin(Object.assign({
                typescript: require('typescript'),
                removeComments: true
            }, ts)),
            minify ? uglifyPlugin({
                output: { preamble: banner }
            }) : null
        ].filter((p) => p),
    });

    return stream
        .pipe(sourceStream(file))
        .pipe(gulp.dest(dir));
}

function buildPackage({ es2015, umd, min, global, plugin }) {
    const dependencies = plugin ? { 'malevic': 'Malevic' } : null;
    return [
        buildJS({
            src: es2015[0],
            dest: es2015[1],
            moduleFormat: 'es',
            ts: { target: 'es2015' }
        }),
        buildJS({
            src: umd[0],
            dest: umd[1],
            globalName: global,
            moduleFormat: 'umd',
            ts: { target: 'es5' }
        }),
        buildJS({
            src: min[0],
            dest: min[1],
            minify: true,
            globalName: global,
            moduleFormat: 'umd',
            ts: { target: 'es5' }
        })
    ];
}

gulp.task('default', () => {
    mergeStream(
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
        }),
        ...buildPackage({
            plugin: true,
            global: 'Malevic.State',
            es2015: [
                './entries/state.ts',
                './state.js'
            ],
            umd: [
                './entries/state.ts',
                './umd/state.js'
            ],
            min: [
                './entries/state.ts',
                './umd/state.min.js'
            ]
        })
    );
});

gulp.task('build-examples', () => {
    buildJS(
        {
            src: './examples/examples.tsx',
            dest: './examples/examples.js',
            moduleFormat: 'iife',
            moduleExports: 'none',
            sourceMaps: 'inline',
            ts: {
                target: 'es5',
                jsx: 'react',
                jsxFactory: 'html'
            }
        })
        .pipe(gulpConnect.reload());
});

gulp.task('watch', ['build-examples'], () => {
    gulpConnect.server({
        host: '0.0.0.0',
        port: 9002,
        root: './examples',
        livereload: true,
    });
    gulp.watch(
        [
            'src/**/*.ts',
            'entries/**/*.ts',
            'examples/**/*.tsx',
            'examples/index.html'
        ],
        ['build-examples']
    );
});
