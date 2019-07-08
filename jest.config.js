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
        'malevic/animation': '<rootDir>/src/animation',
        'malevic/canvas': '<rootDir>/src/canvas',
        'malevic/dom': '<rootDir>/src/dom',
        'malevic/forms': '<rootDir>/src/forms',
        'malevic/state': '<rootDir>/src/state',
        'malevic/string': '<rootDir>/src/string',
        'malevic': '<rootDir>/src',
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
