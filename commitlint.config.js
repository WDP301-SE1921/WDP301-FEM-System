module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // tinh nang moi
        'fix', // sua bug
        'docs', // tai lieu
        'style', // format, khong doi logic
        'refactor', // refactor code
        'perf', // toi uu hieu nang
        'test', // them/sua test
        'build', // build system, dependencies
        'ci', // CI config
        'chore', // viec vat khac
        'revert', // revert commit
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
