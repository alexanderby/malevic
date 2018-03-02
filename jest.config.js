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
        'malevic/state': '<rootDir>/entries/state',
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
