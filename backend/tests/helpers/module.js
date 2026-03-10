const path = require('path');

function resolveFromBackend(request) {
  return require.resolve(request, { paths: [path.resolve(__dirname, '..', '..')] });
}

function freshRequireWithMocks(modulePath, mocks = {}) {
  const originalEntries = [];

  for (const [request, mockExports] of Object.entries(mocks)) {
    const resolved = request.startsWith('.') || request.startsWith('/')
      ? require.resolve(path.resolve(path.dirname(modulePath), request))
      : resolveFromBackend(request);

    originalEntries.push([resolved, require.cache[resolved]]);
    require.cache[resolved] = {
      id: resolved,
      filename: resolved,
      loaded: true,
      exports: mockExports,
    };
  }

  delete require.cache[require.resolve(modulePath)];
  const loadedModule = require(modulePath);

  return {
    module: loadedModule,
    restore() {
      delete require.cache[require.resolve(modulePath)];
      for (const [resolved, originalEntry] of originalEntries) {
        if (originalEntry) {
          require.cache[resolved] = originalEntry;
        } else {
          delete require.cache[resolved];
        }
      }
    },
  };
}

module.exports = {
  freshRequireWithMocks,
};
