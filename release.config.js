module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/changelog',
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
