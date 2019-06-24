module.exports = {
    verbose: true,
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    testRegex: 'tests/.*\\.tests\\.ts(x?)$',
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js'
    ],
    moduleNameMapper: {
        'malevic/animation': '<rootDir>/entries/animation',
        'malevic/dom': '<rootDir>/entries/dom',
        'malevic/forms': '<rootDir>/entries/forms',
        'malevic/state': '<rootDir>/entries/state',
        'malevic/string': '<rootDir>/entries/string',
        'malevic': '<rootDir>/entries',
    },
    collectCoverage: false,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}'
    ],
    coveragePathIgnorePatterns: [
        '^.+\\.d\\.ts$'
    ]
};
