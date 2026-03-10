const test = require('node:test');
const assert = require('node:assert/strict');
const { FILE_UPLOAD_RULES, createFileFilter, getAllowedExtensions } = require('../utils/uploadConfig');

test('document and module upload rules stay aligned for shared formats', () => {
  const docTypes = new Set(FILE_UPLOAD_RULES.documents.allowedMimeTypes);
  const moduleTypes = new Set(FILE_UPLOAD_RULES.modules.allowedMimeTypes);

  for (const mimeType of docTypes) {
    assert.equal(moduleTypes.has(mimeType), true, `${mimeType} should be allowed for modules too`);
  }

  assert.deepEqual(getAllowedExtensions('documents'), FILE_UPLOAD_RULES.documents.allowedExtensions);
});

test('centralized file filter rejects unsupported mime types', async () => {
  const filter = createFileFilter('documents');

  await assert.rejects(
    async () => new Promise((resolve, reject) => {
      filter({}, { mimetype: 'application/xml' }, (err, accepted) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(accepted);
      });
    }),
    /Unsupported file type/i,
  );
});
