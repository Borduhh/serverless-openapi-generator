module.exports = {
  release: {
    branches: ['main'],
  },
  plugins: [
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
